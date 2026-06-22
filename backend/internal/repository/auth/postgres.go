package auth

import (
	"context"
	"database/sql"
	"errors"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"

	"golang.org/x/crypto/bcrypt"
)

func (r *authRepo) UpdatePassword(ctx context.Context, email, password string) *protocol.AppError {
	hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	rows, err := r.psql.Exec(ctx, `UPDATE users SET password_hash = $2 WHERE email = $1`, email, hash)
	if err != nil {
		utils.LogError("AUTH:PSQL:ChangePassword:Exec", err)
		return protocol.ErrInternal.Wrap(err)
	}

	if rows.RowsAffected() == 0 {
		return protocol.ErrUserNotFound
	}

	return nil
}

func (r *authRepo) GetCredentials(ctx context.Context, email, password string) (*model.UserInfo, *protocol.AppError) {
	var user model.UserInfo

	err := r.psql.QueryRow(ctx, "SELECT user_id, username, password_hash FROM users WHERE email=$1",
		email).Scan(&user.ID, &user.Username, &user.HashPassword)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, protocol.ErrUserNotFound
		}

		utils.LogError("USER:PSQL:GetCredentials:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &user, nil
}
