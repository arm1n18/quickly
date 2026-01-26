package module

type QueryKey string

const (
	CreateModule QueryKey = "user.byId"
	UserInsert   QueryKey = "user.insert"
)

var QUERIES = map[QueryKey]string{}
