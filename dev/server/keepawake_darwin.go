//go:build darwin

package main

import (
	"log"
	"os/exec"
	"sync"
)

var caffeinateCmdMu sync.Mutex
var caffeinateCmd *exec.Cmd

func startKeepAwake() {
	caffeinateCmdMu.Lock()
	defer caffeinateCmdMu.Unlock()

	if caffeinateCmd != nil {
		return
	}

	cmd := exec.Command("caffeinate", "-dims")
	if err := cmd.Start(); err != nil {
		log.Printf("keepAwake: failed to start caffeinate: %v", err)
		return
	}

	caffeinateCmd = cmd
	log.Printf("keepAwake: started caffeinate pid=%d", cmd.Process.Pid)
}

func stopKeepAwake() {
	caffeinateCmdMu.Lock()
	cmd := caffeinateCmd
	caffeinateCmd = nil
	caffeinateCmdMu.Unlock()

	if cmd == nil || cmd.Process == nil {
		return
	}

	if err := cmd.Process.Kill(); err != nil {
		log.Printf("keepAwake: failed to stop caffeinate pid=%d: %v", cmd.Process.Pid, err)
		return
	}

	if _, err := cmd.Process.Wait(); err != nil {
		log.Printf("keepAwake: error waiting for caffeinate exit: %v", err)
	} else {
		log.Printf("keepAwake: caffeinate stopped")
	}
}
