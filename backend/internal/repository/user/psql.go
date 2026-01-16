package user

import (
	"context"
	"fmt"
	"log"
	"web-quiz/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Query struct {
	Name   string
	LastId int
}

type UserRepository interface {
	FetchUserProfile(ctx context.Context, username string) (*model.Author, error)

	FetchUserFolders(ctx context.Context, username string, queryParams Query) (*model.FoldersSummary, error)
	FetchFolder(ctx context.Context, username, slug string) (*model.Folder, error)
}

type userRepo struct {
	psql *pgxpool.Pool
}

func NewUserRepository(psql *pgxpool.Pool) UserRepository {
	return &userRepo{psql: psql}
}

func (m *userRepo) FetchUserProfile(ctx context.Context, username string) (*model.Author, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	query := `SELECT username, avatar_url FROM users WHERE username = $1`

	user := model.Author{}

	err = conn.QueryRow(ctx, query, username).Scan(&user.Name, &user.Avatar)
	if err != nil {
		log.Printf("error query user: %v\n", err)
		return nil, err
	}

	return &user, nil
}

func (m *userRepo) FetchUserFolders(ctx context.Context, username string, queryParams Query) (*model.FoldersSummary, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	args := []interface{}{username}
	placeholder := 2

	query := `
		SELECT COALESCE(json_agg(folder_data), '[]') AS folders
		FROM (
			SELECT
				f.folder_id,
				f.title,
				f.slug,
				COUNT(fm.module_id) AS objects
			FROM folders f
			LEFT JOIN folder_modules fm ON fm.folder_id = f.folder_id
			WHERE f.user_id = (SELECT user_id FROM users WHERE username = $1)
	`

	if queryParams.LastId > 0 {
		query += fmt.Sprintf(" AND f.folder_id > $%d", placeholder)
		args = append(args, queryParams.LastId)
		placeholder++
	}

	if len(queryParams.Name) > 0 {
		query += fmt.Sprintf(" AND f.title ILIKE '%%' || $%d || '%%'", placeholder)
		args = append(args, queryParams.Name)
		placeholder++
	}

	query += `
		GROUP BY f.folder_id, f.title, f.slug
		ORDER BY f.folder_id
	) folder_data
	`

	userFolders := model.FoldersSummary{}

	err = conn.QueryRow(ctx, query, args...).Scan(&userFolders.Folders)
	if err != nil {
		log.Printf("error query modules: %v\n", err)
		return nil, err
	}

	return &userFolders, nil
}

func (m *userRepo) FetchFolder(ctx context.Context, username, slug string) (*model.Folder, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	query := `
		SELECT
			f.title,
			f.slug,
			json_build_object('name', u.username, 'avatar', u.avatar_url) AS author,
			folders.modules
			FROM users u
			LEFT JOIN folders f ON f.user_id = u.user_id
			LEFT JOIN folder_modules fm ON fm.folder_id = f.folder_id
			
			LEFT JOIN LATERAL (
				SELECT json_agg(
					json_build_object(
						'id', m.module_id,
						'title', m.title,
						'slug', m.slug,
						'objects', (
							SELECT COUNT(*) FROM modules m WHERE m.module_id = fm.module_id
						)
						
					)
				) as modules
				FROM modules m
				WHERE m.module_id = fm.module_id
			) folders ON TRUE
			
		WHERE u.username = $1 and f.slug = $2
	`

	folder := model.Folder{}

	err = conn.QueryRow(ctx, query, username, slug).Scan(
		&folder.Title,
		&folder.Slug,
		&folder.Author,
		&folder.Modules,
	)
	if err != nil {
		log.Printf("error query modules: %v\n", err)
		return nil, err
	}

	folder.Objects = len(folder.Modules)

	return &folder, nil
}
