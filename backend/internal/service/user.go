package service

import (
	"context"
	"fmt"
	"regexp"
	"strings"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserService struct {
	psql *pgxpool.Pool
	repo user.UserRepository
}

func NewUserService(psql *pgxpool.Pool) *UserService {
	return &UserService{
		psql: psql,
		repo: user.NewUserRepository(psql),
	}
}

func (u *UserService) GetUserProfile(ctx context.Context, username string) (*model.Author, *model.ErrorResponse) {
	return u.repo.GetProfile(ctx, username)
}

func (u *UserService) UpdateUserInfo(ctx context.Context, authSvc *AuthService, token model.UserAccessToken, username string) (string, *model.ErrorResponse) {
	if len(strings.ReplaceAll(username, " ", "")) == 0 {
		return "", protocol.ReturnError(400, fmt.Errorf("Імʼя не повинне бути порожнім."))
	}

	match, err := regexp.MatchString("^[A-Za-z0-9]+$", username)
	if err != nil {
		return "", protocol.ReturnError(500, protocol.ErrInternal)
	}

	if !match {
		return "", protocol.ReturnError(400, fmt.Errorf("Імʼя може містити лише латинські літери та цифри."))
	}

	data := model.GenerateJWTData{
		ID:       token.SUB,
		Username: username,
		Email:    token.Email,
		Avatar:   token.Avatar,
		JTI:      token.JTI,
	}

	tokens, err := authSvc.generateJWT(data, false)
	if err != nil {
		utils.LogError("USER:SVC:UpdateUserInfo:generateJWT", err)
		return "", protocol.ReturnError(500, protocol.ErrInternal)
	}

	if err := u.repo.UpdateUserInfo(ctx, token.SUB, username); err != nil {
		utils.LogError("USER:SVC:UpdateUserInfo:UpdateUserInfo", err.Error)
		return "", err
	}

	if err = authSvc.repo.TerminateTokenInRedis(token.Token); err != nil {
		utils.LogError("USER:SVC:UpdateUserInfo:TerminateTokenInRedis", err)
	}

	return tokens.AccessToken, nil
}
