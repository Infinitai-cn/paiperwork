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

func Recovery() fiber.Handler {
	return func(ctx *fiber.Ctx) error {
		defer func() {
			err := recover()
			if err == nil {
				return
			}

			// very explicit: log the exact panic value for debugging as requested
			logrus.Errorf("Recovered panic raw value: %#v", err)

			var res utils.ResponseData
			res.Status = 500
			res.Code = "INTERNAL_SERVER_ERROR"
			res.Message = fmt.Sprintf("%v", err)

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
