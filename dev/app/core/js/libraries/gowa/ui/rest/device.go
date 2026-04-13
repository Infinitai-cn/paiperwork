package rest

import (
	"strings"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/domains/device"
	pkgError "github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/error"
	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/utils"
	"github.com/gofiber/fiber/v2"
)

type Device struct {
	Service device.IDeviceUsecase
}

func InitRestDevice(app fiber.Router, service device.IDeviceUsecase) Device {
	rest := Device{Service: service}

	app.Get("/devices", rest.ListDevices)
	app.Post("/devices", rest.AddDevice)

	app.Get("/devices/:device_id", rest.GetDevice)
	app.Delete("/devices/:device_id", rest.RemoveDevice)

	app.Get("/devices/:device_id/login", rest.LoginDevice)
	app.Post("/devices/:device_id/login/code", rest.LoginDeviceWithCode)
	app.Post("/devices/:device_id/logout", rest.LogoutDevice)
	app.Post("/devices/:device_id/reconnect", rest.ReconnectDevice)
	app.Get("/devices/:device_id/status", rest.Status)

	return rest
}

func deviceErrorResponse(c *fiber.Ctx, err error) error {
	if err == nil {
		return nil
	}

	if ge, ok := err.(pkgError.GenericError); ok {
		return c.Status(ge.StatusCode()).JSON(utils.ResponseData{
			Status:  ge.StatusCode(),
			Code:    ge.ErrCode(),
			Message: ge.Error(),
		})
	}

	message := strings.TrimSpace(err.Error())
	if strings.Contains(strings.ToLower(message), "not found") {
		return c.Status(fiber.StatusNotFound).JSON(utils.ResponseData{
			Status:  fiber.StatusNotFound,
			Code:    "DEVICE_NOT_FOUND",
			Message: message,
		})
	}

	return c.Status(fiber.StatusInternalServerError).JSON(utils.ResponseData{
		Status:  fiber.StatusInternalServerError,
		Code:    "INTERNAL_SERVER_ERROR",
		Message: message,
	})
}

func (handler *Device) ListDevices(c *fiber.Ctx) error {
	devices, err := handler.Service.ListDevices(c.UserContext())
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "List devices",
		Results: devices,
	})
}

func (handler *Device) GetDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	device, err := handler.Service.GetDevice(c.UserContext(), deviceID)
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Device info",
		Results: device,
	})
}

func (handler *Device) AddDevice(c *fiber.Ctx) error {
	var req struct {
		DeviceID string `json:"device_id"`
	}

	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(utils.ResponseData{
			Status:  400,
			Code:    "BAD_REQUEST",
			Message: "Invalid request body",
			Results: nil,
		})
	}

	device, err := handler.Service.AddDevice(c.UserContext(), req.DeviceID)
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	result := map[string]any{
		"id":           device.ID,
		"display_name": device.DisplayName,
		"jid":          device.JID,
		"state":        device.State,
		"created_at":   device.CreatedAt,
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Device added",
		Results: result,
	})
}

func (handler *Device) RemoveDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	err := handler.Service.RemoveDevice(c.UserContext(), deviceID)
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Device removed",
		Results: nil,
	})
}

func (handler *Device) LoginDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	err := handler.Service.LoginDevice(c.UserContext(), deviceID)
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Login started",
		Results: map[string]any{"device_id": deviceID},
	})
}

func (handler *Device) LoginDeviceWithCode(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	code, err := handler.Service.LoginDeviceWithCode(c.UserContext(), deviceID, c.Query("phone"))
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Login with code started",
		Results: map[string]any{
			"device_id": deviceID,
			"pair_code": code,
		},
	})
}

func (handler *Device) LogoutDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	err := handler.Service.LogoutDevice(c.UserContext(), deviceID)
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Logout requested",
		Results: nil,
	})
}

func (handler *Device) ReconnectDevice(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	err := handler.Service.ReconnectDevice(c.UserContext(), deviceID)
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Reconnect requested",
		Results: nil,
	})
}

func (handler *Device) Status(c *fiber.Ctx) error {
	deviceID := c.Params("device_id")
	isConnected, isLoggedIn, err := handler.Service.GetStatus(c.UserContext(), deviceID)
	if err != nil {
		return deviceErrorResponse(c, err)
	}

	return c.JSON(utils.ResponseData{
		Status:  200,
		Code:    "SUCCESS",
		Message: "Device status",
		Results: map[string]any{
			"device_id":    deviceID,
			"is_connected": isConnected,
			"is_logged_in": isLoggedIn,
		},
	})
}
