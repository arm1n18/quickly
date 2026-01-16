package services

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/repository/module"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ModuleService struct {
	psql *pgxpool.Pool
	repo module.ModuleRepository
}

func NewModuleService(psql *pgxpool.Pool) *ModuleService {
	return &ModuleService{
		psql: psql,
		repo: module.NewModuleRepository(psql),
	}
}

func (m *ModuleService) GetModule(ctx context.Context, id int) (*model.Module, error) {
	return m.repo.FetchModule(ctx, id)
}

func (m *ModuleService) GetUserModules(ctx context.Context, username string, queryParams module.Query) (*model.UserModules, error) {
	return m.repo.FetchUserModules(ctx, username, queryParams)
}

func (m *ModuleService) GetModulesByName(ctx context.Context, name string, lastId int) (*model.ModulesSummary, error) {
	return m.repo.FetchModulesByName(ctx, name, lastId)
}

func (m *ModuleService) GetModulesByKeywords(ctx context.Context, keywords []string) (*model.ModulesSummary, error) {
	return m.repo.FetchModulesByKeywords(ctx, keywords)
}

func (m *ModuleService) AddKeywords(ctx context.Context, keywords []string) error {
	return m.repo.InsertKeywords(ctx, keywords)
}
