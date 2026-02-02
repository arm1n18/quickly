package user

import (
	"context"
	"log"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Query struct {
	Name   string
	LastId int
}

type UserRepository interface {
	GetProfile(ctx context.Context, username string) (*model.Author, error)
}

type userRepo struct {
	psql *pgxpool.Pool
}

func NewUserRepository(psql *pgxpool.Pool) UserRepository {
	return &userRepo{psql: psql}
}

func (m *userRepo) GetProfile(ctx context.Context, username string) (*model.Author, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, protocol.ErrInternal
	}
	defer conn.Release()

	query := `SELECT username, avatar FROM users WHERE username = $1`

	user := model.Author{}

	err = conn.QueryRow(ctx, query, username).Scan(&user.Name, &user.Avatar)
	if err != nil {
		log.Printf("error query user: %v\n", err)
		return nil, err
	}

	return &user, nil
}
