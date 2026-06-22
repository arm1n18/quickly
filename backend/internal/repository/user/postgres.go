package user

import (
	"context"
	"errors"
	"fmt"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5"
	"golang.org/x/crypto/bcrypt"
)

func (r *userRepo) isUsernameFree(tx pgx.Tx, ctx context.Context, username string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)`

	var taken bool
	if err := tx.QueryRow(ctx, query, username).Scan(&taken); err != nil {
		return false, err
	}

	return !taken, nil
}

func (r *userRepo) Get(ctx context.Context, username string) (*model.Author, *protocol.AppError) {
	user := model.Author{}
	err := r.psql.QueryRow(ctx,
		`SELECT username, avatar FROM users WHERE username = $1`,
		username).Scan(&user.Name, &user.Avatar)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, protocol.ErrUserNotFound
		}
		utils.LogError("USER:PSQL:Get:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &user, nil
}

func (r *userRepo) Create(ctx context.Context, email, password string) (*model.UserInfo, *protocol.AppError) {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:CreateUser:BeginTransaction", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	username := utils.UsernameFromEmail(email)
	free, err := r.isUsernameFree(tx, ctx, username)
	if err != nil {
		utils.LogError("USER:PSQL:CreateUser:isUsernameFree", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	for tries := 0; tries < 10 && !free; tries++ {
		username = fmt.Sprintf("%s%d", username, utils.GenerateOTP(6))
		free, _ = r.isUsernameFree(tx, ctx, username)
	}

	if !free {
		return nil, protocol.ErrUsernameTaken
	}

	query := `
		INSERT INTO users (username, email, password_hash)
		VALUES ($1, $2, $3) 
		RETURNING user_id
	`

	var id int
	hashPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		utils.LogError("USER:BCRYPT:GenerateFromPassword", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	err = tx.QueryRow(ctx, query, username, email, hashPassword).Scan(&id)
	if err != nil {
		utils.LogError("USER:PSQL:CreateUser:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	err = tx.Commit(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:CreateUser:CommitTransaction", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &model.UserInfo{ID: id, Username: username}, nil
}

func (r *userRepo) Update(ctx context.Context, id int, username string) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:Update:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	free, err := r.isUsernameFree(tx, ctx, username)
	if err != nil {
		utils.LogError("USER:PSQL:Update:isUsernameFree", err)
		return protocol.ErrInternal.Wrap(err)
	}
	if !free {
		return protocol.ErrUsernameTaken
	}

	rows, err := tx.Exec(ctx, `UPDATE users SET username = $2 WHERE user_id = $1`, id, username)
	if err != nil {
		utils.LogError("USER:PSQL:Update:Exec", err)
		return protocol.ErrInternal.Wrap(err)
	}

	if rows.RowsAffected() == 0 {
		return protocol.ErrUserNotFound
	}

	err = tx.Commit(ctx)
	if err != nil {
		utils.LogError("USER:PSQL:Update:CommitTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *userRepo) Exists(ctx context.Context, email string) (bool, *protocol.AppError) {
	var exists bool
	err := r.psql.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)
	if err != nil {
		utils.LogError("USER:PSQL:Exists:QueryRow", err)
		return false, protocol.ErrInternal.Wrap(err)
	}

	return exists, nil
}
