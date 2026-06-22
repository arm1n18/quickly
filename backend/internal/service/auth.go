package service

import (
	"context"
	"log"
	"time"
	"web-quiz/internal/mail"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/auth"
	"web-quiz/internal/repository/session"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/repository/verification"
	"web-quiz/internal/utils"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type AuthService struct {
	authRepo    auth.AuthRepository
	userRepo    user.UserRepository
	verifRepo   verification.VerificationRepository
	sessionRepo session.SessionRepository

	jwtSvc JWTService

	mail *mail.SMTPClient
}

func NewAuthService(
	authRepo auth.AuthRepository,
	userRepo user.UserRepository,
	verifRepo verification.VerificationRepository,
	sessionRepo session.SessionRepository,
	jwtSvc JWTService,
	mail *mail.SMTPClient,
) *AuthService {
	return &AuthService{
		authRepo:    authRepo,
		userRepo:    userRepo,
		verifRepo:   verifRepo,
		sessionRepo: sessionRepo,
		jwtSvc:      jwtSvc,
		mail:        mail,
	}
}

func (s *AuthService) Register(
	ctx context.Context,
	req model.AuthRequest,
) *protocol.AppError {
	if err := utils.ValidateCredentials(req.Email, req.Password); err != nil {
		utils.LogError("AUTH:SVC:Register:ValidateCredentials", err.Err)
		return protocol.ErrBadRequest
	}

	exists, err := s.userRepo.Exists(ctx, req.Email)
	if err != nil {
		utils.LogError("AUTH:SVC:Register:IsUserExists", err.Err)
		return err
	}

	if exists {
		return protocol.ErrUserAlreadyExists
	}

	user, err := s.userRepo.Create(ctx, req.Email, req.Password)
	if err != nil {
		utils.LogError("AUTH:SVC:Register:CreateUser", err.Err)
		return err
	}

	if err := s.userRepo.CacheUser(ctx, model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    req.Email,
	}); err != nil {
		utils.LogError("AUTH:SVC:Register:CacheUser", err.Err)
		return err
	}

	code := utils.GenerateOTP(5)

	if err := s.verifRepo.Save(ctx, req.Email, model.VerificationCode{
		ID:      user.ID,
		Code:    code,
		Purpose: "register",
		Iat:     time.Now(),
		Exp:     time.Now().Add(15 * time.Minute),
	}); err != nil {
		utils.LogError("AUTH:SVC:Register:Save", err.Err)
		return err
	}

	log.Println(code)

	if err := s.mail.SendVerificationCode(req.Email, code); err != nil {
		s.userRepo.DeleteCachedUser(ctx, req.Email)
		s.verifRepo.Delete(ctx, req.Email, "register")

		utils.LogError("AUTH:SVC:Register:SendVerificationCode", err.Err)
		return err
	}

	return nil
}

func (s *AuthService) Login(ctx context.Context, req model.AuthRequest) *protocol.AppError {
	if err := utils.ValidateCredentials(req.Email, req.Password); err != nil {
		utils.LogError("AUTH:SVC:Login:ValidateCredentials", err.Err)
		return err
	}

	user, err := s.authRepo.GetCredentials(ctx, req.Email, req.Password)
	if err != nil {
		utils.LogError("AUTH:SVC:Login:CheckUserCredentials", err.Err)
		return err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.HashPassword), []byte(req.Password)); err != nil {
		return protocol.ErrForbidden
	}

	if err := s.userRepo.CacheUser(ctx, model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    req.Email,
	}); err != nil {
		utils.LogError("AUTH:SVC:Login:SetUserInRedis", err.Err)
		return err
	}

	code := utils.GenerateOTP(5)
	if err := s.verifRepo.Save(ctx, req.Email, model.VerificationCode{
		ID:      user.ID,
		Code:    code,
		Purpose: "login",
		Iat:     time.Now(),
		Exp:     time.Now().Add(15 * time.Minute),
	}); err != nil {
		utils.LogError("AUTH:SVC:Login:SetVerificationCode", err.Err)
		return err
	}

	log.Println(code)

	// if err = s.mail.SendVerificationCode(req.Email, code); err != nil {
	// 	s.authRepo.RemoveUserFromRedis(ctx, req.Email)
	// 	s.authRepo.RemoveVerificationCode(ctx, req.Email, "login")

	//	utils.LogError("AUTH:SVC:Login:SendVerificationCode", err.Err)
	// 	return err
	// }

	return nil
}

func (s *AuthService) Verify(ctx context.Context, req model.VerifyCodeRequest, headers model.UaHeaders) (*model.Tokens, *protocol.AppError) {
	if req.Purpose != "login" && req.Purpose != "register" {
		return nil, protocol.ErrInvalidPurpose
	}

	code, err := s.verifRepo.Get(ctx, req.Email, req.Purpose)
	if err != nil {
		utils.LogError("AUTH:SVC:Verify:GetVerificationCode", err.Err)
		return nil, err
	} else if code == nil {
		return nil, protocol.ErrCodeNotFound
	}

	err = utils.ValidateCode(*code, req)
	if err != nil {
		return nil, err
	}
	if code.Code != req.Code {
		if err := s.verifRepo.IncrAttempts(ctx, req.Email, req.Purpose); err != nil {
			return nil, err
		}
		return nil, protocol.ErrCodeMismatch
	}

	user, err := s.userRepo.GetCachedUser(ctx, req.Email)
	if err != nil {
		utils.LogError("AUTH:SVC:Verify:GetCachedUser", err.Err)
		return nil, err
	}

	jti := uuid.New().String()

	tokens, err := s.jwtSvc.GenerateJWT(model.GenerateJWTData{
		ID:       user.ID,
		Username: user.Username,
		Email:    user.Email,
		JTI:      jti,
	}, true)
	if err != nil {
		utils.LogError("AUTH:SVC:Verify:generateJWT", err.Err)
		return nil, err
	}

	if err := s.sessionRepo.CreateRefreshToken(ctx, model.UserSessionDB{
		ID:        user.ID,
		Token:     tokens.Refresh,
		JTI:       jti,
		UaHeaders: headers,
	}); err != nil {
		utils.LogError("AUTH:SVC:Verify:CreateRefreshToken", err.Err)
		return nil, err
	}

	if err := s.verifRepo.Delete(ctx, user.Email, req.Purpose); err != nil {
		utils.LogError("AUTH:SVC:Verify:Delete", err.Err)
	}

	if err := s.userRepo.DeleteCachedUser(ctx, user.Email); err != nil {
		utils.LogError("AUTH:SVC:Verify:DeleteCachedUser", err.Err)
	}

	return tokens, nil
}

func (s *AuthService) SendCode(ctx context.Context, req model.AuthRequest) *protocol.AppError {
	if req.Purpose != "login" && req.Purpose != "register" {
		return protocol.ErrInvalidPurpose
	}

	code := utils.GenerateOTP(5)

	err := s.verifRepo.Replace(ctx, req.Email, code, req.Purpose)
	if err != nil {
		utils.LogError("AUTH:SVC:SendCode:UpdateVerificationCode", err.Err)
		return err
	}

	log.Println(code)

	if err = s.mail.SendVerificationCode(req.Email, code); err != nil {
		utils.LogError("AUTH:SVC:SendCode:SendVerificationCode", err.Err)
		s.verifRepo.Delete(ctx, req.Email, req.Purpose)

		return err
	}

	return nil
}

func (s *AuthService) Reset(ctx context.Context, email string) *protocol.AppError {
	exists, err := s.userRepo.Exists(ctx, email)
	if err != nil {
		utils.LogError("AUTH:SVC:Reset:IsUserExists", err.Err)
		return err
	}

	if !exists {
		return nil
	}

	resetToken := utils.GenerateResetToken()
	if resetToken == "" {
		return err
	}

	if err := s.authRepo.SetResetToken(ctx, resetToken, email); err != nil {
		utils.LogError("AUTH:SVC:Reset:SetResetToken", err.Err)
		return err
	}

	link := "http://localhost:4200/reset/" + resetToken

	if err := s.mail.SendResetPassword(email, link); err != nil {
		utils.LogError("AUTH:SVC:Reset:SendResetPassword", err.Err)

		if err = s.authRepo.DeleteResetToken(ctx, resetToken); err != nil {
			utils.LogError("AUTH:SVC:Reset:DeleteResetToken", err.Err)
		}

		return err
	}

	log.Println(resetToken)

	return nil
}

func (s *AuthService) ConfirmReset(ctx context.Context, token, password string) *protocol.AppError {
	if len(password) < 6 {
		return protocol.ErrPasswordTooShort
	}
	if len(password) > 50 {
		return protocol.ErrPasswordTooLong
	}

	email, err := s.authRepo.GetResetToken(ctx, token)
	if err != nil {
		utils.LogError("AUTH:SVC:ConfirmReset:GetResetToken", err.Err)
		return err
	}

	if err := s.authRepo.UpdatePassword(ctx, email, password); err != nil {
		utils.LogError("AUTH:SVC:ConfirmReset:UpdatePassword", err.Err)
		return err
	}

	if err = s.authRepo.DeleteResetToken(ctx, token); err != nil {
		utils.LogError("AUTH:SVC:ConfirmReset:DeleteResetToken", err.Err)
	}

	// send email updated

	return nil
}

func (s *AuthService) ValidReset(ctx context.Context, token string) *protocol.AppError {
	exists, err := s.authRepo.HasResetToken(ctx, token)
	if err != nil {
		utils.LogError("AUTH:SVC:ValidReset:HasResetToken", err.Err)
		return err
	}

	if !exists {
		return protocol.ErrInvalidToken
	}

	return nil
}

func (s *AuthService) Refresh(ctx context.Context, req model.Tokens) (*model.UpdateToken, *protocol.AppError) {
	accessToken, err := s.jwtSvc.ParseAccessToken(req.Access)
	if err != nil {
		utils.LogError("AUTH:SVC:Refresh:ParseAccessToken", err.Err)
		return nil, protocol.ErrInvalidCredentials
	}

	if !accessToken.Expired {
		return nil, protocol.ErrInvalidCredentials
	}

	refreshToken, err := s.jwtSvc.ParseRefreshToken(req.Refresh)
	if err != nil {
		utils.LogError("AUTH:SVC:Refresh:ParseRefreshToken", err.Err)
		return nil, protocol.ErrInvalidCredentials
	}

	if refreshToken.Expired {
		return nil, protocol.ErrInvalidToken
	}

	if refreshToken.SUB != accessToken.SUB || refreshToken.JTI != accessToken.JTI {
		return nil, protocol.ErrnIvalidSession
	}

	var dbToken *model.RefreshTokenDB
	if refreshToken, err := s.sessionRepo.GetRefreshTokenByJTI(ctx, accessToken.SUB, accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:Refresh:GetRefreshTokenByJTI", err.Err)
		return nil, err
	} else {
		dbToken = refreshToken
	}

	if dbToken.Exp.Before(time.Now()) {
		return nil, protocol.ErrInvalidToken
	}

	if valid := utils.VerifyHash(req.Refresh, []byte(dbToken.Token)); !valid {
		return nil, protocol.ErrnIvalidSession
	}

	tokens, err := s.jwtSvc.GenerateJWT(model.GenerateJWTData{
		ID:       accessToken.SUB,
		Username: accessToken.Name,
		Email:    accessToken.Email,
		JTI:      accessToken.JTI,
	}, false)
	if err != nil {
		utils.LogError("AUTH:SVC:Refresh:GenerateJWT", err.Err)
		return nil, protocol.ErrInternal.Wrap(err.Err)
	}

	return &model.UpdateToken{AccessToken: tokens.Access}, nil
}

func (s *AuthService) Logout(ctx context.Context, req model.Tokens) *protocol.AppError {
	refreshToken, err := s.jwtSvc.ParseRefreshToken(req.Refresh)
	if err != nil || refreshToken.Expired {
		utils.LogError("AUTH:SVC:Logout:ParseRefreshToken", err.Err)
		return nil
	}

	accessToken, err := s.jwtSvc.ParseAccessToken(req.Access)
	if err != nil || accessToken.Expired {
		utils.LogError("AUTH:SVC:Logout:ParseAccessToken", err.Err)
		return nil
	}

	if refreshToken.SUB != accessToken.SUB || refreshToken.JTI != accessToken.JTI {
		return nil
	}

	var dbToken *model.RefreshTokenDB
	if refreshToken, err := s.sessionRepo.GetRefreshTokenByJTI(ctx, accessToken.SUB, accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:Logout:GetRefreshTokenByJTI", err.Err)
		return err
	} else {
		dbToken = refreshToken
	}

	if !utils.VerifyHash(req.Refresh, []byte(dbToken.Token)) {
		return nil
	}

	if err = s.sessionRepo.RevokeSession(ctx, accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:Logout:TerminateSessionInRedis", err.Err)
		return err
	}

	if err := s.sessionRepo.RevokeRefreshToken(ctx, dbToken.Id); err != nil {
		if err := s.sessionRepo.RemoveRevokedToken(ctx, accessToken.Token); err != nil {
			utils.LogError("AUTH:SVC:Logout:TerminateRefreshToken", err.Err)
		}
		return err
	}

	return nil
}

func (s *AuthService) TerminateToken(ctx context.Context, token string) *protocol.AppError {
	accessToken, err := s.jwtSvc.ParseAccessToken(token)
	if err != nil || accessToken.Expired {
		utils.LogError("AUTH:SVC:TerminateToken:ParseAccessToken", err.Err)
		return nil
	}

	if err := s.sessionRepo.RevokeSession(ctx, accessToken.JTI); err != nil {
		utils.LogError("AUTH:SVC:TerminateToken:TerminateSessionInRedis", err.Err)
		return err
	}

	return nil
}
