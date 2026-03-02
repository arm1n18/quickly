package service

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"strconv"
	"time"
	"web-quiz/internal/mail"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/auth"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

var (
	ErrInvalidSession      = errors.New("invalid session")
	ErrSessionTerminated   = errors.New("session terminated")
	ErrInvalidToken        = errors.New("invalid token")
	ErrInvalidTokenClaims  = errors.New("invalid token claims")
	ErrAccessTokenExpired  = errors.New("access token expired")
	ErrRefreshTokenExpired = errors.New("refresh token expired")

	ErrFailedToExecute = errors.New("failed to execute")
)

type DecryptedData struct {
	Data  []byte
	Error error
}

type AuthService struct {
	psql   *pgxpool.Pool
	redis  *redis.Client
	repo   auth.AuthRepository
	jwtkey string
	ekey   string
	mail   *mail.SMTPClient
}

func NewAuthService(psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string, mail *mail.SMTPClient) *AuthService {
	return &AuthService{
		psql:   psql,
		redis:  redis,
		ekey:   ekey,
		jwtkey: jwtkey,
		repo:   auth.NewAuthRepository(psql, redis),
		mail:   mail,
	}
}

func (a *AuthService) Register(ctx context.Context, req model.AuthRequest) *model.ErrorResponse {
	if err := utils.ValidateCredentials(req.Email, req.Password); err != nil {
		utils.LogError("AUTH:SVC:Register:ValidateCredentials", err)
		return protocol.ReturnError(400, err)
	}

	exists, err := a.repo.IsUserExists(ctx, req.Email)
	if err != nil {
		utils.LogError("AUTH:SVC:Register:IsUserExists", err.Error)
		return err
	}

	if exists {
		return protocol.ReturnError(403, protocol.ErrUserAlreadyExists)
	}

	user, err := a.repo.CreateUser(ctx, req.Email, req.Password)
	if err != nil {
		utils.LogError("AUTH:SVC:Register:CreateUser", err.Error)
		return err
	}

	if err := a.repo.SetUserInRedis(ctx, model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    req.Email,
	}); err != nil {
		utils.LogError("AUTH:SVC:Register:SetUserInRedis", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	code := utils.GenerateCode(5)

	if err := a.repo.SetVerificationCode(ctx, req.Email, model.VerificationCode{
		ID:      user.ID,
		Code:    code,
		Purpose: "register",
		Iat:     time.Now(),
		Exp:     time.Now().Add(15 * time.Minute),
	}); err != nil {
		utils.LogError("AUTH:SVC:Register:SetVerificationCode", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	log.Println(code)

	if err := a.mail.SendVerificationCode(req.Email, code); err != nil {
		a.repo.RemoveUserFromRedis(ctx, req.Email)
		a.repo.RemoveVerificationCode(ctx, req.Email, "register")

		utils.LogError("AUTH:SVC:Register:SendVerificationCode", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	return nil
}

func (a *AuthService) Login(ctx context.Context, req model.AuthRequest) *model.ErrorResponse {
	if err := utils.ValidateCredentials(req.Email, req.Password); err != nil {
		utils.LogError("AUTH:SVC:Login:ValidateCredentials", err)
		return protocol.ReturnError(400, err)
	}

	user, err := a.repo.CheckUserCredentials(ctx, req.Email, req.Password)
	if err != nil {
		utils.LogError("AUTH:SVC:Login:CheckUserCredentials", err.Error)
		return err
	}

	if err := a.repo.SetUserInRedis(ctx, model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    req.Email,
	}); err != nil {
		utils.LogError("AUTH:SVC:Login:SetUserInRedis", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	code := utils.GenerateCode(5)
	if err := a.repo.SetVerificationCode(ctx, req.Email, model.VerificationCode{
		ID:      user.ID,
		Code:    code,
		Purpose: "login",
		Iat:     time.Now(),
		Exp:     time.Now().Add(15 * time.Minute),
	}); err != nil {
		utils.LogError("AUTH:SVC:Login:SetVerificationCode", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	log.Println(code)

	// if err = a.mail.SendVerificationCode(req.Email, code); err != nil {
	// 	a.repo.RemoveUserFromRedis(ctx, req.Email)
	// 	a.repo.RemoveVerificationCode(ctx, req.Email, "login")

	//	utils.LogError("AUTH:SVC:Login:SendVerificationCode", err)
	// 	return protocol.ReturnError(500, protocol.ErrInternal)
	// }

	return nil
}

func (a *AuthService) Verify(ctx context.Context, req model.VerifyCodeRequest, headers model.UaHeaders) (*model.Tokens, *model.ErrorResponse) {
	if req.Purpose != "login" && req.Purpose != "register" {
		return nil, protocol.ReturnError(400, protocol.ErrInvalidPurpose)
	}

	code, err := a.repo.GetVerificationCode(ctx, req.Email, req.Purpose)
	if err != nil {
		utils.LogError("AUTH:SVC:Verify:GetVerificationCode", err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	} else if code == nil {
		return nil, protocol.ReturnError(500, protocol.ErrCodeNotFound)
	}

	err = a.validateCode(*code, req)
	if err != nil {
		return nil, protocol.ReturnError(403, err)
	}

	user, err := a.repo.GetUserFromRedis(ctx, req.Email)
	if err != nil && err != redis.Nil {
		utils.LogError("AUTH:SVC:Verify:GetUserFromRedis", err)
		return nil, protocol.ReturnError(500, fmt.Errorf("Не вдалося знайти користувача"))
	}

	jti := uuid.New().String()

	tokens, err := a.generateJWT(model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		JTI:      jti,
	}, true)
	if err != nil {
		utils.LogError("AUTH:SVC:Verify:generateJWT", err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	if err := a.repo.InsertRefreshToken(ctx, model.UserSessionDB{
		ID:        user.ID,
		Token:     tokens.RefreshToken,
		JTI:       jti,
		UaHeaders: headers,
	}); err != nil {
		utils.LogError("AUTH:SVC:Verify:InsertRefreshToken", err.Error)
		return nil, err
	}

	if err := a.repo.RemoveVerificationCode(ctx, user.Email, req.Purpose); err != nil {
		utils.LogError("AUTH:SVC:Verify:RemoveVerificationCode", err)
	}

	if err := a.repo.RemoveUserFromRedis(ctx, user.Email); err != nil {
		utils.LogError("AUTH:SVC:Verify:RemoveUserFromRedis", err)
	}

	return tokens, nil
}

func (a *AuthService) SendCode(ctx context.Context, req model.AuthRequest) *model.ErrorResponse {
	if req.Purpose != "login" && req.Purpose != "register" {
		return protocol.ReturnError(400, protocol.ErrInvalidPurpose)
	}

	code := utils.GenerateCode(5)

	err := a.repo.UpdateVerificationCode(ctx, req.Email, code, req.Purpose)
	if err != nil {
		utils.LogError("AUTH:SVC:SendCode:UpdateVerificationCode", err)
		return protocol.ReturnError(403, err)
	}

	log.Println(code)

	if err = a.mail.SendVerificationCode(req.Email, code); err != nil {
		utils.LogError("AUTH:SVC:SendCode:SendVerificationCode", err)
		a.repo.RemoveVerificationCode(ctx, req.Email, req.Purpose)

		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	return nil
}

func (a *AuthService) Reset(ctx context.Context, email string) *model.ErrorResponse {
	exists, err := a.repo.IsUserExists(ctx, email)
	if err != nil {
		utils.LogError("AUTH:SVC:Reset:IsUserExists", err.Error)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	if !exists {
		return nil
	}

	resetToken := a.generateResetToken()
	if resetToken == "" {
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	if err := a.repo.SetResetPassword(ctx, resetToken, email); err != nil {
		utils.LogError("AUTH:SVC:Reset:SetResetPassword", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	link := "http://localhost:4200/reset/" + resetToken

	if err := a.mail.SendResetPassword(email, link); err != nil {
		utils.LogError("AUTH:SVC:Reset:SendResetPassword", err)

		if err = a.repo.DeleteResetPassword(ctx, resetToken); err != nil {
			utils.LogError("AUTH:SVC:Reset:DeleteResetPassword", err)
		}

		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	log.Println(resetToken)

	return nil
}

func (a *AuthService) ConfirmReset(ctx context.Context, token, password string) *model.ErrorResponse {
	if len(password) < 6 {
		return protocol.ReturnError(400, errors.New("Password too short"))
	}
	if len(password) > 50 {
		return protocol.ReturnError(400, errors.New("Password too long"))
	}

	email, err := a.repo.GetResetPassword(ctx, token)
	if err != nil {
		utils.LogError("AUTH:SVC:ConfirmReset:GetResetPassword", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	if err := a.repo.ChangePassword(ctx, email, password); err != nil {
		utils.LogError("AUTH:SVC:ConfirmReset:ChangePassword", err.Error)
		return err
	}

	if err = a.repo.DeleteResetPassword(ctx, token); err != nil {
		utils.LogError("AUTH:SVC:ConfirmReset:DeleteResetPassword", err)
	}

	// send email updated

	return nil
}

func (a *AuthService) ValidReset(ctx context.Context, token string) *model.ErrorResponse {
	exists, err := a.repo.HasResetPassword(ctx, token)
	if err != nil {
		utils.LogError("AUTH:SVC:ValidReset:HasResetPassword", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	if !exists {
		return protocol.ReturnError(403, fmt.Errorf("Invalid token"))
	}

	return nil
}

func (a *AuthService) Refresh(ctx context.Context, req model.Tokens) (*model.UpdateToken, *model.ErrorResponse) {
	accessToken, err := a.ParseUserAccessToken(req.AccessToken)
	if err != nil {
		utils.LogError("AUTH:SVC:Refresh:ParseUserAccessToken", err)
		return nil, protocol.ReturnError(403, protocol.ErrInvalidCredentials)
	}

	if !accessToken.Expired {
		return nil, protocol.ReturnError(400, protocol.ErrInvalidCredentials)
	}

	refreshToken, err := a.ParseUserRefreshToken(req.RefreshToken)
	if err != nil {
		utils.LogError("AUTH:SVC:Refresh:ParseUserRefreshToken", err)
		return nil, protocol.ReturnError(403, protocol.ErrInvalidCredentials)
	}

	if refreshToken.Expired {
		return nil, protocol.ReturnError(403, protocol.ErrRefreshExpired)
	}

	if refreshToken.SUB != accessToken.SUB || refreshToken.JTI != accessToken.JTI {
		return nil, protocol.ReturnError(403, protocol.ErrSessionInvalid)
	}

	var dbToken *model.RefreshTokenDB
	if refreshToken, err := a.repo.GetRefreshToken(ctx, accessToken.SUB, accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:Refresh:GetRefreshToken", err.Error)
		return nil, err
	} else {
		dbToken = refreshToken
	}

	if dbToken.Exp.Before(time.Now()) {
		return nil, protocol.ReturnError(403, protocol.ErrRefreshExpired)
	}

	if valid := utils.VerifyHash(req.RefreshToken, []byte(dbToken.Token)); !valid {
		return nil, protocol.ReturnError(403, protocol.ErrSessionInvalid)
	}

	tokens, err := a.generateJWT(model.GenerateJWTData{
		ID:       accessToken.SUB,
		Username: accessToken.Name,
		Email:    accessToken.Email,
		JTI:      accessToken.JTI,
	}, false)
	if err != nil {
		utils.LogError("AUTH:SVC:Refresh:generateJWT", err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	return &model.UpdateToken{AccessToken: tokens.AccessToken}, nil
}

func (a *AuthService) Logout(ctx context.Context, req model.Tokens) *model.ErrorResponse {
	refreshToken, err := a.ParseUserRefreshToken(req.RefreshToken)
	if err != nil || refreshToken.Expired {
		utils.LogError("AUTH:SVC:Logout:ParseUserRefreshToken", err)
		return nil
	}

	accessToken, err := a.ParseUserAccessToken(req.AccessToken)
	if err != nil || accessToken.Expired {
		utils.LogError("AUTH:SVC:Logout:ParseUserAccessToken", err)
		return nil
	}

	if refreshToken.SUB != accessToken.SUB || refreshToken.JTI != accessToken.JTI {
		return nil
	}

	var dbToken *model.RefreshTokenDB
	if refreshToken, err := a.repo.GetRefreshToken(ctx, accessToken.SUB, accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:Logout:GetRefreshToken", err.Error)
		return err
	} else {
		dbToken = refreshToken
	}

	if !utils.VerifyHash(req.RefreshToken, []byte(dbToken.Token)) {
		return nil
	}

	if err = a.repo.TerminateSessionInRedis(accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:Logout:TerminateSessionInRedis", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	if err := a.repo.TerminateRefreshToken(ctx, dbToken.Id); err != nil {
		if err := a.redis.Del(ctx, fmt.Sprintf("terminated:session:%s", accessToken.JTI)).Err(); err != nil {
			utils.LogError("AUTH:SVC:Logout:TerminateRefreshToken", err)
		}
		return err
	}

	return nil
}

func (a *AuthService) TerminateToken(ctx context.Context, token string) *model.ErrorResponse {
	accessToken, err := a.ParseUserAccessToken(token)
	if err != nil || accessToken.Expired {
		utils.LogError("AUTH:SVC:TerminateToken:ParseUserAccessToken", err)
		return nil
	}

	if err := a.repo.TerminateSessionInRedis(accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:TerminateToken:TerminateSessionInRedis", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	return nil
}

/* ---- additional functions ---- */

// JWT

func (a *AuthService) generateJWT(data model.GenerateJWTData, withRefresh bool) (*model.Tokens, error) {
	var tokens model.Tokens

	sub, err := a.encryptDate([]byte(strconv.Itoa(data.ID)))
	if err != nil {
		log.Println(err)
		return nil, err
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      sub,
		"email":    data.Email,
		"username": data.Username,
		"avatar":   data.Avatar,
		"jti":      data.JTI,
		"exp":      time.Now().Add(time.Second * 10).Unix(),
		"iat":      time.Now().Unix(),
	})

	tokens.AccessToken, err = accessToken.SignedString([]byte(a.jwtkey))
	if err != nil {
		log.Println("Failed to sign JWT:", err)
		return nil, err
	}

	if withRefresh {
		refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub": sub,
			"jti": data.JTI,
			"exp": time.Now().Add(time.Hour * 24 * 30).Unix(),
			"iat": time.Now().Unix(),
		})

		tokens.RefreshToken, err = refreshToken.SignedString([]byte(a.jwtkey))
		if err != nil {
			log.Println("Failed to sign JWT:", err)
			return nil, err
		}
	}

	return &tokens, nil
}

func (a *AuthService) ParseUserAccessToken(accessToken string) (*model.UserAccessToken, error) {
	var expired bool

	parser := jwt.NewParser(jwt.WithoutClaimsValidation())

	claims := &jwt.MapClaims{}
	token, err := parser.ParseWithClaims(accessToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(a.jwtkey), nil
	})

	if err != nil || !token.Valid {
		log.Printf("%s: %v\n", ErrInvalidToken, err)
		return nil, ErrInvalidToken
	}

	subString, ok := (*claims)["sub"].(string)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	sub, err := a.decryptData(subString).Int()
	if err != nil {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	iatRaw, ok := (*claims)["iat"].(float64)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	iatTime := time.Unix(int64(math.Round(iatRaw)), 0)

	expRaw, ok := (*claims)["exp"].(float64)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	expTime := time.Unix(int64(math.Round(expRaw)), 0)

	expired = time.Now().After(expTime)

	jti, ok := (*claims)["jti"].(string)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	terminated, err := a.repo.IsSessionTerminated(jti)
	if err != nil {
		log.Println(ErrSessionTerminated)
		return nil, ErrSessionTerminated
	}

	if terminated {
		log.Println(ErrInvalidSession)
		return nil, ErrInvalidSession
	}

	name, ok := (*claims)["username"].(string)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	email, ok := (*claims)["email"].(string)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	avatar, ok := (*claims)["avatar"].(string)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	return &model.UserAccessToken{
		SUB:     sub,
		Name:    name,
		Email:   email,
		Avatar:  avatar,
		JTI:     jti,
		Token:   accessToken,
		Exp:     expTime,
		Iat:     iatTime,
		Expired: expired,
	}, nil
}

func (a *AuthService) ParseUserRefreshToken(refreshToken string) (*model.UserRefreshToken, error) {
	log.Println("refreshToken:", refreshToken)

	var expired bool

	parser := jwt.NewParser(jwt.WithoutClaimsValidation())

	claims := &jwt.MapClaims{}
	token, err := parser.ParseWithClaims(refreshToken, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(a.jwtkey), nil
	})

	if err != nil || !token.Valid {
		log.Printf("%s: %v\n", ErrInvalidToken, err)
		return nil, ErrInvalidToken

	}

	subString, ok := (*claims)["sub"].(string)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	sub, err := a.decryptData(subString).Int()
	if err != nil {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	iatRaw, ok := (*claims)["iat"].(float64)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	iatTime := time.Unix(int64(math.Round(iatRaw)), 0)

	expRaw, ok := (*claims)["exp"].(float64)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	expTime := time.Unix(int64(math.Round(expRaw)), 0)

	expired = time.Now().After(expTime)

	userJTI, ok := (*claims)["jti"].(string)
	if !ok {
		log.Printf("%s: %v\n", ErrInvalidTokenClaims, err)
		return nil, ErrInvalidTokenClaims
	}

	terminated, err := a.repo.IsSessionTerminated(userJTI)
	if err != nil {
		log.Println(ErrSessionTerminated)
		return nil, ErrSessionTerminated
	}

	if terminated {
		log.Println(ErrInvalidSession)
		return nil, ErrInvalidSession
	}

	return &model.UserRefreshToken{
		SUB:     sub,
		JTI:     userJTI,
		Token:   refreshToken,
		Exp:     expTime,
		Iat:     iatTime,
		Expired: expired,
	}, nil
}

// Reset Token

func (a *AuthService) generateResetToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return ""
	}

	token := base64.URLEncoding.EncodeToString(b)

	return token
}

// ENCRYPT

func (a *AuthService) encryptDate(data []byte) (string, error) {
	key, err := hex.DecodeString(a.ekey)
	if err != nil {
		log.Fatalf("Invalid EKEY hex: %v", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		log.Printf("Error encrypting: %v", err)
		return "", err
	}

	nonce := make([]byte, 12)
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		panic(err.Error())
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		panic(err.Error())
	}

	ciphertext := aesgcm.Seal(nil, nonce, data, nil)

	result := append(nonce, ciphertext...)

	return hex.EncodeToString(result), nil
}

func (a *AuthService) decryptData(encryptedData string) *DecryptedData {
	data, err := hex.DecodeString(encryptedData)
	if err != nil {
		log.Printf("Error decoding: %v", err)
		return nil
	}

	nonce, ciphertext := data[:12], data[12:]

	key, err := hex.DecodeString(a.ekey)
	if err != nil {
		log.Fatalf("Invalid EKEY hex: %v", err)
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		log.Printf("Error: %v", err)
		return &DecryptedData{
			Error: ErrInvalidToken,
		}
	}

	aesgcm, err := cipher.NewGCM(block)
	if err != nil {
		log.Printf("Error: %v", err)
		return &DecryptedData{
			Error: ErrInvalidToken,
		}
	}

	plaintext, err := aesgcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		log.Printf("Error: %v", err)
		return &DecryptedData{
			Error: ErrInvalidToken,
		}
	}

	return &DecryptedData{Data: plaintext}
}

func (d DecryptedData) Int() (int, error) {
	if d.Error != nil {
		return -1, d.Error
	}

	n, err := strconv.Atoi(string(d.Data))
	if err != nil {
		log.Printf("Error converting decrypted plaintext to integer: %v", err)
		return -1, err
	}

	return n, nil
}

func (d DecryptedData) Result() (string, error) {
	if d.Error != nil {
		return "", d.Error
	}

	return string(d.Data), nil
}

// VALIDATE

func (a *AuthService) validateCode(code model.VerificationCode, req model.VerifyCodeRequest) error {
	now := time.Now()

	if now.Before(code.BanUntil) {
		return fmt.Errorf("досягнуто ліміт спроб, спробуйте пізніше")
	}

	if code.Purpose != req.Purpose {
		return fmt.Errorf("невірний код для цієї операції")
	}

	log.Printf("Exp: %v, Now: %v\n", code.Exp, now)
	if code.Exp.Before(now) {
		return fmt.Errorf("верифікаційний код не є дійсним")
	}

	if code.Code != req.Code {
		if err := a.repo.IncrementVerificationAttempts(context.Background(), req.Email, req.Purpose); err != nil {
			return fmt.Errorf("помилка оновлення спроб: %w", err)
		}
		return fmt.Errorf("невірний верифікаційний код")
	}

	return nil
}

func (a *AuthService) SetCookie(c *fiber.Ctx, token string) {
	cookie := new(fiber.Cookie)
	cookie.Name = "token"
	cookie.Value = token
	cookie.Expires = time.Now().Add(time.Hour * 24 * 30)
	cookie.MaxAge = 60 * 60 * 24 * 30
	cookie.Path = "/"
	cookie.HTTPOnly = true
	cookie.Secure = false
	c.Cookie(cookie)
}

func (a *AuthService) RemoveCookie(c *fiber.Ctx, key string) {
	log.Println("removed")
	c.Cookie(&fiber.Cookie{
		Name:    key,
		Value:   "",
		Expires: time.Now().Add(-time.Hour),
	})
}
