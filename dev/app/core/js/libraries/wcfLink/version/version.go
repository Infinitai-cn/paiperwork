package version

import (
	"fmt"
	"runtime/debug"
	"strings"
)

type Info struct {
	Version   string `json:"version"`
	Commit    string `json:"commit,omitempty"`
	BuildTime string `json:"build_time,omitempty"`
	Modified  bool   `json:"modified,omitempty"`
}

func Current() Info {
	info := Info{
		Version: "devel",
	}

	buildInfo, ok := debug.ReadBuildInfo()
	if !ok {
		return info
	}

	if v := normalizeVersion(buildInfo.Main.Version); v != "" {
		info.Version = v
	}

	for _, setting := range buildInfo.Settings {
		switch setting.Key {
		case "vcs.revision":
			info.Commit = shortCommit(setting.Value)
		case "vcs.time":
			info.BuildTime = setting.Value
		case "vcs.modified":
			info.Modified = setting.Value == "true"
		}
	}

	return info
}

func String() string {
	info := Current()
	parts := []string{info.Version}

	meta := make([]string, 0, 3)
	if info.Commit != "" {
		meta = append(meta, info.Commit)
	}
	if info.BuildTime != "" {
		meta = append(meta, "built "+info.BuildTime)
	}
	if info.Modified {
		meta = append(meta, "dirty")
	}
	if len(meta) == 0 {
		return parts[0]
	}
	return fmt.Sprintf("%s (%s)", parts[0], strings.Join(meta, ", "))
}

func normalizeVersion(value string) string {
	value = strings.TrimSpace(value)
	if value == "" || value == "(devel)" {
		return "devel"
	}
	return value
}

func shortCommit(value string) string {
	value = strings.TrimSpace(value)
	if len(value) > 12 {
		return value[:12]
	}
	return value
}
