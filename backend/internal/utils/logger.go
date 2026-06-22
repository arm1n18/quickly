package utils

import "log"

func LogError(fn string, err error) {
	if err == nil {
		return
	}

	log.Printf("\033[31m-ERR %s = %s\033[0m\n", fn, err.Error())
}
