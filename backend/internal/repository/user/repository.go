package user

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

type Query struct {
	Name   string
	LastID int
}

type UserRepository interface {
	/* ---- psql ---- */

	Get(ctx context.Context, username string) (*model.Author, *protocol.AppError)
	Create(ctx context.Context, email, password string) (*model.UserInfo, *protocol.AppError)
	Update(ctx context.Context, userID int, username string) *protocol.AppError
	Exists(ctx context.Context, email string) (bool, *protocol.AppError)

	/* ---- redis ---- */

	CacheUser(ctx context.Context, user model.GenerateJWTData) *protocol.AppError
	GetCachedUser(ctx context.Context, email string) (*model.GenerateJWTData, *protocol.AppError)
	DeleteCachedUser(ctx context.Context, email string) *protocol.AppError
}

type userRepo struct {
	psql  *pgxpool.Pool
	redis *redis.Client
}

func NewUserRepository(psql *pgxpool.Pool, redis *redis.Client) UserRepository {
	return &userRepo{psql: psql, redis: redis}
}
