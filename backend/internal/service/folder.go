package service

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/folder"
	"web-quiz/internal/utils"
)

type FolderService struct {
	repo folder.FolderRepository
}

func NewFolderService(repo folder.FolderRepository) *FolderService {
	return &FolderService{
		repo: repo,
	}
}

func (f *FolderService) ListFolders(
	ctx context.Context,
	userID int,
	username string,
	queryParams folder.Query,
) (*model.FoldersSummary, *protocol.AppError) {
	return f.repo.List(ctx, userID, username, queryParams)
}

func (f *FolderService) GetFolder(
	ctx context.Context,
	userID int,
	username, slug string,
) (*model.Folder, *protocol.AppError) {
	if !utils.InRange(slug, 1, 50) {
		return nil, protocol.ErrInvalidFolderTitle
	}

	return f.repo.Get(ctx, userID, username, slug)
}

func (f *FolderService) CreateFolder(
	ctx context.Context,
	userID int,
	title string,
) (string, *protocol.AppError) {
	if !utils.InRange(title, 1, 50) {
		return "", protocol.ErrInvalidFolderTitle
	}

	return f.repo.Create(ctx, userID, title)
}

func (f *FolderService) UpdateFolder(
	ctx context.Context,
	userID int,
	slug string,
	title string,
) (string, *protocol.AppError) {
	if !utils.InRange(title, 1, 50) {
		return "", protocol.ErrInvalidFolderTitle
	}

	return f.repo.Update(ctx, userID, slug, title)
}

func (f *FolderService) DeleteFolder(
	ctx context.Context,
	userID int,
	username, slug string,
) *protocol.AppError {
	if !utils.InRange(slug, 1, 50) {
		return protocol.ErrInvalidFolderTitle
	}

	return f.repo.Delete(ctx, userID, username, slug)
}

func (f *FolderService) AddModule(
	ctx context.Context,
	userID, moduleID int,
	slug string,
) *protocol.AppError {
	if !utils.InRange(slug, 1, 50) {
		return protocol.ErrInvalidFolderTitle
	}

	if moduleID < 1 {
		return protocol.ErrInvalidRequestBody
	}

	return f.repo.AddModule(ctx, userID, moduleID, slug)
}

func (f *FolderService) RemoveModule(
	ctx context.Context,
	userID, moduleID int,
	slug string,
) *protocol.AppError {
	if !utils.InRange(slug, 1, 50) {
		return protocol.ErrInvalidFolderTitle
	}

	if moduleID < 1 {
		return protocol.ErrInvalidRequestBody
	}

	return f.repo.RemoveModule(ctx, userID, moduleID, slug)
}
