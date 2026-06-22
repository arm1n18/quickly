package user

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"time"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/redis/go-redis/v9"
)

func (r *userRepo) CacheUser(ctx context.Context, user model.GenerateJWTData) *protocol.AppError {
	key := fmt.Sprintf("pending:user:%s", user.Email)

	userJSON, err := json.Marshal(user)
	if err != nil {
		log.Println(err)
		return protocol.ErrInternal.Wrap(err)
	}

	err = r.redis.Set(ctx, key, userJSON, 15*time.Minute).Err()
	if err != nil {
		log.Println(err)
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *userRepo) GetCachedUser(ctx context.Context, email string) (*model.GenerateJWTData, *protocol.AppError) {
	key := fmt.Sprintf("pending:user:%s", email)

	val, err := r.redis.Get(ctx, key).Result()
	if err != nil {
		if errors.Is(err, redis.Nil) {
			return nil, nil
		}

		return nil, protocol.ErrInternal.Wrap(err)
	}

	var user model.GenerateJWTData
	if err := json.Unmarshal([]byte(val), &user); err != nil {
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &user, nil
}

func (r *userRepo) DeleteCachedUser(ctx context.Context, email string) *protocol.AppError {
	// if strings.Trim(email, "") == "" {
	// 	return fmt.Errorf("email не може бути порожнім")
	// }

	key := fmt.Sprintf("pending:user:%s", email)

	_, err := r.redis.Del(ctx, key).Result()
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}
