package embeddedsafe

import (
	"fmt"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
)

const embeddedEnv = "PAIPERWORK_EMBEDDED_GOWA"

func IsEnabled() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv(embeddedEnv)), "true")
}

func Fatal(args ...any) {
	if IsEnabled() {
		panic(strings.TrimSpace(fmt.Sprintln(args...)))
	}
	logrus.Fatal(args...)
}

func Fatalf(format string, args ...any) {
	if IsEnabled() {
		panic(fmt.Sprintf(format, args...))
	}
	logrus.Fatalf(format, args...)
}

func Fatalln(args ...any) {
	if IsEnabled() {
		panic(strings.TrimSpace(fmt.Sprintln(args...)))
	}
	logrus.Fatalln(args...)
}
