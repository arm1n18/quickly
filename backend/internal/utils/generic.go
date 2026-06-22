package utils

func Contains[T any](array []T, f func(T) bool) bool {
	for _, v := range array {
		if f(v) {
			return true
		}
	}

	return false
}

func InRange(s string, start, end int) bool {
	return len(s) >= start && len(s) <= end
}
