package model

import "time"

// Auth

type UaHeaders struct {
	UserAgent string `json:"userAgent"`
	OS        string `json:"os"`
	Browser   string `json:"browser"`
	Device    string `json:"device"`
}

type AuthRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Purpose  string `json:"purpose,omitempty"`
}

type UserInfo struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email,omitempty"`
	Avatar   string `json:"avatar,omitempty"`
}

// Tokens

type Tokens struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
}

type UpdateToken struct {
	AccessToken string `json:"accessToken"`
}

type GenerateJWTData struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Email    string `json:"email"`
	Avatar   string `json:"avatar,omitempty"`
	JTI      string `json:"jti"`
}

type UserAccessToken struct {
	SUB     int       `json:"sub"`
	Name    string    `json:"name"`
	Avatar  string    `json:"avatar,omitempty"`
	Email   string    `json:"email"`
	JTI     string    `json:"jti"`
	Token   string    `json:"token"`
	Exp     time.Time `json:"exp"`
	Iat     time.Time `json:"iat"`
	Expired bool      `json:"expired"`
}

type UserRefreshToken struct {
	SUB     int       `json:"sub"`
	JTI     string    `json:"jti"`
	Token   string    `json:"token"`
	Exp     time.Time `json:"exp"`
	Iat     time.Time `json:"iat"`
	Expired bool      `json:"expired"`
}

// Code

type VerificationCode struct {
	ID       int       `json:"id"`
	Code     int       `json:"code"`
	Requests int       `json:"requests"`
	Attempts int       `json:"attempts"`
	Purpose  string    `json:"purpose"`
	Exp      time.Time `json:"exp"`
	Iat      time.Time `json:"iat"`
	BanUntil time.Time `json:"banUntil"`
}

type VerifyCodeRequest struct {
	Email   string `json:"email"`
	Purpose string `json:"purpose"`
	Code    int    `json:"code"`
}

// Session

type UserSessionDB struct {
	UaHeaders
	ID    int       `json:"id"`
	Token string    `json:"token"`
	JTI   string    `json:"jti"`
	Exp   time.Time `json:"exp"`
}

type RefreshTokenDB struct {
	Id    int
	Token string
	Exp   time.Time
}
