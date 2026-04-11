package whatsapp

import (
	"os"
	"strings"
)

const freshPairStartupEnv = "PAIPERWORK_WHATSAPP_FRESH_PAIR_STARTUP"

func IsFreshPairStartupRequested() bool {
	return strings.EqualFold(strings.TrimSpace(os.Getenv(freshPairStartupEnv)), "true")
}