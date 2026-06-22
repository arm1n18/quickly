package folder

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Query struct {
	Name   string
	LastID int
}

type FolderRepository interface {
	/* ---- psql ---- */

	List(ctx context.Context, userID int, username string, q Query) (*model.FoldersSummary, *protocol.AppError)

	Get(ctx context.Context, userID int, username, slug string) (*model.Folder, *protocol.AppError)

	Create(ctx context.Context, userID int, title string) (string, *protocol.AppError)
	Update(ctx context.Context, userID int, oldSlug, title string) (string, *protocol.AppError)
	Delete(ctx context.Context, userID int, username, slug string) *protocol.AppError

	AddModule(ctx context.Context, userID, moduleID int, slug string) *protocol.AppError
	RemoveModule(ctx context.Context, userID, moduleID int, slug string) *protocol.AppError
}

type folderRepo struct {
	psql *pgxpool.Pool
}

func NewFolderRepository(psql *pgxpool.Pool) FolderRepository {
	return &folderRepo{psql: psql}
}
