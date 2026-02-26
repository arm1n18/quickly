package utils

import "log"

func LogError(fn string, err error) {
	log.Printf("-ERR %s: %s\n", fn, err.Error())
}
