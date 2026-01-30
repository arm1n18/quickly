package service

import (
	"context"
	"fmt"
	"log"
	"web-quiz/internal/model"
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

func (m *ModuleService) GetModuleByID(ctx context.Context, userId, id int) (*model.Module, *model.ErrorResponse) {
	return m.repo.GetByID(ctx, userId, id)
}

func (m *ModuleService) ListUserModules(ctx context.Context, userId int, username string, queryParams module.Query) (*model.UserModulesResponse, error) {
	return m.repo.ListByUserID(ctx, userId, username, queryParams)
}

func (m *ModuleService) FindModulesByTitle(ctx context.Context, userId int, title string, lastId int) (*model.ModulesSummaryResponse, error) {
	return m.repo.FindByTitle(ctx, userId, title, lastId)
}

func (m *ModuleService) FindModulesByKeywords(ctx context.Context, userId int, keywords []string) (*model.ModulesSummaryResponse, error) {
	return m.repo.FindByKeywords(ctx, userId, keywords)
}

func (m *ModuleService) CreateModule(ctx context.Context, userId int, module model.CreateModuleRequest) (*model.CreateModuleResponse, error) {
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

	return m.repo.CreateModule(ctx, userId, module)
}

func (m *ModuleService) UpdateModule(ctx context.Context, userId int, module model.UpdateModuleRequest) error {
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

	err = m.repo.UpdateModule(ctx, userId, module)
	log.Println(err)
	return err
}

func (m *ModuleService) DeleteModule(ctx context.Context, userId, moduleId int) error {
	return m.repo.DeleteModule(ctx, userId, moduleId)
}

func (m *ModuleService) SaveModule(ctx context.Context, userId, moduleId int) error {
	return m.repo.SaveModule(ctx, userId, moduleId)
}

func (m *ModuleService) UnsaveModule(ctx context.Context, userId, moduleId int) error {
	return m.repo.UnsaveModule(ctx, userId, moduleId)
}

func (m *ModuleService) UpdateModuleCard(ctx context.Context, userId int, card model.UpdateModuleCard) error {
	if !utils.InRange(card.Title, 2, 500) || !utils.InRange(card.Description, 2, 500) {
		err := fmt.Errorf("Invalid range")
		log.Println(err)
		return err
	}

	return m.repo.UpdateModuleCard(ctx, userId, card)
}

func (m *ModuleService) AddKeywords(ctx context.Context, keywords []string) error {
	return m.repo.InsertKeywords(ctx, keywords)
}
