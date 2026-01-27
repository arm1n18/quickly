package service

import (
	"context"
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"strconv"
	"time"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/auth"
	"web-quiz/internal/utils"

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
}

func NewAuthService(psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string) *AuthService {
	return &AuthService{
		psql:   psql,
		redis:  redis,
		ekey:   ekey,
		jwtkey: jwtkey,
		repo:   auth.NewAuthRepository(psql, redis),
	}
}

func (a *AuthService) Register(ctx context.Context, req model.AuthRequest) (*model.SuccessResponse, *model.ErrorResponse) {
	if err := utils.ValidateCredentials(req.Email, req.Password); err != nil {
		log.Println(err)

		return nil, protocol.ReturnError(400, err)
	}

	exists, err := a.repo.IsUserExists(ctx, req.Email)
	if err != nil {
		log.Println(err)

		return nil, protocol.ReturnError(500, err)
	}

	if exists {
		return nil, protocol.ReturnError(403, protocol.ErrUserAlreadyExists)
	}

	user, err := a.repo.CreateUser(ctx, req.Email, req.Password)
	if err != nil {
		return nil, protocol.ReturnError(500, err)
	}

	if err = a.repo.SetUserInRedis(ctx, model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    req.Email,
	}); err != nil {
		log.Println(err)

		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	code := utils.GenerateCode(6)

	if err = a.repo.SetVerificationCode(ctx, req.Email, model.VerificationCode{
		ID:      user.ID,
		Code:    code,
		Purpose: "register",
		Iat:     time.Now(),
		Exp:     time.Now().Add(15 * time.Minute),
	}); err != nil {
		log.Println(err)

		return nil, protocol.ReturnError(500, err)
	}
	log.Println(code)

	return &model.SuccessResponse{Success: true, Message: "Код було успішно надіслано"}, nil
}

func (a *AuthService) Login(ctx context.Context, req model.AuthRequest) (*model.SuccessResponse, *model.ErrorResponse) {
	if err := utils.ValidateCredentials(req.Email, req.Password); err != nil {
		log.Println(err)
		return nil, protocol.ReturnError(400, err)
	}

	user, err := a.repo.CheckUserCredentials(ctx, req.Email, req.Password)
	if err != nil {
		log.Println(err)
		return nil, protocol.ReturnError(403, fmt.Errorf("Пошта та пароль не співпадають"))
	}

	if err = a.repo.SetUserInRedis(ctx, model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    req.Email,
	}); err != nil {
		log.Println(err)

		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	code := utils.GenerateCode(6)
	if err = a.repo.SetVerificationCode(ctx, req.Email, model.VerificationCode{
		ID:      user.ID,
		Code:    code,
		Purpose: "login",
		Iat:     time.Now(),
	}); err != nil {
		log.Println(err)

		return nil, protocol.ReturnError(500, err)
	}

	log.Println(code)

	return &model.SuccessResponse{Success: true, Message: "Код було успішно надіслано"}, nil
}

func (a *AuthService) Verify(ctx context.Context, req model.VerifyCodeRequest, headers model.UaHeaders) (*model.Tokens, *model.ErrorResponse) {
	if req.Purpose != "login" && req.Purpose != "register" {
		return nil, protocol.ReturnError(400, protocol.ErrInvalidPurpose)
	}

	code, err := a.repo.GetVerificationCode(ctx, req.Email, req.Purpose)
	if err != nil {
		log.Println(err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	} else if code == nil {
		return nil, protocol.ReturnError(500, protocol.ErrCodeNotFound)
	}

	err = a.validateCode(*code, req)
	if err != nil {
		return nil, protocol.ReturnError(403, fmt.Errorf("Код не є дійсним"))
	}

	user, err := a.repo.GetUserFromRedis(ctx, req.Email)
	if err != nil && err != redis.Nil {
		log.Println("Не вдалося знайти користувача")
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
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	if err = a.repo.InsertRefreshToken(ctx, model.UserSessionDB{
		ID:        user.ID,
		Token:     tokens.RefreshToken,
		JTI:       jti,
		UaHeaders: headers,
	}); err != nil {
		return nil, protocol.ReturnError(500, err)
	}

	if err := a.repo.RemoveVerificationCode(ctx, user.Email, req.Purpose); err != nil {
		log.Println(err)
	}

	if err := a.repo.RemoveUserFromRedis(ctx, user.Email); err != nil {
		log.Println(err)
	}

	return tokens, nil
}

func (a *AuthService) SendCode(ctx context.Context, req model.AuthRequest) (*model.SuccessResponse, *model.ErrorResponse) {
	if req.Purpose != "login" && req.Purpose != "register" {
		return nil, protocol.ReturnError(400, protocol.ErrInvalidPurpose)
	}

	code := utils.GenerateCode(6)

	log.Println(code)

	err := a.repo.UpdateVerificationCode(ctx, req.Email, code, req.Purpose)
	if err != nil {
		return nil, protocol.ReturnError(403, err)
	}

	return &model.SuccessResponse{Success: true, Message: "Новий код було успішно надіслано"}, nil
}

func (a *AuthService) Refresh(ctx context.Context, req model.Tokens) (*model.UpdateToken, *model.ErrorResponse) {
	accessToken, err := a.ParseUserAccessToken(req.AccessToken)
	if err != nil {
		return nil, protocol.ReturnError(403, protocol.ErrInvalidCredentials)
	}

	if !accessToken.Expired {
		return nil, protocol.ReturnError(400, protocol.ErrInvalidCredentials)
	}

	refreshToken, err := a.ParseUserRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, protocol.ReturnError(403, protocol.ErrInvalidCredentials)
	}

	if refreshToken.Expired {
		return nil, protocol.ReturnError(403, protocol.ErrRefreshExpired)
	}

	dbToken, err := a.repo.GetRefreshToken(ctx, accessToken.SUB, accessToken.JTI)
	if err != nil {
		return nil, protocol.ReturnError(500, err)
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
		log.Printf("помилка при генерації токенів: %v\n", err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	return &model.UpdateToken{AccessToken: tokens.AccessToken}, nil
}

func (a *AuthService) Logout(ctx context.Context, req model.Tokens) (*model.SuccessResponse, *model.ErrorResponse) {
	accessToken, err := a.ParseUserAccessToken(req.AccessToken)
	if err != nil {
		log.Println(err)
		return nil, protocol.ReturnError(403, protocol.ErrInvalidCredentials)
	}

	if accessToken.Expired {
		return nil, protocol.ReturnError(400, protocol.ErrInvalidCredentials)
	}

	_, err = a.ParseUserRefreshToken(req.RefreshToken)
	if err != nil {
		log.Println(err)
		return nil, protocol.ReturnError(403, protocol.ErrInvalidCredentials)
	}

	dbToken, err := a.repo.GetRefreshToken(ctx, accessToken.SUB, accessToken.JTI)
	if err != nil {
		log.Println(err)
		return nil, protocol.ReturnError(500, err)
	}

	if valid := utils.VerifyHash(req.RefreshToken, []byte(dbToken.Token)); !valid {
		return nil, protocol.ReturnError(403, protocol.ErrSessionInvalid)
	}

	err = a.repo.TerminateSessionInRedis(accessToken.JTI)
	if err != nil {
		log.Println(err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	err = a.repo.TerminateRefreshToken(ctx, dbToken.Id)
	if err != nil {
		if err := a.redis.Del(ctx, fmt.Sprintf("terminated:session:%s", accessToken.JTI)).Err(); err != nil {
			log.Printf("rollback failed (%s): %v\n", accessToken.JTI, err)
		}
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	return &model.SuccessResponse{Success: true, Message: "Ви вийшли з акаунту"}, nil
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
		"exp":      time.Now().Add(time.Minute * 15).Unix(),
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
