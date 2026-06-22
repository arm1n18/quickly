package folder

import (
	"context"
	"fmt"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5/pgconn"
)

func (r *folderRepo) List(ctx context.Context, userID int, username string, q Query) (*model.FoldersSummary, *protocol.AppError) {
	args := []interface{}{username, userID}
	placeholder := 3

	query := `
		SELECT COALESCE(json_agg(folder_data), '[]') AS folders
		FROM (
			SELECT
				f.folder_id as id,
				f.title,
				f.slug,
				COUNT(fm.module_id) AS objects,
				f.user_id = $2 as isOwner
			FROM folders f
			LEFT JOIN folder_modules fm ON fm.folder_id = f.folder_id
			WHERE f.user_id = (SELECT user_id FROM users WHERE username = $1)
	`

	if q.LastID > 0 {
		query += fmt.Sprintf(" AND f.folder_id > $%d", placeholder)
		args = append(args, q.LastID)
		placeholder++
	}

	if len(q.Name) > 0 {
		query += fmt.Sprintf(" AND f.title ILIKE '%%' || $%d || '%%'", placeholder)
		args = append(args, q.Name)
		placeholder++
	}

	query += `
		GROUP BY f.folder_id, f.title, f.slug
		ORDER BY f.folder_id
		LIMIT 10
	) folder_data
	`

	userFolders := model.FoldersSummary{}

	err := r.psql.QueryRow(ctx, query, args...).Scan(&userFolders.Folders)
	if err != nil {
		utils.LogError("FOLDER:PSQL:ListFolders:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &userFolders, nil
}

func (r *folderRepo) Get(ctx context.Context, userID int, username, slug string) (*model.Folder, *protocol.AppError) {
	query := `
		SELECT
			f.title,
			f.slug,
			json_build_object('name', u.username, 'avatar', u.avatar) AS author,
			f.user_id = $3 as is_owner,
			COALESCE(folders.modules, '[]') AS modules
			FROM users u
			LEFT JOIN folders f ON f.user_id = u.user_id
			LEFT JOIN folder_modules fm ON fm.folder_id = f.folder_id
			
			LEFT JOIN LATERAL (
				SELECT json_agg(
					json_build_object(
						'id', m.module_id,
						'title', m.title,
						'slug', m.slug,
						'author', json_build_object('name', u.username, 'avatar', u.avatar),
						'isOwner', m.user_id = $3,
						'isSaved', (SELECT EXISTS(SELECT 1 FROM user_saved_modules WHERE user_id = $3 AND module_id = m.module_id)),
						'objects', (
							SELECT COUNT(*) FROM module_cards mc WHERE mc.module_id = m.module_id
						),
						'media', json_build_object('hasMedia', m.has_images, 'thumbnail', media.thumbnail)
						
					)
				) as modules
				FROM modules m
				LEFT JOIN users u ON u.user_id = m.user_id

				LEFT JOIN LATERAL (
					SELECT description_media AS thumbnail
					FROM module_cards
					WHERE module_id = m.module_id
					AND description_media IS NOT NULL
					ORDER BY card_id
					LIMIT 1
				) media ON TRUE
				WHERE m.module_id = fm.module_id AND (NOT m.is_private OR m.user_id = $3)
			) folders ON TRUE
			
		WHERE u.username = $1 and f.slug = $2
	`

	folder := model.Folder{}

	err := r.psql.QueryRow(ctx, query, username, slug, userID).Scan(
		&folder.Title,
		&folder.Slug,
		&folder.Author,
		&folder.IsOwner,
		&folder.Modules,
	)
	if err != nil {
		utils.LogError("FOLDER:PSQL:GetFolder:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	folder.Objects = len(folder.Modules)

	return &folder, nil
}

func (r *folderRepo) Create(ctx context.Context, userID int, title string) (string, *protocol.AppError) {
	query := `INSERT INTO folders 
		(user_id, title, slug) 
		VALUES ($1, $2, $3) 
		RETURNING slug
	`

	var slug string
	err := r.psql.QueryRow(ctx, query, userID, title, utils.GenerateSlug(title)).Scan(&slug)
	if err != nil {
		if err, ok := err.(*pgconn.PgError); ok && err.Code == "23505" {
			return "", protocol.ErrFolderAlreadyExists
		}
		return "", protocol.ErrInternal.Wrap(err)
	}

	return slug, nil
}

func (r *folderRepo) Update(ctx context.Context, userID int, oldSlug, title string) (string, *protocol.AppError) {
	newSlug := utils.GenerateSlug(title)

	query := `UPDATE folders SET title=$1, slug = $2 WHERE slug=$3 AND user_id = $4`
	cmdTag, err := r.psql.Exec(ctx, query, title, newSlug, oldSlug, userID)
	if err != nil {
		return "", protocol.ErrInternal.Wrap(err)
	}

	if cmdTag.RowsAffected() == 0 {
		return "", protocol.ErrFolderNotFound
	}

	return newSlug, nil
}

func (r *folderRepo) Delete(ctx context.Context, userID int, username, slug string) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("FOLDER:PSQL:DeleteFolder:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	query := `DELETE FROM folders f
		USING users u
		WHERE f.user_id = u.user_id
			AND f.slug = $1
			AND u.username = $2
			AND f.user_id = $3
	`

	cmdTag, err := tx.Exec(ctx, query, slug, username, userID)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	if cmdTag.RowsAffected() == 0 {
		return protocol.ErrFolderNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *folderRepo) AddModule(ctx context.Context, userID, moduleID int, slug string) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("FOLDER:PSQL:AddModuleToFolder:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	query := `INSERT INTO folder_modules (folder_id, module_id)
		SELECT f.folder_id, $3
		FROM folders f
		WHERE f.slug = $1 AND f.user_id = $2
		ON CONFLICT DO NOTHING
	`

	cmdTag, err := tx.Exec(ctx, query, slug, userID, moduleID)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	if cmdTag.RowsAffected() == 0 {
		return protocol.ErrModuleNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *folderRepo) RemoveModule(ctx context.Context, userID, moduleID int, slug string) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("FOLDER:PSQL:DeleteModuleFromFolder:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	query := `DELETE FROM folder_modules fm
		USING folders f
		WHERE fm.folder_id = f.folder_id
			AND f.user_id = $1
			AND f.slug = $2
			AND fm.module_id = $3
	`

	cmdTag, err := tx.Exec(ctx, query, userID, slug, moduleID)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	if cmdTag.RowsAffected() == 0 {
		return protocol.ErrModuleNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}
