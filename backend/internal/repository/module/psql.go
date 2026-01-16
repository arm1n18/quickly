package module

import (
	"context"
	"fmt"
	"log"
	"web-quiz/internal/model"
	"web-quiz/internal/utils"

	"github.com/jackc/pgx/v5/pgxpool"
)

type Query struct {
	Name   string
	LastId int
}

type ModuleRepository interface {
	FetchModule(ctx context.Context, id int) (*model.Module, error)
	FetchModulesByName(ctx context.Context, name string, lastId int) (*model.ModulesSummary, error)
	FetchModulesByKeywords(ctx context.Context, keywords []string) (*model.ModulesSummary, error)
	FetchUserModules(ctx context.Context, username string, queryParams Query) (*model.UserModules, error)

	InsertKeywords(ctx context.Context, keywords []string) error
}

type moduleRepo struct {
	psql *pgxpool.Pool
}

func NewModuleRepository(psql *pgxpool.Pool) ModuleRepository {
	return &moduleRepo{psql: psql}
}

func (m *moduleRepo) FetchModule(ctx context.Context, id int) (*model.Module, error) {
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

func (m *moduleRepo) FetchModulesByName(ctx context.Context, name string, lastId int) (*model.ModulesSummary, error) {
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

	return &model.ModulesSummary{Modules: modules}, nil
}

func (m *moduleRepo) FetchModulesByKeywords(ctx context.Context, keywords []string) (*model.ModulesSummary, error) {
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

	return &model.ModulesSummary{Modules: modules}, nil
}

func (m *moduleRepo) FetchUserModules(ctx context.Context, username string, queryParams Query) (*model.UserModules, error) {
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

	return &model.UserModules{Modules: modules}, nil
}

func (m *moduleRepo) InsertKeywords(ctx context.Context, keywords []string) error {
	if len(keywords) == 0 {
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

	queryInsertKw := `INSERT INTO keywords (kw_slug, is_translatable) VALUES ($1, $2) ON CONFLICT (kw_slug) DO NOTHING RETURNING kw_id`
	queryInsertKwTranslation := `INSERT INTO keyword_translations (kw_id, lang, name) VALUES ($1, 'ua', $2) ON CONFLICT (kw_id, lang) DO NOTHING`

	for _, keyword := range keywords {
		var kwId int

		err := tx.QueryRow(ctx, queryInsertKw, utils.Slug(keyword), true).Scan(&kwId)
		if err != nil {
			tx.Rollback(ctx)
			return err
		}

		_, err = tx.Exec(ctx, queryInsertKwTranslation, kwId, keyword)
		if err != nil {
			tx.Rollback(ctx)
			return err
		}
	}

	tx.Commit(ctx)
	return nil
}
