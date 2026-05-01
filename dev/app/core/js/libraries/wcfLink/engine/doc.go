// Package engine exposes the reusable wcfLink service layer for Go applications.
//
// The current implementation is a thin public wrapper over the existing internal
// app/service runtime so GUI, HTTP, and future CLI integrations can depend on a
// stable package boundary before the deeper refactor is complete.
package engine
