package module

import (
	"context"
	"fmt"
	"log"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5"
)

func (r *moduleRepo) GetByID(
	ctx context.Context,
	userID, id int,
) (*model.Module, *protocol.AppError) {
	query := `SELECT
			m.module_id as id,
			m.title,
			m.description,
			m.slug,
			json_build_object('name', u.username, 'avatar', u.avatar) AS author,
			m.user_id = $2 as is_owner,
			(SELECT EXISTS(SELECT 1 FROM user_saved_modules WHERE user_id = $2 AND module_id = $1)) as is_saved,
    		(NOT m.is_private OR m.user_id = $2) as accessible,
			kw.keywords,
			c.cards
		FROM modules m
			LEFT JOIN users u ON u.user_id = m.user_id
			LEFT JOIN LATERAL (
				SELECT
					json_agg(json_build_object('name', kt.name, 'slug', kw.kw_slug)) AS keywords
				FROM
					module_keywords mk
					JOIN keywords kw ON kw.kw_id = mk.kw_id
					JOIN keyword_translations kt ON  kt.kw_id = kw.kw_id
				WHERE
					mk.module_id = m.module_id
					AND kt.lang IN ('ua', 'universal')
			) kw ON TRUE
			LEFT JOIN LATERAL (
				SELECT
					json_agg(
						json_build_object(
							'id',
							c.card_id,
							'title',
							json_build_object('text', c.title, 'media', json_build_object('type', c.title_media_type, 'content', c.title_media)),
							'description',
							json_build_object('text', c.description, 'media', json_build_object('type', c.description_media_type, 'content', c.description_media))
						)
					ORDER BY c.card_id
					) AS cards
				FROM
					module_cards c
				WHERE
					c.module_id = m.module_id
			) c ON TRUE
		WHERE
			m.module_id = $1
	`

	module := model.Module{}
	if err := r.psql.QueryRow(ctx, query, id, userID).Scan(
		&module.ID,
		&module.Title,
		&module.Description,
		&module.Slug,
		&module.Author,
		&module.IsOwner,
		&module.IsSaved,
		&module.Accessible,
		&module.Keywords,
		&module.Cards,
	); err != nil {
		utils.LogError("MODULE:PSQL:GetByID:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	module.Objects = len(module.Cards)

	return &module, nil
}

func (r *moduleRepo) Find(
	ctx context.Context,
	userID int,
	query FindMoulesQuery,
) (*model.ModulesSummaryResponse, *protocol.AppError) {
	queryIDs := `SELECT
		array_agg(module_id)
	FROM (
		SELECT m.module_id
		FROM modules m
			JOIN module_keywords mk ON mk.module_id = m.module_id
			JOIN keywords k ON k.kw_id = mk.kw_id

			LEFT JOIN LATERAL (
				SELECT COUNT(*) as objects
				FROM module_cards mc 
				WHERE mc.module_id = m.module_id
			) mc ON TRUE
		WHERE
			($3::text[] IS NULL OR k.kw_slug = ANY($3::text[]))
			AND m.title ILIKE '%' || $2 || '%'
			AND (NOT m.is_private OR m.user_id = $1)
			AND m.module_id > $4
	`

	if query.Limit != "" {
		switch query.Limit {
		case "lessThanTwenty":
			queryIDs += `AND mc.objects < 20`
		case "twentyToFifty":
			queryIDs += `AND mc.objects >= 20 AND mc.objects < 50`
		case "moreThanFifty":
			queryIDs += `AND mc.objects >= 50`
		}
	}

	queryIDs += ` GROUP BY m.module_id
		LIMIT 12
	)`

	var ids []int
	err := r.psql.QueryRow(ctx, queryIDs, userID, query.Title, query.Keywords, query.LastID).Scan(&ids)
	if err != nil {
		utils.LogError("MODULE:PSQL:Find:QueryRow", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	queryModule := `SELECT
		m.module_id as id,
		m.title,
		m.slug,
		json_build_object('hasMedia', m.has_images, 'thumbnail', media.thumbnail) AS media,
		json_build_object('name', u.username, 'avatar', u.avatar) AS author,
		m.user_id = $2 as is_owner,
		(SELECT EXISTS(SELECT 1 FROM user_saved_modules WHERE user_id = $2 AND module_id = $1)) as is_saved,
		mc.objects
	FROM modules m
		LEFT JOIN users u ON u.user_id = m.user_id

		LEFT JOIN LATERAL (
			SELECT description_media AS thumbnail
			FROM module_cards
			WHERE 
				module_id = m.module_id
				AND description_media IS NOT NULL
			ORDER BY card_id
			LIMIT 1
		) media ON TRUE


		LEFT JOIN LATERAL (
			SELECT COUNT(*) as objects
			FROM module_cards mc 
			WHERE mc.module_id = m.module_id
		) mc ON TRUE

	WHERE
		m.module_id = $1
	`

	modules := []model.ModuleSummary{}
	for _, id := range ids {
		module := model.ModuleSummary{}
		if err = r.psql.QueryRow(ctx, queryModule, id, userID).Scan(
			&module.ID,
			&module.Title,
			&module.Slug,
			&module.Media,
			&module.Author,
			&module.IsOwner,
			&module.IsSaved,
			&module.Objects,
		); err != nil {
			utils.LogError("MODULE:PSQL:Find:QueryRow", err)
			return nil, protocol.ErrInternal.Wrap(err)
		}

		modules = append(modules, module)
	}

	return &model.ModulesSummaryResponse{Modules: modules}, nil
}

func (r *moduleRepo) ListByUserID(
	ctx context.Context,
	userID int,
	username string,
	q Query,
) (*model.ModulesSummaryResponse, *protocol.AppError) {
	args := []interface{}{username, userID}
	placeholder := 3

	query := `SELECT
		m.module_id as id,
		m.title,
		m.slug,
		m.user_id = $2 as is_owner,
		(SELECT EXISTS(SELECT 1 FROM user_saved_modules WHERE user_id = $2 AND module_id = m.module_id)) as is_saved,
		json_build_object('hasMedia', m.has_images, 'thumbnail', media.thumbnail) AS media,
		mc.objects
	FROM modules m
		JOIN users u ON u.user_id = m.user_id

		LEFT JOIN LATERAL (
			SELECT description_media AS thumbnail
			FROM module_cards
			WHERE 
				module_id = m.module_id
				AND description_media IS NOT NULL
			ORDER BY card_id
			LIMIT 1
		) media ON TRUE

		LEFT JOIN LATERAL (
			SELECT COUNT(*) as objects
			FROM module_cards mc 
			WHERE mc.module_id = m.module_id
		) mc ON TRUE
	WHERE
		u.username = $1
		AND (NOT m.is_private OR m.user_id = $2)
	`

	if len(q.Name) > 0 {
		query += fmt.Sprintf(" AND m.title ILIKE '%%' || $%d || '%%'", placeholder)
		args = append(args, q.Name)
		placeholder++
	}

	if q.LastID > 0 {
		query += fmt.Sprintf(" AND m.module_id > $%d", placeholder)
		args = append(args, q.LastID)
		placeholder++
	}

	query += ` ORDER BY m.module_id LIMIT 10`

	rows, err := r.psql.Query(ctx, query, args...)
	if err != nil {
		utils.LogError("MODULE:PSQL:ListByUserID:Query", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	modules := []model.ModuleSummary{}
	for rows.Next() {
		module := model.ModuleSummary{}

		if err := rows.Scan(
			&module.ID,
			&module.Title,
			&module.Slug,
			&module.IsOwner,
			&module.IsSaved,
			&module.Media,
			&module.Objects,
		); err != nil {
			utils.LogError("MODULE:PSQL:ListByUserID:Scan", err)
			return nil, protocol.ErrInternal.Wrap(err)
		}

		modules = append(modules, module)
	}

	return &model.ModulesSummaryResponse{Modules: modules}, nil
}

func (r *moduleRepo) ListSavedByUserID(
	ctx context.Context,
	userID int,
	q Query,
) (*model.ModulesSummaryResponse, *protocol.AppError) {
	args := []interface{}{userID}
	placeholder := 2

	query := `SELECT 
			m.module_id as id,
			m.title,
			m.slug,
			m.user_id = $1 as is_owner,
			json_build_object('hasMedia', m.has_images, 'thumbnail', media.thumbnail) AS media,
			mc.objects
		FROM user_saved_modules usv
		JOIN modules m ON m.module_id = usv.module_id

		JOIN users u ON u.user_id = m.user_id

		LEFT JOIN LATERAL (
			SELECT description_media AS thumbnail
			FROM module_cards
			WHERE 
				module_id = m.module_id
				AND description_media IS NOT NULL
			ORDER BY card_id
			LIMIT 1
		) media ON TRUE

		LEFT JOIN LATERAL (
			SELECT COUNT(*) as objects
			FROM module_cards mc 
			WHERE mc.module_id = m.module_id
		) mc ON TRUE
	WHERE
		(NOT m.is_private OR m.user_id = $1)
	`

	if len(q.Name) > 0 {
		query += fmt.Sprintf(" AND m.title ILIKE '%%' || $%d || '%%'", placeholder)
		args = append(args, q.Name)
		placeholder++
	}

	if q.LastID > 0 {
		query += fmt.Sprintf(" AND m.module_id > $%d", placeholder)
		args = append(args, q.LastID)
		placeholder++
	}

	query += `  LIMIT 10`

	rows, err := r.psql.Query(ctx, query, args...)
	if err != nil {
		utils.LogError("MODULE:PSQL:ListSavedByUserID:Query", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	modules := []model.ModuleSummary{}
	for rows.Next() {
		module := model.ModuleSummary{}

		if err := rows.Scan(
			&module.ID,
			&module.Title,
			&module.Slug,
			&module.IsOwner,
			&module.Media,
			&module.Objects,
		); err != nil {
			utils.LogError("MODULE:PSQL:ListSavedByUserID:Scan", err)
			return nil, protocol.ErrInternal.Wrap(err)
		}

		module.IsSaved = true
		modules = append(modules, module)
	}

	return &model.ModulesSummaryResponse{Modules: modules}, nil
}

func (r *moduleRepo) Create(
	ctx context.Context,
	userID int,
	module model.CreateModuleRequest,
) (*model.CreateModuleResponse, *protocol.AppError) {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("MODULE:PSQL:CreateModule:BeginTransaction", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	query := `INSERT INTO modules 
		(user_id, title, description, slug, has_images) 
		VALUES ($1, $2, $3, $4, $5) 
		RETURNING module_id
	`

	hasImages := utils.Contains(module.Cards, func(card model.CreateCard) bool {
		return card.Title.Media.Content != nil || card.Description.Media.Content != nil
	})

	var id int
	err = tx.QueryRow(ctx, query, userID, module.Title, module.Description, utils.GenerateSlug(module.Title), hasImages).Scan(&id)
	if err != nil {
		return nil, protocol.ErrInternal.Wrap(err)
	}

	for _, card := range module.Cards {
		if err := insertCard(tx, ctx, id, card); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, protocol.ErrInternal.Wrap(err)
	}

	return &model.CreateModuleResponse{ID: id}, nil
}

func (r *moduleRepo) Update(
	ctx context.Context,
	userID int,
	module model.UpdateModuleRequest,
) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("MODULE:PSQL:UpdateModule:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var exists bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM modules WHERE module_id=$1 AND user_id=$2)", module.ID, userID).Scan(&exists)
	if err != nil {
		log.Println(err)
		return protocol.ErrInternal.Wrap(err)
	}

	if !exists {
		return protocol.ErrModuleNotFound
	}

	if module.Title != nil {
		cmdTag, err := tx.Exec(ctx, `UPDATE modules SET title=$1, slug=$2 WHERE module_id=$3 AND user_id=$4`,
			module.Title, utils.GenerateSlug(*module.Title), module.ID, userID)
		if err != nil {
			log.Println(err)
			return protocol.ErrInternal.Wrap(err)
		}

		if cmdTag.RowsAffected() == 0 {
			return protocol.ErrModuleNotFound
		}
	}

	if module.Description != nil {
		cmdTag, err := tx.Exec(ctx, `UPDATE modules SET description=$1 WHERE module_id=$2 AND user_id=$3`,
			module.Description, module.ID, userID)
		if err != nil {
			log.Println(err)
			return protocol.ErrInternal.Wrap(err)
		}

		if cmdTag.RowsAffected() == 0 {
			return protocol.ErrModuleNotFound
		}
	}

	for _, card := range module.Cards {
		if card.Delete && card.ID != nil {
			if err := deleteCard(tx, ctx, module.ID, *card.ID); err != nil {
				log.Println(err)
				return err
			}
		} else if card.ID == nil {
			if err := insertCard(tx, ctx, module.ID, model.CreateCard{
				Title:       card.Title,
				Description: card.Description,
			}); err != nil {
				log.Println(err)
				return err
			}
		} else {
			if err := updateCard(tx, ctx, module.ID, card); err != nil {
				log.Println(err)
				return err
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		log.Println(err)
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *moduleRepo) UpdateCard(
	ctx context.Context,
	userID int,
	card model.UpdateModuleCard,
) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("MODULE:PSQL:UpdateModuleCard:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var exists bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM modules WHERE module_id=$1 AND user_id=$2)", card.ID, userID).Scan(&exists)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	if !exists {
		return protocol.ErrModuleNotFound
	}

	rows, err := tx.Exec(ctx, `UPDATE module_cards SET
		title=$1, description=$2
		WHERE card_id=$3 AND module_id=$4`, card.Title, card.Description, card.CardID, card.ID)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	if rows.RowsAffected() == 0 {
		return protocol.ErrCardNotFound
	}

	if err := tx.Commit(ctx); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *moduleRepo) Delete(
	ctx context.Context,
	userID,
	moduleID int,
) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("MODULE:PSQL:DeleteModule:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	cmdTag, err := tx.Exec(ctx,
		`DELETE FROM modules WHERE module_id = $1 AND user_id = $2`,
		moduleID, userID)
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

func (r *moduleRepo) Save(
	ctx context.Context,
	userID int,
	moduleID int,
) *protocol.AppError {
	query := `INSERT INTO user_saved_modules (user_id, module_id) 
		VALUES ($1, $2) ON CONFLICT (user_id, module_id) DO NOTHING`

	if _, err := r.psql.Exec(ctx, query, userID, moduleID); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *moduleRepo) Unsave(
	ctx context.Context,
	userID int,
	moduleID int,
) *protocol.AppError {
	query := `DELETE FROM user_saved_modules WHERE user_id = $1 AND module_id = $2`

	if _, err := r.psql.Exec(ctx, query, userID, moduleID); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func (r *moduleRepo) GetAccess(
	ctx context.Context,
	moduleID int,
) (bool, int, *protocol.AppError) {
	query := `
		SELECT is_private, user_id
		FROM modules
		WHERE module_id = $1
	`
	var (
		isPrivate bool
		ownerID   int
	)
	err := r.psql.QueryRow(ctx, query, moduleID).Scan(&isPrivate, &ownerID)
	if err != nil {
		return false, 0, protocol.ErrInternal.Wrap(err)
	}

	return isPrivate, ownerID, nil
}

func (r *moduleRepo) SearchKeywords(
	ctx context.Context,
	title string,
) ([]model.Keyword, *protocol.AppError) {
	query := `
		SELECT kt.name, kw.kw_slug
		FROM keyword_translations kt
			JOIN keywords kw ON kw.kw_id = kt.kw_id
		WHERE
			kt.name ILIKE '%' || $1 || '%' 
			AND kt.lang IN ('ua', 'universal')
		LIMIT 10
	`

	rows, err := r.psql.Query(ctx, query, title)
	if err != nil {
		utils.LogError("MODULE:PSQL:FindKeywords:Query", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	keywords := []model.Keyword{}
	for rows.Next() {
		keyword := model.Keyword{}

		if err := rows.Scan(
			&keyword.Name,
			&keyword.Slug,
		); err != nil {
			utils.LogError("MODULE:PSQL:FindKeywords:Scan", err)
			return nil, protocol.ErrInternal.Wrap(err)
		}

		keywords = append(keywords, keyword)
	}

	return keywords, nil
}

func (r *moduleRepo) GetKeywordsBySlug(
	ctx context.Context,
	slugs []string,
) ([]model.Keyword, *protocol.AppError) {
	query := `
		SELECT kt.name, kw.kw_slug
		FROM keywords kw
			JOIN keyword_translations kt ON kt.kw_id = kw.kw_id
		WHERE
			kw.kw_slug = ANY($1)
			AND kt.lang IN ('ua', 'universal')
	`

	rows, err := r.psql.Query(ctx, query, slugs)
	if err != nil {
		utils.LogError("MODULE:PSQL:FindKeywordsBySlug:Query", err)
		return nil, protocol.ErrInternal.Wrap(err)
	}

	keywords := []model.Keyword{}
	for rows.Next() {
		keyword := model.Keyword{}

		if err := rows.Scan(
			&keyword.Name,
			&keyword.Slug,
		); err != nil {
			utils.LogError("MODULE:PSQL:FindKeywordsBySlug:Scan", err)
			return nil, protocol.ErrInternal.Wrap(err)
		}

		keywords = append(keywords, keyword)
	}

	return keywords, nil
}

func (r *moduleRepo) CreateKeywords(
	ctx context.Context,
	keywords []string,
) *protocol.AppError {
	tx, err := r.psql.Begin(ctx)
	if err != nil {
		utils.LogError("MODULE:PSQL:InsertKeywords:BeginTransaction", err)
		return protocol.ErrInternal.Wrap(err)
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	insertKeywordQuery := `INSERT INTO keywords (kw_slug, is_translatable) VALUES ($1, $2) ON CONFLICT (kw_slug) DO NOTHING RETURNING kw_id`
	insertTranslationQuery := `INSERT INTO keyword_translations (kw_id, lang, name) VALUES ($1, 'ua', $2) ON CONFLICT (kw_id, lang) DO NOTHING`

	for _, keyword := range keywords {
		var kwId int

		err := tx.QueryRow(ctx, insertKeywordQuery, utils.GenerateSlug(keyword), true).Scan(&kwId)
		if err != nil {
			return protocol.ErrInternal.Wrap(err)
		}

		_, err = tx.Exec(ctx, insertTranslationQuery, kwId, keyword)
		if err != nil {
			return protocol.ErrInternal.Wrap(err)
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return protocol.ErrInternal.Wrap(err)
	}
	return nil
}

func insertCard(
	tx pgx.Tx,
	ctx context.Context,
	moduleID int,
	card model.CreateCard,
) *protocol.AppError {
	query := `INSERT INTO module_cards
		(module_id, title, description, title_media_type, title_media, 
		description_media_type, description_media)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	prepareMediaType(&card.Title.Media)
	prepareMediaType(&card.Description.Media)

	_, err := tx.Exec(ctx, query, moduleID,
		card.Title.Text, card.Description.Text, card.Title.Media.Type, card.Title.Media.Content,
		card.Description.Media.Type, card.Description.Media.Content,
	)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	return nil
}

func updateCard(
	tx pgx.Tx,
	ctx context.Context,
	moduleID int,
	card model.CardUpdate,
) *protocol.AppError {
	prepareMediaType(&card.Title.Media)
	prepareMediaType(&card.Description.Media)

	cmdTag, err := tx.Exec(ctx, `UPDATE module_cards SET
		title=$1, description=$2, title_media_type=$3, title_media=$4, 
		description_media_type=$5, description_media=$6
	WHERE card_id=$7 AND module_id=$8`,
		card.Title.Text, card.Description.Text, card.Title.Media.Type,
		card.Title.Media.Content, card.Description.Media.Type,
		card.Description.Media.Content, card.ID, moduleID)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	if cmdTag.RowsAffected() == 0 {
		return protocol.ErrCardNotFound
	}

	return nil
}

func deleteCard(
	tx pgx.Tx,
	ctx context.Context,
	moduleID, cardId int,
) *protocol.AppError {
	cmdTag, err := tx.Exec(ctx, `DELETE FROM module_cards WHERE card_id=$1 AND module_id=$2`,
		cardId, moduleID)
	if err != nil {
		return protocol.ErrInternal.Wrap(err)
	}

	if cmdTag.RowsAffected() == 0 {
		return protocol.ErrCardNotFound
	}

	return nil
}

func prepareMediaType(m *model.MediaBlock) {
	if m.Content == nil {
		m.Type = nil
	} else {
		mediaType := "image"
		m.Type = &mediaType
	}
}
