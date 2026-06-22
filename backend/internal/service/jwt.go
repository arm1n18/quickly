package service

import (
	"math"
	"strconv"
	"time"
	"web-quiz/internal/model"
	"web-quiz/internal/protocol"
	"web-quiz/internal/utils"

	"github.com/golang-jwt/jwt/v5"
)

type JWTService struct {
	jwtkey string
	ekey   string
}

func NewJWTService(ekey, jwtkey string) *JWTService {
	return &JWTService{
		jwtkey: jwtkey,
		ekey:   ekey,
	}
}

func (s *JWTService) GenerateJWT(data model.GenerateJWTData, refesh bool) (*model.Tokens, *protocol.AppError) {
	var tokens model.Tokens

	sub, err := utils.EncryptDate(s.ekey, []byte(strconv.Itoa(data.ID)))
	if err != nil {
		return nil, protocol.ErrInternal.Wrap(err)
	}

	accessToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"sub":      sub,
		"email":    data.Email,
		"username": data.Username,
		"avatar":   data.Avatar,
		"jti":      data.JTI,
		"exp":      time.Now().Add(time.Second * 10).Unix(),
		"iat":      time.Now().Unix(),
	})

	tokens.Access, err = accessToken.SignedString([]byte(s.jwtkey))
	if err != nil {
		return nil, protocol.ErrInternal.Wrap(err)
	}

	if refesh {
		refreshToken := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"sub": sub,
			"jti": data.JTI,
			"exp": time.Now().Add(time.Hour * 24 * 30).Unix(),
			"iat": time.Now().Unix(),
		})

		tokens.Refresh, err = refreshToken.SignedString([]byte(s.jwtkey))
		if err != nil {
			return nil, protocol.ErrInternal.Wrap(err)
		}
	}

	return &tokens, nil
}

func (s *JWTService) ParseAccessToken(access string) (*model.AccessToken, *protocol.AppError) {
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())

	claims := &jwt.MapClaims{}
	token, err := parser.ParseWithClaims(access, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtkey), nil
	})

	if err != nil || !token.Valid {
		return nil, protocol.ErrInvalidToken
	}

	subString, ok := (*claims)["sub"].(string)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	sub, err := utils.DecryptData(s.ekey, subString).Int()
	if err != nil {
		return nil, protocol.ErrInternal.Wrap(err)
	}

	iatRaw, ok := (*claims)["iat"].(float64)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	expRaw, ok := (*claims)["exp"].(float64)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	iatTime := time.Unix(int64(math.Round(iatRaw)), 0)
	expTime := time.Unix(int64(math.Round(expRaw)), 0)

	expired := time.Now().After(expTime)

	jti, ok := (*claims)["jti"].(string)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	// terminated, err := s.repo.IsSessionTerminated(jti)
	// if err != nil {
	// 	log.Println(ErrSessionTerminated)
	// 	return nil, ErrSessionTerminated
	// }

	// if terminated {
	// 	log.Println(ErrInvalidSession)
	// 	return nil, ErrInvalidSession
	// }

	name, ok := (*claims)["username"].(string)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	email, ok := (*claims)["email"].(string)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	avatar, ok := (*claims)["avatar"].(string)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	return &model.AccessToken{
		SUB:     sub,
		Name:    name,
		Email:   email,
		Avatar:  avatar,
		JTI:     jti,
		Token:   access,
		Exp:     expTime,
		Iat:     iatTime,
		Expired: expired,
	}, nil
}

func (s *JWTService) ParseRefreshToken(refresh string) (*model.RefreshToken, *protocol.AppError) {
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())

	claims := &jwt.MapClaims{}
	token, err := parser.ParseWithClaims(refresh, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(s.jwtkey), nil
	})

	if err != nil || !token.Valid {
		return nil, protocol.ErrInvalidToken

	}

	subString, ok := (*claims)["sub"].(string)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	sub, err := utils.DecryptData(s.ekey, subString).Int()
	if err != nil {
		return nil, protocol.ErrInvalidTokenClaims
	}

	iatRaw, ok := (*claims)["iat"].(float64)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	expRaw, ok := (*claims)["exp"].(float64)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	iatTime := time.Unix(int64(math.Round(iatRaw)), 0)
	expTime := time.Unix(int64(math.Round(expRaw)), 0)

	expired := time.Now().After(expTime)

	userJTI, ok := (*claims)["jti"].(string)
	if !ok {
		return nil, protocol.ErrInvalidTokenClaims
	}

	// terminated, err := s.sessionRepo.IsSessionTerminated(userJTI)
	// if err != nil {
	// 	log.Println(ErrSessionTerminated)
	// 	return nil, ErrSessionTerminated
	// }

	// if terminated {
	// 	log.Println(ErrInvalidSession)
	// 	return nil, ErrInvalidSession
	// }

	return &model.RefreshToken{
		SUB:     sub,
		JTI:     userJTI,
		Token:   refresh,
		Exp:     expTime,
		Iat:     iatTime,
		Expired: expired,
	}, nil
}
