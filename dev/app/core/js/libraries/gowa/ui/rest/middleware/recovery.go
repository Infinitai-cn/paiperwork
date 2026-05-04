package middleware

import (
	"context"
	"fmt"
	"strings"

	pkgError "github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/error"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/utils"
	"github.com/gofiber/fiber/v2"
	"github.com/sirupsen/logrus"
)

func isRecoverableTransportDisconnect(err any) bool {
	message := strings.ToLower(strings.TrimSpace(fmt.Sprintf("%v", err)))
	if message == "" {
		return false
	}

	return strings.Contains(message, "websocket disconnected") || strings.Contains(message, "failed to send usync query") || strings.Contains(message, "connection closed") || strings.Contains(message, "broken pipe")
}

func isRecoverableLoginWarmupError(err any) bool {
	message := strings.ToLower(strings.TrimSpace(fmt.Sprintf("%v", err)))
	if message == "" {
		return false
	}

	return strings.Contains(message, "you are not logged in")
}

func Recovery() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		defer func() {
			err := recover()
			if err == nil {
				return
			}

			var res utils.ResponseData
			res.Status = 500
			res.Code = "INTERNAL_SERVER_ERROR"
			res.Message = fmt.Sprintf("%v", err)

			if isRecoverableTransportDisconnect(err) {
				logrus.Warnf("Recovered transport error raw value: %#v", err)
				logrus.Warnf("Transport error recovered in middleware: %v", err)
				res.Status = fiber.StatusServiceUnavailable
				res.Code = "WHATSAPP_TRANSPORT_UNAVAILABLE"
				res.Message = "WhatsApp connection dropped while processing the request"
				_ = ctx.Status(res.Status).JSON(res)
				return
			}

			if isRecoverableLoginWarmupError(err) {
				logrus.Warnf("Recovered login warmup error raw value: %#v", err)
				logrus.Warnf("Login warmup error recovered in middleware: %v", err)
				res.Status = fiber.StatusUnauthorized
				res.Code = "WHATSAPP_NOT_LOGGED_IN"
				res.Message = "WhatsApp device is not logged in yet"
				_ = ctx.Status(res.Status).JSON(res)
				return
			}

			// very explicit: log the exact panic value for debugging as requested
			logrus.Errorf("Recovered panic raw value: %#v", err)

			if ge, isGeneric := err.(pkgError.GenericError); isGeneric {
				res.Status = ge.StatusCode()
				res.Code = ge.ErrCode()
				res.Message = ge.Error()

				if ge.ErrCode() == "SESSION_SAVED_ERROR" {
					logrus.Debugf("Session warmup state (recover path): %v", ge.Error())
				} else {
					logrus.Warnf("Recovered generic error in middleware: %v", ge.Error())
				}

				_ = ctx.Status(res.Status).JSON(res)
				return
			}

			panicMsg := fmt.Sprintf("%v", err)
			if strings.Contains(panicMsg, "your session have been saved") {
				logrus.Infof("Recovered panic in middleware (session warmup): %v", err)
			} else {
				logrus.Errorf("Panic recovered in middleware: %v", err)
			}

			if ctxErr, ok := err.(error); ok && ctxErr == context.DeadlineExceeded {
				res.Status = 504
				res.Code = "GATEWAY_TIMEOUT"
				res.Message = "Request timed out waiting for WhatsApp server response"
			}

			_ = ctx.Status(res.Status).JSON(res)
		}()

		return ctx.Next()
	}
}
