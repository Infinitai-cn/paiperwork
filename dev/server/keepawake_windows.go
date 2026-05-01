//go:build windows

package main

import (
	"log"
	"syscall"
)

const (
	esContinuous       = 0x80000000
	esSystemRequired   = 0x00000001
	esDisplayRequired  = 0x00000002
)

var (
	kernel32                    = syscall.NewLazyDLL("kernel32.dll")
	procSetThreadExecutionState = kernel32.NewProc("SetThreadExecutionState")
)

func startKeepAwake() {
	ret, _, err := procSetThreadExecutionState.Call(uintptr(esContinuous | esSystemRequired | esDisplayRequired))
	if ret == 0 {
		log.Printf("keepAwake: SetThreadExecutionState failed: %v", err)
		return
	}
	log.Printf("keepAwake: Windows keep-awake enabled")
}

func stopKeepAwake() {
	ret, _, err := procSetThreadExecutionState.Call(uintptr(esContinuous))
	if ret == 0 {
		log.Printf("keepAwake: SetThreadExecutionState reset failed: %v", err)
		return
	}
	log.Printf("keepAwake: Windows keep-awake disabled")
}
