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

func (u *UserService) ListUserFolders(ctx context.Context, username string, queryParams user.Query) (*model.FoldersSummary, error) {
	return u.repo.ListFolders(ctx, username, queryParams)
}

func (u *UserService) GetUserFolder(ctx context.Context, username, slug string) (*model.Folder, error) {
	return u.repo.GetFolder(ctx, username, slug)
}
