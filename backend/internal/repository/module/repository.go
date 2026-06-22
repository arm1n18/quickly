package module

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

type FindMoulesQuery struct {
	Title    string
	Keywords []string
	Limit    string
	LastID   int
}

type ModuleRepository interface {
	/* ---- psql ---- */

	GetByID(ctx context.Context, userID, id int) (*model.Module, *protocol.AppError)
	GetAccess(ctx context.Context, moduleID int) (bool, int, *protocol.AppError)

	Find(ctx context.Context, userID int, q FindMoulesQuery) (*model.ModulesSummaryResponse, *protocol.AppError)

	ListByUserID(ctx context.Context, userID int, username string, q Query) (*model.ModulesSummaryResponse, *protocol.AppError)
	ListSavedByUserID(ctx context.Context, userID int, q Query) (*model.ModulesSummaryResponse, *protocol.AppError)

	Create(ctx context.Context, userID int, module model.CreateModuleRequest) (*model.CreateModuleResponse, *protocol.AppError)
	Update(ctx context.Context, userID int, module model.UpdateModuleRequest) *protocol.AppError
	Delete(ctx context.Context, userID int, moduleID int) *protocol.AppError

	UpdateCard(ctx context.Context, userID int, module model.UpdateModuleCard) *protocol.AppError

	Save(ctx context.Context, userID, moduleID int) *protocol.AppError
	Unsave(ctx context.Context, userID, moduleID int) *protocol.AppError

	SearchKeywords(ctx context.Context, title string) ([]model.Keyword, *protocol.AppError)
	GetKeywordsBySlug(ctx context.Context, slugs []string) ([]model.Keyword, *protocol.AppError)
	CreateKeywords(ctx context.Context, keywords []string) *protocol.AppError
}

type moduleRepo struct {
	psql *pgxpool.Pool
}

func NewModuleRepository(psql *pgxpool.Pool) ModuleRepository {
	return &moduleRepo{psql: psql}
}
