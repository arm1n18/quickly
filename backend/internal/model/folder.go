package model

type Folder struct {
	Title   string       `json:"title"`
	Slug    string       `json:"slug"`
	Author  Author       `json:"author"`
	Objects int          `json:"objects"`
	Modules []UserModule `json:"modules"`
}

type FolderSummary struct {
	Title   string `json:"title"`
	Slug    string `json:"slug"`
	Objects int    `json:"objects"`
}

type FoldersSummary struct {
	Folders []FolderSummary `json:"folders"`
}
