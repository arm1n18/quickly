package service

import (
	"context"
	"fmt"
	"log"
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

func (m *ModuleService) ListUserModules(ctx context.Context, userID int, username string, queryParams module.Query) (*model.ModulesSummaryResponse, error) {
	return m.repo.ListByUserID(ctx, userID, username, queryParams)
}

func (m *ModuleService) ListUserSavedModules(ctx context.Context, userID int, queryParams module.Query) (*model.ModulesSummaryResponse, error) {
	return m.repo.ListSavedByUserID(ctx, userID, queryParams)
}

func (m *ModuleService) FindModules(ctx context.Context, userID int, query module.FindMoulesQuery) (*model.ModulesSummaryResponse, error) {
	if len(query.Keywords) == 1 && query.Keywords[0] == "" {
		query.Keywords = nil
	}

	if query.Limit != "" {
		if query.Limit != "lessThanTwenty" &&
			query.Limit != "twentyToFifty" &&
			query.Limit != "moreThanFifty" {
			return nil, protocol.ErrBadRequest
		}
	}

	return m.repo.Find(ctx, userID, query)
}

// func (m *ModuleService) FindModulesByTitle(ctx context.Context, userID int, title string, lastId int) (*model.ModulesSummaryResponse, error) {
// 	return m.repo.FindByTitle(ctx, userID, title, lastId)
// }

// func (m *ModuleService) FindModulesByKeywords(ctx context.Context, userID int, keywords []string) (*model.ModulesSummaryResponse, error) {
// 	return m.repo.FindByKeywords(ctx, userID, keywords)
// }

func (m *ModuleService) CreateModule(ctx context.Context, userID int, module model.CreateModuleRequest) (*model.CreateModuleResponse, error) {
	if len(module.Cards) < 3 || len(module.Cards) > 50 {
		return nil, fmt.Errorf("Invalid range")
	}

	if !utils.InRange(module.Title, 1, 50) || !utils.InRange(module.Description, 0, 500) {
		return nil, fmt.Errorf("Invalid range")
	}

	if utils.Contains(module.Cards, func(c model.CreateCard) bool {
		return !utils.InRange(c.Description.Text, 1, 500) || !utils.InRange(c.Title.Text, 1, 500)
	}) {
		return nil, fmt.Errorf("Invalid range")
	}

	return m.repo.CreateModule(ctx, userID, module)
}

func (m *ModuleService) UpdateModule(ctx context.Context, userID int, module model.UpdateModuleRequest) error {
	var err error
	if len(module.Cards) <= 0 {
		err = fmt.Errorf("Invalid range")
		log.Println(err)
		return err
	}

	if module.Title != nil {
		if !utils.InRange(*module.Title, 1, 50) {
			return fmt.Errorf("Invalid range")
		}
	}

	if module.Description != nil {
		if !utils.InRange(*module.Description, 0, 500) {
			return fmt.Errorf("Invalid range")
		}
	}

	if utils.Contains(module.Cards, func(c model.CardUpdate) bool {
		return !utils.InRange(c.Description.Text, 1, 500) || !utils.InRange(c.Title.Text, 1, 500)
	}) {
		return fmt.Errorf("Invalid range")
	}

	err = m.repo.UpdateModule(ctx, userID, module)
	log.Println(err)
	return err
}

func (m *ModuleService) DeleteModule(ctx context.Context, userID, moduleId int) error {
	return m.repo.DeleteModule(ctx, userID, moduleId)
}

func (m *ModuleService) SaveModule(ctx context.Context, userID, moduleId int) error {
	return m.repo.SaveModule(ctx, userID, moduleId)
}

func (m *ModuleService) UnsaveModule(ctx context.Context, userID, moduleId int) error {
	return m.repo.UnsaveModule(ctx, userID, moduleId)
}

func (m *ModuleService) UpdateModuleCard(ctx context.Context, userID int, card model.UpdateModuleCard) error {
	if !utils.InRange(card.Title, 2, 500) || !utils.InRange(card.Description, 2, 500) {
		err := fmt.Errorf("Invalid range")
		log.Println(err)
		return err
	}

	return m.repo.UpdateModuleCard(ctx, userID, card)
}

func (m *ModuleService) GetKeywords(ctx context.Context, title string) ([]model.Keyword, error) {
	return m.repo.FindKeywords(ctx, title)
}

func (m *ModuleService) GetKeywordsBySlug(ctx context.Context, slugs []string) ([]model.Keyword, error) {
	if len(slugs) == 0 {
		return nil, nil
	}

	if len(slugs) > 10 {
		slugs = slugs[:10]
	}

	return m.repo.FindKeywordsBySlug(ctx, slugs)
}

func (m *ModuleService) AddKeywords(ctx context.Context, keywords []string) error {
	return m.repo.InsertKeywords(ctx, keywords)
}
