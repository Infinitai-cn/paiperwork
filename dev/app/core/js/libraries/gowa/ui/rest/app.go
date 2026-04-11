package rest

import (
	"fmt"
	"time"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/config"
	domainApp "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/app"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/infrastructure/whatsapp"
	pkgError "github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/error"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

type App struct {
	Service domainApp.IAppUsecase
}

func InitRestApp(app fiber.Router, service domainApp.IAppUsecase) App {
	rest := App{Service: service}
	app.Get("/app/login", rest.Login)
	app.Get("/app/login-with-code", rest.LoginWithCode)
	app.Get("/app/logout", rest.Logout)
	app.Get("/app/reconnect", rest.Reconnect)
	app.Get("/app/session/export", rest.ExportSession)
	app.Post("/app/session/import", rest.ImportSession)
	app.Delete("/app/session", rest.ClearSession)
	app.Get("/app/devices", rest.Devices)
	app.Get("/app/status", rest.ConnectionStatus)

	return App{Service: service}
}

func appErrorResponse(c *fiber.Ctx, err error) error {
	if err == nil {
		return nil
	}

	if ge, ok := err.(pkgError.GenericError); ok {
		// Session-saved is expected while WhatsApp session is warming up.
		if ge.ErrCode() == "SESSION_SAVED_ERROR" {
			return c.Status(202).JSON(utils.ResponseData{
				Status:  202,
				Code:    ge.ErrCode(),
				Message: ge.Error(),
			})
		}

		if ge.ErrCode() == "ALREADY_LOGGED_IN" {
			return c.Status(200).JSON(utils.ResponseData{
				Status:  200,
				Code:    ge.ErrCode(),
				Message: ge.Error(),
			})
		}

		return c.Status(ge.StatusCode()).JSON(utils.ResponseData{
			Status:  ge.StatusCode(),
			Code:    ge.ErrCode(),
			Message: ge.Error(),
		})
	}

	return c.Status(500).JSON(utils.ResponseData{
		Status:  500,
		Code:    "INTERNAL_SERVER_ERROR",
		Message: err.Error(),
	})
}

func (handler *App) Login(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	response, err := handler.Service.Login(c.UserContext(), device.ID())
	if err != nil {
		return appErrorResponse(c, err)
	}

	results := map[string]any{
		"device_id":    device.ID(),
		"qr_duration":  int64(response.Duration / time.Second),
		"qr_timestamp": response.IssuedAt,
	}
	// Prefer inlined QR image data when provided (data URL base64 PNG)
	if response.ImageData != "" {
		results["qr_data"] = response.ImageData
	} else if response.ImagePath != "" {
		results["qr_link"] = fmt.Sprintf("%s://%s%s/%s", c.Protocol(), c.Hostname(), config.AppBasePath, response.ImagePath)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Login success",
		Results: results,
	})
}

func (handler *App) LoginWithCode(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	pairCode, err := handler.Service.LoginWithCode(c.UserContext(), device.ID(), c.Query("phone"))
	if err != nil {
		return appErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Login with code success",
		Results: map[string]any{
			"device_id": device.ID(),
			"pair_code": pairCode,
		},
	})
}

func (handler *App) Logout(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	err = handler.Service.Logout(c.UserContext(), device.ID())
	if err != nil {
		return appErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Success logout",
		Results: map[string]any{"device_id": device.ID()},
	})
}

func (handler *App) Reconnect(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	err = handler.Service.Reconnect(c.UserContext(), device.ID())
	if err != nil {
		return appErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Reconnect success",
		Results: map[string]any{"device_id": device.ID()},
	})
}

func (handler *App) Devices(c *fiber.Ctx) error {
	devices, err := handler.Service.FetchDevices(c.UserContext())
	utils.PanicIfNeeded(err)

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Fetch device success",
		Results: devices,
	})
}

func (handler *App) ConnectionStatus(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	isConnected, isLoggedIn, err := handler.Service.Status(c.UserContext(), device.ID())
	if err != nil {
		return appErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Connection status retrieved",
		Results: map[string]any{
			"is_connected": isConnected,
			"is_logged_in": isLoggedIn,
			"device_id":    device.ID(),
		},
	})
}

func getDeviceInstance(c *fiber.Ctx) (*whatsapp.DeviceInstance, error) {
	value := c.Locals("device")
	if value == nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "device context is missing")
	}
	device, ok := value.(*whatsapp.DeviceInstance)
	if !ok || device == nil {
		return nil, fiber.NewError(fiber.StatusBadRequest, "invalid device context")
	}
	return device, nil
}

type sessionImportRequest struct {
	Session domainApp.SessionSnapshot `json:"session"`
}

func (handler *App) ExportSession(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	snapshot, err := handler.Service.ExportSession(c.UserContext(), device.ID())
	if err != nil {
		return appErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Session exported",
		Results: map[string]any{
			"device_id": device.ID(),
			"session":   snapshot,
		},
	})
}

func (handler *App) ImportSession(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	request := sessionImportRequest{}
	if err = c.BodyParser(&request); err != nil {
		return appErrorResponse(c, fiber.NewError(fiber.StatusBadRequest, "invalid import payload"))
	}

	if err = handler.Service.ImportSession(c.UserContext(), device.ID(), request.Session); err != nil {
		return appErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Session imported",
		Results: map[string]any{"device_id": device.ID()},
	})
}

func (handler *App) ClearSession(c *fiber.Ctx) error {
	device, err := getDeviceInstance(c)
	if err != nil {
		return err
	}

	err = handler.Service.ClearSession(c.UserContext(), device.ID())
	if err != nil {
		return appErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Session cleared",
		Results: map[string]any{"device_id": device.ID()},
	})
}
