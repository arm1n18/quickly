package service

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/repository/user"

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

func (u *UserService) GetUserProfile(ctx context.Context, username string) (*model.Author, error) {
	return u.repo.GetProfile(ctx, username)
}
