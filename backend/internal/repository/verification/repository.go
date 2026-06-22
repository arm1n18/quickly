package verification

import (
	"context"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/redis/go-redis/v9"
)

type VerificationRepository interface {
	/* ---- redis ---- */

	Get(ctx context.Context, email, purpose string) (*model.VerificationCode, *protocol.AppError)
	Save(ctx context.Context, email string, code model.VerificationCode) *protocol.AppError
	Replace(ctx context.Context, email string, newCode int, purpose string) *protocol.AppError
	Delete(ctx context.Context, email, purpose string) *protocol.AppError

	IncrAttempts(ctx context.Context, email, purpose string) *protocol.AppError
}

type verificationRepo struct {
	redis *redis.Client
}

func NewVerificationRepository(redis *redis.Client) VerificationRepository {
	return &verificationRepo{redis: redis}
}
