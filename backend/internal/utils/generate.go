package utils

import (
	"encoding/base64"
	"math"
	"math/rand"
	"strings"
	"time"
)

func GenerateSlug(str string) string {
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

func GenerateOTP(length int) int {
	if length <= 0 {
		return 0
	}

	min := int(math.Pow10(length - 1))
	max := int(math.Pow10(length)) - 1

	source := rand.NewSource(time.Now().UnixNano())
	r := rand.New(source)

	return r.Intn(max-min+1) + min
}

func GenerateResetToken() string {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return ""
	}

	token := base64.URLEncoding.EncodeToString(b)

	return token
}

func UsernameFromEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 0 {
		return ""
	}

	return strings.ToLower(parts[0])
}
