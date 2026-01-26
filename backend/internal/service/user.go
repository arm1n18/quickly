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

func (u *UserService) ListUserFolders(ctx context.Context, userId int, username string, queryParams user.Query) (*model.FoldersSummary, error) {
	return u.repo.ListFolders(ctx, userId, username, queryParams)
}

func (u *UserService) GetUserFolder(ctx context.Context, userId int, username, slug string) (*model.Folder, error) {
	return u.repo.GetFolder(ctx, userId, username, slug)
}
