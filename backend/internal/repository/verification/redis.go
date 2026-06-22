package verification

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/redis/go-redis/v9"
)

var (
	DefaultCodeTTL = 15 * time.Minute
	MaxRequests    = 5
	MaxAttempts    = 5
)

func (r *verificationRepo) Get(ctx context.Context, email, purpose string) (*model.VerificationCode, *protocol.AppError) {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)

	data, err := r.redis.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, protocol.ErrInternal.Wrap(err)
	}

	var code model.VerificationCode
	if err := json.Unmarshal([]byte(data), &code); err != nil {
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &code, nil

	// if err := r.IncrAttempts(ctx, email, purpose); err != nil {
	// 	return nil, err
	// }
}

func (r *verificationRepo) Save(ctx context.Context, email string, code model.VerificationCode) *protocol.AppError {
	key := fmt.Sprintf("verification:code:%s:%s", email, code.Purpose)

	err := r.redis.Watch(ctx, func(tx *redis.Tx) error {
		val, err := tx.Get(ctx, key).Result()
		if err != nil && err != redis.Nil {
			return err
		}

		now := time.Now()

		if err == nil {
			var existing model.VerificationCode
			if err := json.Unmarshal([]byte(val), &existing); err != nil {
				return err
			}

			if now.Before(existing.BanUntil) {
				return protocol.ErrTooManyAttempts.Err
			}

			code.Requests = existing.Requests + 1
			code.Attempts = existing.Attempts

		} else {
			code.Requests = 1
			code.Attempts = 0
		}

		code.Iat = time.Now()
		checkAndBan(&code)

		b, err := json.Marshal(code)
		if err != nil {
			return err
		}

		_, err = tx.TxPipelined(ctx, func(p redis.Pipeliner) error {
			p.Set(ctx, key, b, 15*time.Minute)
			return nil
		})
		return err
	}, key)

	if err != nil {
		if err == protocol.ErrTooManyAttempts.Err {
			return protocol.ErrTooManyAttempts
		}

		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *verificationRepo) Replace(ctx context.Context, email string, newCode int, purpose string) *protocol.AppError {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)

	err := r.redis.Watch(ctx, func(tx *redis.Tx) error {
		val, err := tx.Get(ctx, key).Result()
		if err == redis.Nil {
			return protocol.ErrCodeNotFound.Err
		}

		if err != nil {
			return err
		}

		var code model.VerificationCode
		if err := json.Unmarshal([]byte(val), &code); err != nil {
			return err
		}
		if time.Now().Before(code.BanUntil) {
			return protocol.ErrTooManyAttempts.Err
		}

		if time.Now().Before(code.Iat.Add(60 * time.Second)) {
			return protocol.ErrTooManyAttempts.Err
		}

		code.Requests++
		code.Code = newCode
		code.Iat = time.Now()

		checkAndBan(&code)

		b, err := json.Marshal(code)
		if err != nil {
			return err
		}

		_, err = tx.TxPipelined(ctx, func(p redis.Pipeliner) error {
			return p.Set(ctx, key, b, 15*time.Minute).Err()
		})
		return err
	}, key)

	if err != nil {
		if err == protocol.ErrTooManyAttempts.Err {
			return protocol.ErrTooManyAttempts
		}

		if err == protocol.ErrCodeNotFound.Err {
			return protocol.ErrCodeNotFound
		}

		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *verificationRepo) Delete(ctx context.Context, email, purpose string) *protocol.AppError {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)

	if err := r.redis.Del(ctx, key).Err(); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *verificationRepo) IncrAttempts(ctx context.Context, email, purpose string) *protocol.AppError {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)

	err := r.redis.Watch(ctx, func(tx *redis.Tx) error {
		val, err := tx.Get(ctx, key).Result()
		if err == redis.Nil {
			return protocol.ErrCodeNotFound.Err
		}

		if err != nil {
			return err
		}

		var code model.VerificationCode
		if err := json.Unmarshal([]byte(val), &code); err != nil {
			return err
		}

		code.Attempts++
		checkAndBan(&code)

		b, err := json.Marshal(code)
		if err != nil {
			return err
		}

		_, err = tx.TxPipelined(ctx, func(p redis.Pipeliner) error {
			return p.Set(ctx, key, b, DefaultCodeTTL).Err()
		})

		return err
	}, key)

	if err != nil {
		if err == protocol.ErrCodeNotFound.Err {
			return protocol.ErrCodeNotFound
		}

		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func checkAndBan(c *model.VerificationCode) {
	if c.Attempts > MaxAttempts || c.Requests > MaxRequests {
		c.BanUntil = time.Now().Add(15 * time.Minute)
		c.Requests = 0
		c.Attempts = 0
	}
}
