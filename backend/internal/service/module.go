package service

import (
	"context"
	"fmt"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/module"
	"web-quiz/internal/utils"

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

func (m *ModuleService) GetModuleByID(ctx context.Context, userID, id int) (*model.Module, *model.ErrorResponse) {
	return m.repo.GetByID(ctx, userID, id)
}

func (m *ModuleService) ListUserModules(ctx context.Context, userID int, username string, queryParams module.Query) (*model.ModulesSummaryResponse, *model.ErrorResponse) {
	return m.repo.ListByUserID(ctx, userID, username, queryParams)
}

func (m *ModuleService) ListUserSavedModules(ctx context.Context, userID int, queryParams module.Query) (*model.ModulesSummaryResponse, *model.ErrorResponse) {
	return m.repo.ListSavedByUserID(ctx, userID, queryParams)
}

func (m *ModuleService) FindModules(ctx context.Context, userID int, query module.FindMoulesQuery) (*model.ModulesSummaryResponse, *model.ErrorResponse) {
	if len(query.Keywords) == 1 && query.Keywords[0] == "" {
		query.Keywords = nil
	}

	if query.Limit != "" {
		if query.Limit != "lessThanTwenty" &&
			query.Limit != "twentyToFifty" &&
			query.Limit != "moreThanFifty" {
			return nil, protocol.ReturnError(400, protocol.ErrBadRequest)
		}
	}

	return m.repo.Find(ctx, userID, query)
}

func (m *ModuleService) CreateModule(ctx context.Context, userID int, module model.CreateModuleRequest) (*model.CreateModuleResponse, *model.ErrorResponse) {
	if len(module.Cards) < 3 || len(module.Cards) > 50 {
		return nil, protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
	}

	if !utils.InRange(module.Title, 1, 50) || !utils.InRange(module.Description, 0, 500) {
		return nil, protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
	}

	if utils.Contains(module.Cards, func(c model.CreateCard) bool {
		return !utils.InRange(c.Description.Text, 1, 500) || !utils.InRange(c.Title.Text, 1, 500)
	}) {
		return nil, protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
	}

	return m.repo.CreateModule(ctx, userID, module)
}

func (m *ModuleService) UpdateModule(ctx context.Context, userID int, module model.UpdateModuleRequest) *model.ErrorResponse {
	if len(module.Cards) <= 0 {
		return protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
	}

	if module.Title != nil {
		if !utils.InRange(*module.Title, 1, 50) {
			return protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
		}
	}

	if module.Description != nil {
		if !utils.InRange(*module.Description, 0, 500) {
			return protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
		}
	}

	if utils.Contains(module.Cards, func(c model.CardUpdate) bool {
		return !utils.InRange(c.Description.Text, 1, 500) || !utils.InRange(c.Title.Text, 1, 500)
	}) {
		return protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
	}

	return m.repo.UpdateModule(ctx, userID, module)
}

func (m *ModuleService) DeleteModule(ctx context.Context, userID, moduleId int) *model.ErrorResponse {
	return m.repo.DeleteModule(ctx, userID, moduleId)
}

func (m *ModuleService) SaveModule(ctx context.Context, userID, moduleId int) *model.ErrorResponse {
	return m.repo.SaveModule(ctx, userID, moduleId)
}

func (m *ModuleService) UnsaveModule(ctx context.Context, userID, moduleId int) *model.ErrorResponse {
	return m.repo.UnsaveModule(ctx, userID, moduleId)
}

func (m *ModuleService) UpdateModuleCard(ctx context.Context, userID int, card model.UpdateModuleCard) *model.ErrorResponse {
	if !utils.InRange(card.Title, 2, 500) || !utils.InRange(card.Description, 2, 500) {
		return protocol.ReturnError(400, fmt.Errorf("Невідповідна довжина"))
	}

	return m.repo.UpdateModuleCard(ctx, userID, card)
}

func (m *ModuleService) GetKeywords(ctx context.Context, title string) ([]model.Keyword, *model.ErrorResponse) {
	return m.repo.FindKeywords(ctx, title)
}

func (m *ModuleService) GetKeywordsBySlug(ctx context.Context, slugs []string) ([]model.Keyword, *model.ErrorResponse) {
	if len(slugs) == 0 {
		return nil, nil
	}

	if len(slugs) > 10 {
		slugs = slugs[:10]
	}

	return m.repo.FindKeywordsBySlug(ctx, slugs)
}

func (m *ModuleService) AddKeywords(ctx context.Context, keywords []string) *model.ErrorResponse {
	return m.repo.InsertKeywords(ctx, keywords)
}
