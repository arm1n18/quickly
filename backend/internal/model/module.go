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
	Id          int         `json:"id"` // <--- todo
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
	Objects  int       `json:"objects"`
	Cards    []Card    `json:"cards"`
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

type UserModule struct {
	Id        int    `json:"id"`
	Title     string `json:"title"`
	Slug      string `json:"slug"`
	Objects   int    `json:"objects"`
	HasImages bool   `json:"hasImages"`
}

type CreateCard struct {
	Title       CardContent `json:"title"`
	Description CardContent `json:"description"`
}

type ModulesSummaryResponse struct {
	Modules []ModuleSummary `json:"modules"`
}

type UserModulesResponse struct {
	Modules []UserModule `json:"modules"`
}

type CreateModuleRequest struct {
	Title   string       `json:"title"`
	Private bool         `json:"private"`
	Cards   []CreateCard `json:"cards"`
}

type CreateModuleResponse struct {
	Id int `json:"id"`
}

type CardUpdate struct {
	Id          *int        `json:"id,omitempty"`
	Title       CardContent `json:"title"`
	Description CardContent `json:"description"`
	Delete      bool        `json:"delete,omitempty"`
}

type UpdateModuleRequest struct {
	Id    int          `json:"id,omitempty"`
	Title *string      `json:"title,omitempty"`
	Cards []CardUpdate `json:"cards,omitempty"`
}
