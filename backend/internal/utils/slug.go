package utils

import (
	"strings"
)

func Slug(str string) string {
	lettersMap := map[rune]string{
		'а': "a", 'б': "b", 'в': "v", 'г': "g",
		'ґ': "g", 'д': "d", 'е': "e", 'є': "ye", 'ё': "jo",
		'ж': "zh", 'з': "z", 'и': "i", 'і': "i", 'ї': "yi", 'й': "y",
		'к': "k", 'л': "l", 'м': "m", 'н': "n", 'о': "o", 'п': "p",
		'р': "r", 'с': "s", 'т': "t", 'у': "u", 'ф': "f", 'х': "h",
		'ц': "c", 'ч': "ch", 'ш': "sh", 'щ': "shch", 'ъ': "",
		'ы': "y", 'ь': "", 'э': "eh", 'ю': "ju", 'я': "ya", ' ': "-",
		'.': "_", ',': "", '\'': "",
	}
	var output strings.Builder
	str = strings.ToLower(str)

	for _, letter := range str {
		if replacement, ok := lettersMap[letter]; ok {
			output.WriteString(replacement)
		} else {
			output.WriteString(string(letter))
		}
	}

	return output.String()
}

func Contains[T any](array []T, f func(T) bool) bool {
	for _, v := range array {
		if f(v) {
			return true
		}
	}

	return false
}

func InRange(s string, start, end int) bool {
	return len(s) >= start || len(s) <= end
}
