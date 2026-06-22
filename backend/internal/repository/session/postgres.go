package session

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"
)

func (r *sessionRepo) CreateRefreshToken(ctx context.Context, token model.UserSessionDB) *protocol.AppError {
	hashToken, err := utils.GetHash(token.Token)
	if err != nil {
		utils.LogError("AUTH:PSQL:InsertRefreshToken:GetHash", err)
		return protocol.ErrInternal.Wrap(err)
	}

	query := `INSERT INTO sessions (user_id, os, device, browser, token, jti, expires_at)
	VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 day')`

	_, err = r.psql.Exec(ctx, query, token.ID, token.OS,
		token.Device, token.Browser, string(hashToken), token.JTI)
	if err != nil {
		utils.LogError("AUTH:PSQL:InsertRefreshToken:Exec", err)
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *sessionRepo) GetRefreshTokenByJTI(ctx context.Context, userID int, jti string) (*model.RefreshTokenDB, *protocol.AppError) {
	query := `SELECT session_id, token, expires_at FROM sessions WHERE user_id = $1 AND jti = $2`

	var res model.RefreshTokenDB
	err := r.psql.QueryRow(ctx, query, userID, jti).Scan(&res.Id, &res.Token, &res.Exp)
	if err != nil {
		utils.LogError("AUTH:PSQL:GetRefreshToken:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &res, nil
}

func (r *sessionRepo) RevokeRefreshToken(ctx context.Context, id int) *protocol.AppError {
	rows, err := r.psql.Exec(ctx, `UPDATE sessions SET terminated = true WHERE session_id = $1`, id)
	if err != nil {
		utils.LogError("AUTH:PSQL:TerminateRefreshToken:Exec", err)
		return protocol.ErrInternal.Wrap(err)
	}

	if rows.RowsAffected() == 0 {
		return protocol.ErrnIvalidSession
	}

	return nil
}
