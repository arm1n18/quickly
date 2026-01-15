package user

import (
	"context"
	"log"
	"web-quiz/internal/model"

	"github.com/jackc/pgx/v5/pgxpool"
)

type UserRepository interface {
	FetchUserProfile(ctx context.Context, username string) (*model.Author, error)

	FetchUserFolders(ctx context.Context, username string) (*model.FoldersSummary, error)
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

func (m *userRepo) FetchUserFolders(ctx context.Context, username string) (*model.FoldersSummary, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	query := `SELECT
			json_build_object('name', u.username, 'avatar', u.avatar_url) AS author,
			folders.folders
			FROM users u
			LEFT JOIN LATERAL (
				SELECT json_agg(
					json_build_object(
						'title', f.title,
						'slug', f.slug,
						'objects', (
							SELECT COUNT(*) FROM modules m WHERE m.module_id = fm.module_id
						)
						
					)
				) as folders
				FROM folders f
				LEFT JOIN folder_modules fm ON fm.module_id = f.folder_id
				LEFT JOIN modules m ON m.module_id = fm.module_id
				WHERE f.user_id = u.user_id
				GROUP BY f.user_id
			) folders ON TRUE
		WHERE u.username = $1
	`

	userFolders := model.FoldersSummary{}

	err = conn.QueryRow(ctx, query, username).Scan(&userFolders.Author, &userFolders.Folders)
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
