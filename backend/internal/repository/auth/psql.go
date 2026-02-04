package auth

import (
	"context"
	"errors"
	"fmt"
	"log"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

type AuthRepository interface {
	/* ---- psql ---- */

	// user
	IsUserExists(ctx context.Context, email string) (bool, error)
	CheckUserCredentials(ctx context.Context, email, password string) (*model.UserInfo, error)
	CreateUser(ctx context.Context, email, password string) (*model.UserInfo, error)

	// token
	InsertRefreshToken(ctx context.Context, token model.UserSessionDB) error
	GetRefreshToken(ctx context.Context, userId int, jti string) (*model.RefreshTokenDB, error)
	TerminateRefreshToken(ctx context.Context, id int) error

	// credentials
	ChangePassword(ctx context.Context, email, password string) error

	/* ---- redis ---- */

	// code
	SetVerificationCode(ctx context.Context, email string, code model.VerificationCode) error
	UpdateVerificationCode(ctx context.Context, email string, newCode int, purpose string) error
	IncrementVerificationAttempts(ctx context.Context, email, purpose string) error
	GetVerificationCode(ctx context.Context, email, purpose string) (*model.VerificationCode, error)
	RemoveVerificationCode(ctx context.Context, email, purpose string) error

	// user
	SetUserInRedis(ctx context.Context, user model.GenerateJWTData) error
	GetUserFromRedis(ctx context.Context, email string) (*model.GenerateJWTData, error)
	RemoveUserFromRedis(ctx context.Context, email string) error

	// session
	IsSessionTerminated(jti string) (bool, error)
	TerminateSessionInRedis(jti string) error

	// reset
	HasResetPassword(ctx context.Context, token string) (bool, error)
	SetResetPassword(ctx context.Context, token, email string) error
	GetResetPassword(ctx context.Context, token string) (string, error)
	DeleteResetPassword(ctx context.Context, token string) error
	IncrResetAttempts(ctx context.Context, email string) (int, error)
}

type authRepo struct {
	psql  *pgxpool.Pool
	redis *redis.Client
}

func NewAuthRepository(psql *pgxpool.Pool, redis *redis.Client) AuthRepository {
	return &authRepo{psql: psql, redis: redis}
}

/* ---- User ---- */

func (a *authRepo) isUsernameFree(tx pgx.Tx, ctx context.Context, username string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)`

	var taken bool
	if err := tx.QueryRow(ctx, query, username).Scan(&taken); err != nil {
		log.Println(err)
		return false, protocol.ErrInternal
	}

	return !taken, nil
}

func (a *authRepo) IsUserExists(ctx context.Context, email string) (bool, error) {
	conn, err := a.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return false, protocol.ErrInternal
	}
	defer conn.Release()

	var exists bool
	err = conn.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)", email).Scan(&exists)
	if err != nil {
		log.Println(err)

		return false, protocol.ErrUserNotFound
	}

	return exists, nil
}

func (a *authRepo) CheckUserCredentials(ctx context.Context, email, password string) (*model.UserInfo, error) {
	conn, err := a.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, protocol.ErrInternal
	}
	defer conn.Release()

	var (
		userId       int
		username     string
		hashPassword string
	)
	err = conn.QueryRow(ctx, "SELECT user_id, username, password_hash FROM users WHERE email=$1", email).Scan(&userId, &username, &hashPassword)
	if err != nil {
		log.Println(err)
		return nil, protocol.ErrUserNotFound
	}

	err = bcrypt.CompareHashAndPassword([]byte(hashPassword), []byte(password))
	if err != nil {
		return nil, protocol.ErrInvalidCredentials
	}

	return &model.UserInfo{ID: userId, Username: username}, nil
}

func (a *authRepo) CreateUser(ctx context.Context, email, password string) (*model.UserInfo, error) {
	conn, err := a.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, protocol.ErrInternal
	}
	defer conn.Release()

	var userId int

	hashPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Printf("unable to begin transaction: %v\n", err)
		return nil, protocol.ErrInternal
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	username := utils.NameFromEmail(email)
	free, err := a.isUsernameFree(tx, ctx, username)
	if err != nil {
		log.Println(err)

		return nil, err
	}

	for tries := 0; tries < 10 && !free; tries++ {
		username = fmt.Sprintf("%s%d", username, utils.GenerateCode(6))
		free, _ = a.isUsernameFree(tx, ctx, username)
	}

	if !free {
		log.Println("cannot generate unique username")

		return nil, errors.New("cannot generate unique username")
	}

	query := `INSERT INTO users (username, email, password_hash)
	VALUES ($1, $2, $3) RETURNING user_id`

	err = tx.QueryRow(ctx, query, username, email, hashPassword).Scan(&userId)
	if err != nil {
		log.Println(err)

		return nil, protocol.ErrInternal
	}

	err = tx.Commit(ctx)
	if err != nil {
		log.Fatalf("unable to commit transaction: %v", err)
		return nil, protocol.ErrInternal
	}

	return &model.UserInfo{ID: userId, Username: username}, nil
}

/* ---- Token ---- */

func (a *authRepo) InsertRefreshToken(ctx context.Context, token model.UserSessionDB) error {
	dbConn, err := a.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return protocol.ErrInternal
	}
	defer dbConn.Release()

	hashToken, err := utils.GetHash(token.Token)
	if err != nil {
		return protocol.ErrInternal
	}

	query := `INSERT INTO sessions (user_id, os, device, browser, token, jti, expires_at)
	VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 day')`

	_, err = dbConn.Exec(ctx, query, token.ID, token.OS,
		token.Device, token.Browser, string(hashToken), token.JTI)
	if err != nil {
		return protocol.ErrInternal
	}

	return nil
}

func (a *authRepo) GetRefreshToken(ctx context.Context, userId int, jti string) (*model.RefreshTokenDB, error) {
	var res model.RefreshTokenDB

	dbConn, err := a.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, protocol.ErrInternal
	}
	defer dbConn.Release()

	query := `SELECT session_id, token, expires_at FROM sessions WHERE user_id = $1 AND jti = $2`

	err = dbConn.QueryRow(ctx, query, userId, jti).Scan(&res.Id, &res.Token, &res.Exp)
	if err != nil {
		log.Println(err)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, protocol.ErrNotFound
		}
		return nil, protocol.ErrInternal
	}

	return &res, nil
}

func (a *authRepo) TerminateRefreshToken(ctx context.Context, id int) error {
	dbConn, err := a.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return protocol.ErrInternal
	}
	defer dbConn.Release()

	query := `UPDATE sessions
		SET terminated = true
		WHERE session_id = $1
	`
	rows, err := dbConn.Exec(ctx, query, id)
	if err != nil {
		log.Println(err)
		return protocol.ErrInternal
	}

	if rows.RowsAffected() == 0 {
		return protocol.ErrNotFound
	}

	return nil
}

/* ---- Credentials ---- */

func (a *authRepo) ChangePassword(ctx context.Context, email, password string) error {
	dbConn, err := a.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return protocol.ErrInternal
	}
	defer dbConn.Release()

	hashPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)

	query := `UPDATE users
		SET password_hash = $2
		WHERE email = $1
	`
	rows, err := dbConn.Exec(ctx, query, email, hashPassword)
	if err != nil {
		log.Println(err)
		return protocol.ErrInternal
	}

	if rows.RowsAffected() == 0 {
		return protocol.ErrNotFound
	}

	return nil
}
