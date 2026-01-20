package service

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

func (m *ModuleService) GetModuleByID(ctx context.Context, id int) (*model.Module, error) {
	return m.repo.GetByID(ctx, id)
}

func (m *ModuleService) ListUserModules(ctx context.Context, username string, queryParams module.Query) (*model.UserModulesResponse, error) {
	return m.repo.ListByUserID(ctx, username, queryParams)
}

func (m *ModuleService) FindModulesByName(ctx context.Context, name string, lastId int) (*model.ModulesSummaryResponse, error) {
	return m.repo.FindByName(ctx, name, lastId)
}

func (m *ModuleService) FindModulesByKeywords(ctx context.Context, keywords []string) (*model.ModulesSummaryResponse, error) {
	return m.repo.FindByKeywords(ctx, keywords)
}

func (m *ModuleService) CreateModule(ctx context.Context, user string, module model.CreateModuleRequest) (*model.CreateModuleResponse, error) {
	return m.repo.CreateModule(ctx, 1, module)
}

func (m *ModuleService) AddKeywords(ctx context.Context, keywords []string) error {
	return m.repo.InsertKeywords(ctx, keywords)
}
