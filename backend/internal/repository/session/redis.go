package session

import (
	"context"
	"fmt"
	"time"
	"web-quiz/internal/protocol"
)

func (r *sessionRepo) IsSessionRevoked(ctx context.Context, jti string) (bool, *protocol.AppError) {
	key := fmt.Sprintf("terminated:session:%s", jti)

	exists, err := r.redis.Exists(ctx, key).Result()
	if err != nil {
		return false, protocol.ErrInternal.Wrap(err)
	}

	return exists == 1, nil
}

func (r *sessionRepo) RevokeSession(ctx context.Context, jti string) *protocol.AppError {
	key := fmt.Sprintf("terminated:session:%s", jti)

	err := r.redis.Set(ctx, key, jti, 15*time.Minute).Err()
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *sessionRepo) IsTokenRevoked(ctx context.Context, token string) (bool, *protocol.AppError) {
	key := fmt.Sprintf("terminated:token:%s", token)

	exists, err := r.redis.Exists(ctx, key).Result()
	if err != nil {
		return false, protocol.ErrInternal.Wrap(err)
	}

	return exists == 1, nil
}

func (r *sessionRepo) RevokeToken(ctx context.Context, token string) *protocol.AppError {
	key := fmt.Sprintf("terminated:token:%s", token)

	err := r.redis.Set(ctx, key, token, 15*time.Minute).Err()
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *sessionRepo) RemoveRevokedToken(ctx context.Context, token string) *protocol.AppError {
	key := fmt.Sprintf("terminated:token:%s", token)

	err := r.redis.Del(ctx, key, token).Err()
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}
