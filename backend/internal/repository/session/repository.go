package session

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type SessionRepository interface {
	/* ---- psql ---- */

	CreateRefreshToken(ctx context.Context, token model.UserSessionDB) *protocol.AppError
	GetRefreshTokenByJTI(ctx context.Context, userID int, jti string) (*model.RefreshTokenDB, *protocol.AppError)
	RevokeRefreshToken(ctx context.Context, id int) *protocol.AppError

	/* ---- redis ---- */

	IsSessionRevoked(ctx context.Context, jti string) (bool, *protocol.AppError)

	RevokeSession(ctx context.Context, jti string) *protocol.AppError

	IsTokenRevoked(ctx context.Context, token string) (bool, *protocol.AppError)
	RevokeToken(ctx context.Context, token string) *protocol.AppError
	RemoveRevokedToken(ctx context.Context, token string) *protocol.AppError
}

type sessionRepo struct {
	psql  *pgxpool.Pool
	redis *redis.Client
}

func NewSessionRepository(psql *pgxpool.Pool, redis *redis.Client) SessionRepository {
	return &sessionRepo{psql: psql, redis: redis}
}
