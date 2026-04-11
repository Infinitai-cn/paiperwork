package logmask

import (
	"regexp"
	"strings"
)

var phoneLikeTokenPattern = regexp.MustCompile(`\+?\d{5,}(?::[^@\s]+)?(?:@[A-Za-z0-9._-]+)?`)

func MaskPhoneNumber(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return ""
	}

	original := trimmed
	prefix := ""
	if strings.HasPrefix(trimmed, "+") {
		prefix = "+"
		trimmed = strings.TrimPrefix(trimmed, "+")
	}

	suffix := ""
	if at := strings.Index(trimmed, "@"); at >= 0 {
		suffix = trimmed[at:]
		trimmed = trimmed[:at]
	}
	if colon := strings.Index(trimmed, ":"); colon >= 0 {
		suffix = trimmed[colon:] + suffix
		trimmed = trimmed[:colon]
	}

	if !isDigitsOnly(trimmed) {
		return original
	}
	if len(trimmed) <= 4 {
		return prefix + trimmed + suffix
	}

	return prefix + strings.Repeat("*", len(trimmed)-4) + trimmed[len(trimmed)-4:] + suffix
}

func MaskTextPhones(raw string) string {
	if strings.TrimSpace(raw) == "" {
		return raw
	}
	return phoneLikeTokenPattern.ReplaceAllStringFunc(raw, MaskPhoneNumber)
}

func isDigitsOnly(raw string) bool {
	if raw == "" {
		return false
	}
	for _, ch := range raw {
		if ch < '0' || ch > '9' {
			return false
		}
	}
	return true
}
