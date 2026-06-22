package auth

import (
	"context"
	"fmt"
	"time"
	"web-quiz/internal/protocol"
)

func (a *authRepo) HasResetToken(ctx context.Context, token string) (bool, *protocol.AppError) {
	key := fmt.Sprintf("reset:%s", token)

	exists, err := a.redis.Exists(ctx, key).Result()
	if err != nil {
		return false, protocol.ErrInternal.Wrap(err)
	}

	return exists == 1, nil
}

func (a *authRepo) SetResetToken(ctx context.Context, token, email string) *protocol.AppError {
	key := fmt.Sprintf("reset:%s", token)

	attempts, err := a.IncrResetAttempts(ctx, email)
	if err != nil {
		return err
	}

	if attempts > 5 {
		return protocol.ErrTooManyAttempts
	}

	if err := a.redis.Set(ctx, key, email, 15*time.Minute).Err(); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (a *authRepo) GetResetToken(ctx context.Context, token string) (string, *protocol.AppError) {
	key := fmt.Sprintf("reset:%s", token)

	email, err := a.redis.Get(ctx, key).Result()
	if err != nil {
		return "", protocol.ErrInternal.Wrap(err)
	}

	return email, nil
}

func (a *authRepo) DeleteResetToken(ctx context.Context, token string) *protocol.AppError {
	key := fmt.Sprintf("reset:%s", token)
	if err := a.redis.Del(ctx, key).Err(); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (a *authRepo) IncrResetAttempts(ctx context.Context, email string) (int, *protocol.AppError) {
	key := fmt.Sprintf("reset:attempts:%s", email)

	attempts, err := a.redis.Incr(ctx, key).Result()
	if err != nil {
		return -1, protocol.ErrInternal.Wrap(err)
	}

	if attempts == 1 {
		a.redis.Expire(ctx, key, time.Hour)
	}

	return int(attempts), nil
}
