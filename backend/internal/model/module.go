package model

type MediaBlock struct {
	Type    *string `json:"type"`
	Content *string `json:"content"`
}

type CardContent struct {
	Text  string     `json:"text"`
	Media MediaBlock `json:"media"`
}

type Card struct {
	Id          int         `json:"id"`
	Title       CardContent `json:"title"`
	Description CardContent `json:"description"`
}

type Author struct {
	Name   string  `json:"name"`
	Avatar *string `json:"avatar"`
}

type Keyword struct {
	Name string `json:"name"`
	Slug string `json:"slug"`
}

type Module struct {
	Id       int       `json:"id"`
	Title    string    `json:"title"`
	Slug     string    `json:"slug"`
	Author   Author    `json:"author"`
	Keywords []Keyword `json:"keywords"`
	Cards    []Card    `json:"cards"`
	Objects  int       `json:"objects"`
}

type ModuleSummary struct {
	Id        int       `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	Author    Author    `json:"author"`
	Keywords  []Keyword `json:"keywords"`
	Objects   int       `json:"objects"`
	HasImages bool      `json:"hasImages"`
}

type ModulesSummary struct {
	Modules []ModuleSummary `json:"modules"`
}

type UserModule struct {
	Id        int    `json:"id"`
	Title     string `json:"title"`
	Slug      string `json:"slug"`
	Objects   int    `json:"objects"`
	HasImages bool   `json:"hasImages"`
}

type UserModules struct {
	Modules []UserModule `json:"modules"`
}
