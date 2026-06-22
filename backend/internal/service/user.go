package service

import (
	"context"
	"regexp"
	"strings"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/session"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/utils"
)

type UserService struct {
	repo        user.UserRepository
	sessionRepo session.SessionRepository

	jwtSvc JWTService
}

func NewUserService(
	repo user.UserRepository,
	sessionRepo session.SessionRepository,
	jwtSvc JWTService,
) *UserService {
	return &UserService{
		repo:        repo,
		sessionRepo: sessionRepo,
		jwtSvc:      jwtSvc,
	}
}

func (s *UserService) GetProfile(ctx context.Context, username string) (*model.Author, *protocol.AppError) {
	return s.repo.Get(ctx, username)
}

func (s *UserService) UpdateProfile(ctx context.Context, token model.AccessToken, username string) (string, *protocol.AppError) {
	if len(strings.ReplaceAll(username, " ", "")) == 0 {
		return "", protocol.ErrUsernameRequired
	}

	if !utils.InRange(username, 4, 50) {
		return "", protocol.ErrInvalidUsernameLength
	}

	match, mErr := regexp.MatchString("^[A-Za-z0-9]+$", username)
	if mErr != nil {
		return "", protocol.ErrInvalidUsername.Wrap(mErr)
	}

	if !match {
		return "", protocol.ErrInvalidUsername
	}

	data := model.GenerateJWTData{
		ID:       token.SUB,
		Username: username,
		Email:    token.Email,
		Avatar:   token.Avatar,
		JTI:      token.JTI,
	}

	tokens, err := s.jwtSvc.GenerateJWT(data, false)
	if err != nil {
		utils.LogError("USER:SVC:UpdateUserInfo:generateJWT", err.Err)
		return "", err
	}

	if err := s.repo.Update(ctx, token.SUB, username); err != nil {
		utils.LogError("USER:SVC:UpdateUserInfo:UpdateUserInfo", err.Err)
		return "", err
	}

	if err = s.sessionRepo.RevokeToken(ctx, token.Token); err != nil {
		utils.LogError("USER:SVC:UpdateUserInfo:TerminateTokenInRedis", err.Err)
	}

	return tokens.Access, nil
}
