package service

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/repository/folder"

	"github.com/jackc/pgx/v5/pgxpool"
)

type FolderService struct {
	psql *pgxpool.Pool
	repo folder.FolderRepository
}

func NewFolderService(psql *pgxpool.Pool) *FolderService {
	return &FolderService{
		psql: psql,
		repo: folder.NewFolderRepository(psql),
	}
}

func (f *FolderService) ListUserFolders(ctx context.Context, userID int, username string, queryParams folder.Query) (*model.FoldersSummary, *model.ErrorResponse) {
	return f.repo.ListFolders(ctx, userID, username, queryParams)
}

func (f *FolderService) GetFolder(ctx context.Context, userID int, username, slug string) (*model.Folder, *model.ErrorResponse) {
	return f.repo.GetFolder(ctx, userID, username, slug)
}

func (f *FolderService) CreateFolder(ctx context.Context, userID int, title string) (string, *model.ErrorResponse) {
	return f.repo.CreateFolder(ctx, userID, title)
}

func (f *FolderService) UpdateFolder(ctx context.Context, userID int, slug string, title string) (string, *model.ErrorResponse) {
	return f.repo.UpdateFolder(ctx, userID, slug, title)
}

func (f *FolderService) DeleteFolder(ctx context.Context, userID int, username, slug string) *model.ErrorResponse {
	return f.repo.DeleteFolder(ctx, userID, username, slug)
}

func (f *FolderService) AddModuleToFolder(ctx context.Context, userID, moduleID int, slug string) *model.ErrorResponse {
	return f.repo.AddModuleToFolder(ctx, userID, moduleID, slug)
}

func (f *FolderService) RemoveModuleFromFolder(ctx context.Context, userID, moduleID int, slug string) *model.ErrorResponse {
	return f.repo.DeleteModuleFromFolder(ctx, userID, moduleID, slug)
}
