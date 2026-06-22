package service

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/module"
	"web-quiz/internal/utils"
)

type ModuleService struct {
	repo module.ModuleRepository
}

func NewModuleService(
	repo module.ModuleRepository,
) *ModuleService {
	return &ModuleService{
		repo: repo,
	}
}

func (m *ModuleService) GetByID(
	ctx context.Context,
	userID, id int,
) (*model.Module, *protocol.AppError) {
	module, err := m.repo.GetByID(ctx, userID, id)
	if err != nil {
		return nil, err
	}

	if !module.Accessible {
		return nil, protocol.ErrForbidden
	}

	return module, nil
}

func (m *ModuleService) GetUserModules(
	ctx context.Context,
	userID int,
	username string,
	q module.Query,
) (*model.ModulesSummaryResponse, *protocol.AppError) {
	return m.repo.ListByUserID(ctx, userID, username, q)
}

func (m *ModuleService) GetUserSavedModules(
	ctx context.Context,
	userID int,
	q module.Query,
) (*model.ModulesSummaryResponse, *protocol.AppError) {
	return m.repo.ListSavedByUserID(ctx, userID, q)
}

func (m *ModuleService) SearchModules(
	ctx context.Context,
	userID int,
	q module.FindMoulesQuery,
) (*model.ModulesSummaryResponse, *protocol.AppError) {
	if len(q.Keywords) == 1 && q.Keywords[0] == "" {
		q.Keywords = nil
	}

	if q.Limit != "" {
		if q.Limit != "lessThanTwenty" &&
			q.Limit != "twentyToFifty" &&
			q.Limit != "moreThanFifty" {
			return nil, protocol.ErrBadRequest
		}
	}

	return m.repo.Find(ctx, userID, q)
}

func (m *ModuleService) CreateModule(
	ctx context.Context,
	userID int,
	module model.CreateModuleRequest,
) (*model.CreateModuleResponse, *protocol.AppError) {
	if len(module.Cards) < 3 || len(module.Cards) > 50 {
		return nil, protocol.ErrInvalidCardsLength
	}

	if !utils.InRange(module.Title, 1, 50) {
		return nil, protocol.ErrInvalidModuleTitle
	}

	if !utils.InRange(module.Description, 0, 500) {
		return nil, protocol.ErrInvalidModuleDescription
	}

	if utils.Contains(module.Cards, func(c model.CreateCard) bool {
		return !utils.InRange(c.Title.Text, 1, 500)
	}) {
		return nil, protocol.ErrInvalidCardTitle
	}

	if utils.Contains(module.Cards, func(c model.CreateCard) bool {
		return !utils.InRange(c.Description.Text, 1, 500)
	}) {
		return nil, protocol.ErrInvalidCardDescription
	}

	return m.repo.Create(ctx, userID, module)
}

func (m *ModuleService) UpdateModule(
	ctx context.Context,
	userID int,
	module model.UpdateModuleRequest,
) *protocol.AppError {
	if len(module.Cards) < 3 || len(module.Cards) > 50 {
		return protocol.ErrInvalidCardsLength
	}

	if module.Title != nil {
		if !utils.InRange(*module.Title, 1, 50) {
			return protocol.ErrInvalidModuleTitle
		}
	}

	if module.Description != nil {
		if !utils.InRange(*module.Description, 0, 500) {
			return protocol.ErrInvalidModuleDescription
		}
	}

	if utils.Contains(module.Cards, func(c model.CardUpdate) bool {
		return !utils.InRange(c.Title.Text, 1, 500)
	}) {
		return protocol.ErrInvalidCardTitle
	}

	if utils.Contains(module.Cards, func(c model.CardUpdate) bool {
		return !utils.InRange(c.Description.Text, 1, 500)
	}) {
		return protocol.ErrInvalidCardDescription
	}

	return m.repo.Update(ctx, userID, module)
}

func (m *ModuleService) DeleteModule(
	ctx context.Context,
	userID, moduleId int,
) *protocol.AppError {
	return m.repo.Delete(ctx, userID, moduleId)
}

func (m *ModuleService) SaveModule(
	ctx context.Context,
	userID, moduleId int,
) *protocol.AppError {
	isPrivate, ownerID, err := m.repo.GetAccess(ctx, moduleId)
	if err != nil {
		return err
	}

	accessible := !isPrivate || ownerID == userID
	if !accessible {
		return protocol.ErrForbidden
	}

	return m.repo.Save(ctx, userID, moduleId)
}

func (m *ModuleService) UnsaveModule(
	ctx context.Context,
	userID, moduleId int,
) *protocol.AppError {
	isPrivate, ownerID, err := m.repo.GetAccess(ctx, moduleId)
	if err != nil {
		return err
	}

	accessible := !isPrivate || ownerID == userID
	if !accessible {
		return protocol.ErrForbidden
	}

	return m.repo.Unsave(ctx, userID, moduleId)
}

func (m *ModuleService) UpdateCard(
	ctx context.Context,
	userID int,
	card model.UpdateModuleCard,
) *protocol.AppError {
	if !utils.InRange(card.Title, 1, 500) {
		return protocol.ErrInvalidCardTitle
	}
	if !utils.InRange(card.Description, 1, 500) {
		return protocol.ErrInvalidCardDescription
	}

	return m.repo.UpdateCard(ctx, userID, card)
}

func (m *ModuleService) SearchKeywords(
	ctx context.Context,
	title string,
) ([]model.Keyword, *protocol.AppError) {
	return m.repo.SearchKeywords(ctx, title)
}

func (m *ModuleService) GetKeywordsBySlug(
	ctx context.Context,
	slugs []string,
) ([]model.Keyword, *protocol.AppError) {
	if len(slugs) == 0 {
		return nil, nil
	}

	if len(slugs) > 10 {
		slugs = slugs[:10]
	}

	return m.repo.GetKeywordsBySlug(ctx, slugs)
}

func (m *ModuleService) AddKeywords(
	ctx context.Context,
	keywords []string,
) *protocol.AppError {
	if len(keywords) == 0 {
		return protocol.ErrBadRequest
	}

	return m.repo.CreateKeywords(ctx, keywords)
}
