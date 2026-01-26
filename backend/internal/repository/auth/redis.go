package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"
	"web-quiz/internal/model"

	"github.com/redis/go-redis/v9"
)

var (
	ErrCodeBanned   = errors.New("перевищено ліміт спроб. Будь ласка, спробуйте пізніше")
	ErrCodeNotFound = errors.New("код не знайдено або не можливо оновити")
	DefaultCodeTTL  = 15 * time.Minute
	MaxRequests     = 5
	MaxAttempts     = 5
)

/* ---- Code ---- */

func (a *authRepo) SetVerificationCode(ctx context.Context, email string, code model.VerificationCode) error {
	key := fmt.Sprintf("verification:code:%s:%s", email, code.Purpose)

	err := a.redis.Watch(ctx, func(tx *redis.Tx) error {
		existingCode, err := a.getCode(ctx, key)
		if err != nil {
			log.Println(err)

			return err
		}

		if existingCode != nil {
			if time.Now().Before(existingCode.BanUntil) {
				return ErrCodeBanned
			}

			code.Requests = existingCode.Requests + 1
			code.Attempts = existingCode.Attempts
		} else {
			code.Attempts = 0
			code.Requests = 1
		}

		checkAndBan(&code)

		_, err = tx.TxPipelined(ctx, func(p redis.Pipeliner) error {
			return a.saveCode(ctx, key, code, 15*time.Minute)
		})
		log.Println(err)

		return err
	}, key)

	log.Println(err)

	return err
}

func (a *authRepo) UpdateVerificationCode(ctx context.Context, email string, newCode int, purpose string) error {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)

	err := a.redis.Watch(ctx, func(tx *redis.Tx) error {
		code, err := a.getCode(ctx, key)
		if err != nil {
			return err
		}
		if code == nil {
			return ErrCodeNotFound
		}

		if time.Now().Before(code.BanUntil) {
			return ErrCodeBanned
		}

		if time.Now().Before(code.Iat.Add(60 * time.Second)) {
			return errors.New("будь ласка, спробуйте пізніше")
		}

		code.Requests++
		code.Code = newCode

		checkAndBan(code)

		_, err = tx.TxPipelined(ctx, func(p redis.Pipeliner) error {
			return a.saveCode(ctx, key, *code, 15*time.Minute)
		})
		return err
	}, key)

	return err
}

func (a *authRepo) IncrementVerificationAttempts(ctx context.Context, email, purpose string) error {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)

	code, err := a.getCode(ctx, key)
	if err != nil {
		return err
	}
	if code == nil {
		return ErrCodeNotFound
	}

	code.Attempts++
	checkAndBan(code)

	return a.saveCode(ctx, key, *code, DefaultCodeTTL)
}

func (a *authRepo) GetVerificationCode(ctx context.Context, email, purpose string) (*model.VerificationCode, error) {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)
	return a.getCode(ctx, key)
}

func (a *authRepo) RemoveVerificationCode(ctx context.Context, email, purpose string) error {
	key := fmt.Sprintf("verification:code:%s:%s", email, purpose)
	return a.redis.Del(ctx, key).Err()
}

func (a *authRepo) saveCode(ctx context.Context, key string, code model.VerificationCode, ttl time.Duration) error {
	codeJSON, err := json.Marshal(code)
	if err != nil {
		log.Println(err)
		return fmt.Errorf("marshal error: %w", err)
	}
	return a.redis.Set(ctx, key, codeJSON, ttl).Err()
}

func (a *authRepo) getCode(ctx context.Context, key string) (*model.VerificationCode, error) {
	data, err := a.redis.Get(ctx, key).Result()
	if err != nil {
		log.Println(err)
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}
		return nil, err
	}

	var code model.VerificationCode
	if err := json.Unmarshal([]byte(data), &code); err != nil {
		log.Println(err)
		return nil, fmt.Errorf("unmarshal error: %w", err)
	}

	return &code, nil
}

func checkAndBan(c *model.VerificationCode) {
	if c.Attempts > MaxAttempts || c.Requests > MaxRequests {
		c.BanUntil = time.Now().Add(15 * time.Minute)
		c.Requests = 0
		c.Attempts = 0
	}
}

/* ---- User ---- */

func (a *authRepo) SetUserInRedis(ctx context.Context, user model.GenerateJWTData) error {
	key := fmt.Sprintf("pending:user:%s", user.Email)

	userJSON, err := json.Marshal(user)
	if err != nil {
		log.Println(err)

		return fmt.Errorf("marshal error: %w", err)
	}

	err = a.redis.Set(ctx, key, userJSON, 15*time.Minute).Err()
	if err != nil {
		log.Println(err)

		return err
	}

	return nil
}

func (a *authRepo) GetUserFromRedis(ctx context.Context, email string) (*model.GenerateJWTData, error) {
	var user model.GenerateJWTData

	key := fmt.Sprintf("pending:user:%s", email)

	val, err := a.redis.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	if err := json.Unmarshal([]byte(val), &user); err != nil {
		return nil, err
	}

	return &user, nil
}

func (a *authRepo) RemoveUserFromRedis(ctx context.Context, email string) error {
	if strings.Trim(email, "") == "" {
		return fmt.Errorf("email не може бути порожнім")
	}

	key := fmt.Sprintf("pending:user:%s", email)

	_, err := a.redis.Del(ctx, key).Result()
	if err != nil {
		return err
	}

	return nil
}

/* ---- Session ---- */

func (a *authRepo) IsSessionTerminated(jti string) (bool, error) {
	key := fmt.Sprintf("terminated:session:%s", jti)

	exists, err := a.redis.Exists(context.Background(), key, jti).Result()
	if err != nil {
		return false, err
	}

	return exists == 1, nil
}

func (a *authRepo) TerminateSessionInRedis(jti string) error {
	key := fmt.Sprintf("terminated:session:%s", jti)

	err := a.redis.Set(context.Background(), key, jti, 15*time.Minute).Err()
	if err != nil {
		return err
	}

	return nil
}
