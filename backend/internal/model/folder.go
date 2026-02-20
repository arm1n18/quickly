package model

type Folder struct {
	ID      int             `json:"id"`
	Title   string          `json:"title"`
	Slug    string          `json:"slug"`
	Author  Author          `json:"author"`
	Objects int             `json:"objects"`
	IsOwner bool            `json:"isOwner"`
	Modules []ModuleSummary `json:"modules"`
}

type FolderSummary struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Slug    string `json:"slug"`
	Objects int    `json:"objects"`
	IsOwner bool   `json:"isOwner"`
}

type FoldersSummary struct {
	Folders []FolderSummary `json:"folders"`
}
