package user

import (
	"context"
	"fmt"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Query struct {
	Name   string
	LastId int
}

type UserRepository interface {
	GetProfile(ctx context.Context, username string) (*model.Author, *model.ErrorResponse)
	UpdateUserInfo(ctx context.Context, userID int, username string) *model.ErrorResponse
}

type userRepo struct {
	psql *pgxpool.Pool
}

func NewUserRepository(psql *pgxpool.Pool) UserRepository {
	return &userRepo{psql: psql}
}

func (m *userRepo) isUsernameFree(tx pgx.Tx, ctx context.Context, username string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)`

	var taken bool
	if err := tx.QueryRow(ctx, query, username).Scan(&taken); err != nil {
		return false, err
	}

	return !taken, nil
}

func (m *userRepo) GetProfile(ctx context.Context, username string) (*model.Author, *model.ErrorResponse) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:GetProfile:AcquireConnection", err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}
	defer conn.Release()

	query := `SELECT username, avatar FROM users WHERE username = $1`

	user := model.Author{}

	err = conn.QueryRow(ctx, query, username).Scan(&user.Name, &user.Avatar)
	if err != nil {
		utils.LogError("USER:PSQL:GetProfile:QueryRow", err)
		return nil, protocol.ReturnError(500, protocol.ErrInternal)
	}

	return &user, nil
}

func (m *userRepo) UpdateUserInfo(ctx context.Context, userID int, username string) *model.ErrorResponse {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:UpdateUserInfo:AcquireConnection", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:UpdateUserInfo:BeginTransaction", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	free, err := m.isUsernameFree(tx, ctx, username)
	if err != nil {
		utils.LogError("USER:PSQL:UpdateUserInfo:isUsernameFree", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}
	if !free {
		return protocol.ReturnError(500, fmt.Errorf("Дане ім’я вже зайняте"))
	}

	query := `UPDATE users
		SET username = $2
		WHERE user_id = $1
	`
	rows, err := tx.Exec(ctx, query, userID, username)
	if err != nil {
		utils.LogError("USER:PSQL:UpdateUserInfo:Exec", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	if rows.RowsAffected() == 0 {
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	err = tx.Commit(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:UpdateUserInfo:CommitTransaction", err)
		return protocol.ReturnError(500, protocol.ErrInternal)
	}

	return nil
}
