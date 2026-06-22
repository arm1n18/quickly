package auth

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type AuthRepository interface {
	/* ---- psql ---- */

	UpdatePassword(ctx context.Context, email, password string) *protocol.AppError
	GetCredentials(ctx context.Context, email, password string) (*model.UserInfo, *protocol.AppError)

	/* ---- redis ---- */

	HasResetToken(ctx context.Context, token string) (bool, *protocol.AppError)
	SetResetToken(ctx context.Context, token, email string) *protocol.AppError
	GetResetToken(ctx context.Context, token string) (string, *protocol.AppError)
	DeleteResetToken(ctx context.Context, token string) *protocol.AppError
	IncrResetAttempts(ctx context.Context, email string) (int, *protocol.AppError)
}

type authRepo struct {
	psql  *pgxpool.Pool
	redis *redis.Client
}

func NewAuthRepository(psql *pgxpool.Pool, redis *redis.Client) AuthRepository {
	return &authRepo{psql: psql, redis: redis}
}
