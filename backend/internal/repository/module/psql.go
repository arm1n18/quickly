package module

import (
	"context"
	"fmt"
	"log"
	"web-quiz/internal/model"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Query struct {
	Name   string
	LastId int
}

type ModuleRepository interface {
	GetByID(ctx context.Context, id int) (*model.Module, error)
	FindByName(ctx context.Context, name string, lastId int) (*model.ModulesSummaryResponse, error)
	FindByKeywords(ctx context.Context, keywords []string) (*model.ModulesSummaryResponse, error)
	ListByUserID(ctx context.Context, username string, queryParams Query) (*model.UserModulesResponse, error)

	CreateModule(ctx context.Context, userId int, module model.CreateModuleRequest) (*model.CreateModuleResponse, error)
	DeleteModule(ctx context.Context, userId int, moduleId int) error

	InsertKeywords(ctx context.Context, keywords []string) error
}

type moduleRepo struct {
	psql *pgxpool.Pool
}

func NewModuleRepository(psql *pgxpool.Pool) ModuleRepository {
	return &moduleRepo{psql: psql}
}

func (m *moduleRepo) GetByID(ctx context.Context, id int) (*model.Module, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	query := `SELECT
			m.module_id as id,
			m.title,
			m.slug,
			json_build_object('name', u.username, 'avatar', u.avatar_url) AS author,
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

	if err = conn.QueryRow(ctx, query, id).Scan(
		&module.Id,
		&module.Title,
		&module.Slug,
		&module.Author,
		&module.Keywords,
		&module.Cards,
	); err != nil {
		log.Printf("error query module: %v\n", err)
		return nil, err
	}

	module.Objects = len(module.Cards)

	return &module, nil
}

func (m *moduleRepo) FindByName(ctx context.Context, name string, lastId int) (*model.ModulesSummaryResponse, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	args := []interface{}{name}

	query := `SELECT
		m.module_id as id,
		m.title,
		m.slug,
		m.has_images,
		json_build_object('name', u.username, 'avatar', u.avatar_url) AS author,
		kw.keywords,
		mc.objects
	FROM modules m
		LEFT JOIN users u ON u.user_id = m.user_id

		LEFT JOIN LATERAL (
			SELECT COUNT(*) as objects
			FROM module_cards mc 
			WHERE mc.module_id = m.module_id
		) mc ON TRUE

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
	WHERE
		m.title ILIKE '%' || $1 || '%'
	`

	if lastId > 0 {
		query += ` AND m.module_id > $2`
		args = append(args, lastId)
	}

	query += ` LIMIT 10`

	modules := []model.ModuleSummary{}

	rows, err := conn.Query(ctx, query, args...)
	if err != nil {
		log.Printf("error query modules: %v\n", err)
		return nil, err
	}

	for rows.Next() {
		module := model.ModuleSummary{}

		if err := rows.Scan(
			&module.Id,
			&module.Title,
			&module.Slug,
			&module.HasImages,
			&module.Author,
			&module.Keywords,
			&module.Objects,
		); err != nil {
			log.Printf("error scanning row: %v\n", err)
			return nil, err
		}

		modules = append(modules, module)
	}

	return &model.ModulesSummaryResponse{Modules: modules}, nil
}

func (m *moduleRepo) FindByKeywords(ctx context.Context, keywords []string) (*model.ModulesSummaryResponse, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	var ids []int

	queryModulesIds := `SELECT
		json_agg(module_id)
	FROM (
		SELECT m.module_id
		FROM modules m
			JOIN module_keywords mk ON mk.module_id = m.module_id
			JOIN keywords k ON k.kw_id = mk.kw_id
		WHERE
			k.kw_slug = ANY($1)
			GROUP BY m.module_id
			HAVING COUNT (DISTINCT k.kw_slug) = array_length($1, 1)
		LIMIT 10
	)`

	err = conn.QueryRow(ctx, queryModulesIds, keywords).Scan(&ids)
	if err != nil {
		log.Printf("error query modules: %v\n", err)
		return nil, err
	}

	queryModule := `SELECT
		m.module_id as id,
		m.title,
		m.slug,
		m.has_images,
		json_build_object('name', u.username, 'avatar', u.avatar_url) AS author,
		kw.keywords,
		mc.objects
	FROM modules m
		LEFT JOIN users u ON u.user_id = m.user_id

		LEFT JOIN LATERAL (
			SELECT COUNT(*) as objects
			FROM module_cards mc 
			WHERE mc.module_id = m.module_id
		) mc ON TRUE

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
	WHERE
		m.module_id = $1
	`

	modules := []model.ModuleSummary{}

	for _, id := range ids {
		module := model.ModuleSummary{}

		if err = conn.QueryRow(ctx, queryModule, id).Scan(
			&module.Id,
			&module.Title,
			&module.Slug,
			&module.HasImages,
			&module.Author,
			&module.Keywords,
			&module.Objects,
		); err != nil {
			log.Printf("error query module: %v\n", err)
			return nil, err
		}

		modules = append(modules, module)
	}

	return &model.ModulesSummaryResponse{Modules: modules}, nil
}

func (m *moduleRepo) ListByUserID(ctx context.Context, username string, queryParams Query) (*model.UserModulesResponse, error) {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	args := []interface{}{username}
	placeholder := 2

	query := `SELECT
		m.module_id as id,
		m.title,
		m.slug,
		m.has_images,
		mc.objects
	FROM modules m
		JOIN users u ON u.user_id = m.user_id

		LEFT JOIN LATERAL (
			SELECT COUNT(*) as objects
			FROM module_cards mc 
			WHERE mc.module_id = m.module_id
		) mc ON TRUE
	WHERE
		u.username = $1
	`

	if len(queryParams.Name) > 0 {
		query += fmt.Sprintf(" AND m.title ILIKE '%%' || $%d || '%%'", placeholder)
		args = append(args, queryParams.Name)
		placeholder++
	}

	if queryParams.LastId > 0 {
		query += fmt.Sprintf(" AND m.module_id > $%d", placeholder)
		args = append(args, queryParams.LastId)
		placeholder++
	}

	query += ` ORDER BY m.module_id LIMIT 10`

	modules := []model.UserModule{}

	rows, err := conn.Query(ctx, query, args...)
	if err != nil {
		log.Printf("error query modules: %v\n", err)
		return nil, err
	}

	for rows.Next() {
		module := model.UserModule{}

		if err := rows.Scan(
			&module.Id,
			&module.Title,
			&module.Slug,
			&module.HasImages,
			&module.Objects,
		); err != nil {
			log.Printf("error scanning row: %v\n", err)
			return nil, err
		}

		modules = append(modules, module)
	}

	return &model.UserModulesResponse{Modules: modules}, nil
}

func (m *moduleRepo) CreateModule(ctx context.Context, userId int, module model.CreateModuleRequest) (*model.CreateModuleResponse, error) {
	if len(module.Cards) == 0 {
		return nil, fmt.Errorf("сards can not be empty")
	}

	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return nil, err
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Printf("unable to begin transaction: %v\n", err)
		return nil, err
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	queryCreateModule := `INSERT INTO modules 
		(user_id, title, slug, has_images) 
		VALUES ($1, $2, $3, $4) 
		RETURNING module_id
	`

	var moduleId int
	hasImages := utils.Contains(module.Cards, func(card model.CreateCard) bool {
		return card.Title.Media.Content != nil || card.Description.Media.Content != nil
	})

	err = tx.QueryRow(ctx, queryCreateModule, userId, module.Title, utils.Slug(module.Title), hasImages).Scan(&moduleId)
	if err != nil {
		return nil, err
	}

	for _, card := range module.Cards {
		if err = insertCard(tx, ctx, moduleId, card); err != nil {
			return nil, err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}
	return &model.CreateModuleResponse{Id: moduleId}, nil
}

func (m *moduleRepo) DeleteModule(ctx context.Context, userId int, moduleId int) error {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return err
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Printf("unable to begin transaction: %v\n", err)
		return err
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	query := `DELETE FROM modules WHERE module_id = $1 AND user_id = $2`

	commandTag, err := tx.Exec(ctx, query, moduleId, userId)
	if err != nil {
		return err
	}

	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("module not found")
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}

func (m *moduleRepo) UpdateModule(ctx context.Context, userId int, moduleId, module model.UpdateModuleRequest) error {
	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return err
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Printf("unable to begin transaction: %v\n", err)
		return err
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	var exists bool
	err = tx.QueryRow(ctx, "SELECT EXISTS(SELECT 1 FROM modules WHERE module_id=$1 AND user_id=$2)", moduleId, userId).Scan(&exists)
	if err != nil || !exists {
		return fmt.Errorf("module not found")
	}

	if module.Title != nil {
		cmdTag, err := tx.Exec(ctx, `UPDATE modules SET title=$1, slug=$2 WHERE module_id=$3 AND user_id=$4`,
			module.Title, utils.Slug(*module.Title), moduleId, userId)
		if err != nil {
			return err
		}

		if cmdTag.RowsAffected() == 0 {
			return fmt.Errorf("module not found")
		}
	}

	for _, card := range module.Cards {
		if card.Delete && card.Id != nil {
			if err = deleteCard(tx, ctx, module.Id, *card.Id); err != nil {
				return err
			}
		} else if card.Id == nil {
			if err = insertCard(tx, ctx, module.Id, model.CreateCard{
				Title:       card.Title,
				Description: card.Description,
			}); err != nil {
				return err
			}
		} else {
			if err = updateCard(tx, ctx, module.Id, card); err != nil {
				return err
			}
		}

		if err != nil {
			return err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return err
	}

	return nil
}

func (m *moduleRepo) InsertKeywords(ctx context.Context, keywords []string) error {
	if len(keywords) == 0 {
		// add err
		return nil
	}

	conn, err := m.psql.Acquire(ctx)
	if err != nil {
		log.Printf("unable to acquire connection: %v\n", err)
		return err
	}
	defer conn.Release()

	tx, err := conn.Begin(ctx)
	if err != nil {
		log.Printf("unable to begin transaction: %v\n", err)
		return err
	}

	defer func() {
		_ = tx.Rollback(ctx)
	}()

	queryInsertKw := `INSERT INTO keywords (kw_slug, is_translatable) VALUES ($1, $2) ON CONFLICT (kw_slug) DO NOTHING RETURNING kw_id`
	queryInsertKwTranslation := `INSERT INTO keyword_translations (kw_id, lang, name) VALUES ($1, 'ua', $2) ON CONFLICT (kw_id, lang) DO NOTHING`

	for _, keyword := range keywords {
		var kwId int

		err := tx.QueryRow(ctx, queryInsertKw, utils.Slug(keyword), true).Scan(&kwId)
		if err != nil {
			return err
		}

		_, err = tx.Exec(ctx, queryInsertKwTranslation, kwId, keyword)
		if err != nil {
			return err
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return err
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

func insertCard(tx pgx.Tx, ctx context.Context, moduleId int, card model.CreateCard) error {
	query := `INSERT INTO module_cards
		(module_id, title, description, title_media_type, title_media, 
		description_media_type, description_media)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`

	prepareMediaType(&card.Title.Media)
	prepareMediaType(&card.Description.Media)

	_, err := tx.Exec(ctx, query, moduleId,
		card.Title.Text, card.Description.Text, card.Title.Media.Type, card.Title.Media.Content,
		card.Description.Media.Type, card.Description.Media.Content,
	)

	return err
}

func updateCard(tx pgx.Tx, ctx context.Context, moduleId int, card model.CardUpdate) error {
	prepareMediaType(&card.Title.Media)
	prepareMediaType(&card.Description.Media)

	_, err := tx.Exec(ctx, `UPDATE module_cards SET
		title=$1, description=$2, title_media_type=$3, title_media=$4, 
		description_media_type=$5, description_media=$6
	WHERE card_id=$7 AND module_id=$8`,
		card.Title.Text, card.Description.Text, card.Title.Media.Type,
		card.Title.Media.Content, card.Description.Media.Type,
		card.Description.Media.Content, card.Id, moduleId)

	return err
}

func deleteCard(tx pgx.Tx, ctx context.Context, moduleId, cardId int) error {
	cmdTag, err := tx.Exec(ctx, `DELETE FROM module_cards WHERE card_id=$1 AND module_id=$2`,
		cardId, moduleId)

	if cmdTag.RowsAffected() == 0 {
		return fmt.Errorf("card not found")
	}

	return err
}
