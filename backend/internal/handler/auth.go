package handlers

import (
	"web-quiz/internal/mail"
	"web-quiz/internal/middleware"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/repository/auth"
	"web-quiz/internal/repository/session"
	"web-quiz/internal/repository/user"
	"web-quiz/internal/repository/verification"
	"web-quiz/internal/service"
	"web-quiz/internal/utils"

	"github.com/gofiber/fiber/v2"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func RegisterAuthRoutes(router fiber.Router, psql *pgxpool.Pool, redis *redis.Client, ekey, jwtkey string, mail *mail.SMTPClient) {
	/* REPOS */
	authRepo := auth.NewAuthRepository(psql, redis)
	userRepo := user.NewUserRepository(psql, redis)
	verifRepo := verification.NewVerificationRepository(redis)
	sessionRepo := session.NewSessionRepository(psql, redis)

	/* SERVICES */
	jwtSvc := service.NewJWTService(ekey, jwtkey)
	authSvc := service.NewAuthService(authRepo, userRepo, verifRepo, sessionRepo, *jwtSvc, mail)

	/* MIDDLEWARES */
	middleware := middleware.NewAuthMiddleware(jwtSvc)

	/* ROUTERS */
	router.Post("/register", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		err := authSvc.Register(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/login", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		err := authSvc.Login(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/verify", func(c *fiber.Ctx) error {
		req := model.VerifyCodeRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		headers := model.UaHeaders{
			UserAgent: c.Get("User-Agent", "unknown"),
			OS:        c.Get("app-os", "unknown"),
			Device:    c.Get("app-device", "unknown"),
			Browser:   c.Get("app-browser", "unknown"),
		}

		success, err := authSvc.Verify(c.Context(), req, headers)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		utils.SetCookie(c, success.Refresh)
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"accessToken": success.Access,
		})
	})

	router.Post("/send-code", func(c *fiber.Ctx) error {
		req := model.AuthRequest{}

		if err := c.BodyParser(&req); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		err := authSvc.SendCode(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/reset", func(c *fiber.Ctx) error {

		var body struct {
			Email string `json:"email"`
		}
		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		err := authSvc.Reset(c.Context(), body.Email)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/reset/:token", func(c *fiber.Ctx) error {

		var body struct {
			Password string `json:"password"`
		}

		if err := c.BodyParser(&body); err != nil {
			return protocol.ReturnErrorJSON(c, protocol.ErrInvalidRequestBody)
		}

		err := authSvc.ConfirmReset(c.Context(), c.Params("token"), body.Password)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Get("/reset/:token", func(c *fiber.Ctx) error {
		err := authSvc.ValidReset(c.Context(), c.Params("token"))
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.SendStatus(fiber.StatusOK)
	})

	router.Post("/refresh", middleware.JWTMiddleware(true), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.AccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		success, err := authSvc.Refresh(
			c.Context(),
			model.Tokens{
				Access:  user.Token,
				Refresh: c.Cookies("token"),
			},
		)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"accessToken": success.AccessToken,
		})
	})

	router.Post("/logout", middleware.JWTMiddleware(true), func(c *fiber.Ctx) error {
		user, ok := utils.GetLocals[*model.AccessToken](c, "user")
		if !ok {
			return c.SendStatus(fiber.StatusUnauthorized)
		}

		req := model.Tokens{
			Access:  user.Token,
			Refresh: c.Cookies("token"),
		}

		err := authSvc.Logout(c.Context(), req)
		if err != nil {
			return protocol.ReturnErrorJSON(c, err)
		}

		utils.RemoveCookie(c, "token")

		return c.SendStatus(fiber.StatusOK)
	})
}
