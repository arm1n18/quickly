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
	ID          int         `json:"id"` // <---- todo
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
	ID       int       `json:"id"`
	Title    string    `json:"title"`
	Slug     string    `json:"slug"`
	Author   Author    `json:"author"`
	Keywords []Keyword `json:"keywords"`
	Objects  int       `json:"objects"`
	Cards    []Card    `json:"cards"`
	IsOwner  bool      `json:"isOwner"`
	IsSaved  bool      `json:"isSaved"`
}

type ModuleSummary struct {
	ID        int       `json:"id"`
	Title     string    `json:"title"`
	Slug      string    `json:"slug"`
	Author    Author    `json:"author"`
	Keywords  []Keyword `json:"keywords"`
	Objects   int       `json:"objects"`
	HasImages bool      `json:"hasImages"`
	IsOwner   bool      `json:"isOwner"`
	IsSaved   bool      `json:"isSaved"`
}

type UserModule struct {
	ID        int    `json:"id"`
	Title     string `json:"title"`
	Slug      string `json:"slug"`
	Objects   int    `json:"objects"`
	HasImages bool   `json:"hasImages"`
	IsOwner   bool   `json:"isOwner"`
	IsSaved   bool   `json:"isSaved"`
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
	Title       string       `json:"title"`
	Description string       `json:"description"`
	Private     bool         `json:"private"`
	Cards       []CreateCard `json:"cards"`
}

type CreateModuleResponse struct {
	ID int `json:"id"`
}

type CardUpdate struct {
	ID          *int        `json:"id,omitempty"`
	Title       CardContent `json:"title"`
	Description CardContent `json:"description"`
	Delete      bool        `json:"delete,omitempty"`
}

type UpdateModuleRequest struct {
	ID          int          `json:"id,omitempty"`
	Title       *string      `json:"title,omitempty"`
	Description *string      `json:"description,omitempty"`
	Cards       []CardUpdate `json:"cards,omitempty"`
}

type UpdateModuleCard struct {
	ID          int    `json:"id,omitempty"`
	CardID      int    `json:"cardId"`
	Title       string `json:"title"`
	Description string `json:"description"`
}
