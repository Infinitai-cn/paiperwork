package websocket

import (
	"context"
	"encoding/json"
	"strings"

	"github.com/aldinokemal/go-whatsapp-web-multidevice/pkg/logmask"
	"github.com/sirupsen/logrus"

	domainApp "github.com/aldinokemal/go-whatsapp-web-multidevice/domains/app"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/websocket/v2"
)

type client struct{}

type BroadcastMessage struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Result  any    `json:"result"`
}

var (
	Clients    = make(map[*websocket.Conn]client)
	Register   = make(chan *websocket.Conn)
	Broadcast  = make(chan BroadcastMessage)
	Unregister = make(chan *websocket.Conn)
)

func handleRegister(conn *websocket.Conn) {
	Clients[conn] = client{}
	logrus.Debug("connection registered")
}

func handleUnregister(conn *websocket.Conn) {
	delete(Clients, conn)
	logrus.Debug("connection unregistered")
}

func broadcastMessage(message BroadcastMessage) {
	marshalMessage, err := json.Marshal(message)
	if err != nil {
		logrus.Println("marshal error:", err)
		return
	}

	for conn := range Clients {
		if err := conn.WriteMessage(websocket.TextMessage, marshalMessage); err != nil {
			logrus.Println("write error:", err)
			closeConnection(conn)
		}
	}
}

func closeConnection(conn *websocket.Conn) {
	if err := conn.WriteMessage(websocket.CloseMessage, []byte{}); err != nil {
		logrus.Println("write close message error:", err)
	}
	if err := conn.Close(); err != nil {
		logrus.Println("close connection error:", err)
	}
	delete(Clients, conn)
}

func RunHub() {
	for {
		select {
		case conn := <-Register:
			handleRegister(conn)

		case conn := <-Unregister:
			handleUnregister(conn)

		case message := <-Broadcast:
			logrus.Printf("message received: code=%s message=%s result=%v", message.Code, logmask.MaskTextPhones(message.Message), sanitizeBroadcastResultForLog(message.Result))
			broadcastMessage(message)
		}
	}
}

func sanitizeBroadcastResultForLog(result any) any {
	switch value := result.(type) {
	case map[string]any:
		cloned := make(map[string]any, len(value))
		for key, item := range value {
			if shouldMaskBroadcastKey(key) {
				if str, ok := item.(string); ok {
					cloned[key] = logmask.MaskPhoneNumber(str)
					continue
				}
			}
			cloned[key] = sanitizeBroadcastResultForLog(item)
		}
		return cloned
	case map[string]string:
		cloned := make(map[string]string, len(value))
		for key, item := range value {
			if shouldMaskBroadcastKey(key) {
				cloned[key] = logmask.MaskPhoneNumber(item)
				continue
			}
			cloned[key] = logmask.MaskTextPhones(item)
		}
		return cloned
	case []any:
		cloned := make([]any, len(value))
		for idx, item := range value {
			cloned[idx] = sanitizeBroadcastResultForLog(item)
		}
		return cloned
	case []string:
		cloned := make([]string, len(value))
		for idx, item := range value {
			cloned[idx] = logmask.MaskTextPhones(item)
		}
		return cloned
	case string:
		return logmask.MaskTextPhones(value)
	default:
		return result
	}
}

func shouldMaskBroadcastKey(key string) bool {
	switch strings.ToLower(strings.TrimSpace(key)) {
	case "device_id", "device", "phone", "phone_number", "jid", "chat_id", "from":
		return true
	default:
		return false
	}
}

func RegisterRoutes(app fiber.Router, service domainApp.IAppUsecase) {
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			return c.Next()
		}
		return c.SendStatus(fiber.StatusUpgradeRequired)
	})

	app.Get("/ws", websocket.New(func(conn *websocket.Conn) {
		defer func() {
			Unregister <- conn
			_ = conn.Close()
		}()

		Register <- conn

		for {
			messageType, message, err := conn.ReadMessage()
			if err != nil {
				if strings.Contains(err.Error(), "close 1005") {
					logrus.Debugf("websocket closed without status: %v", err)
					return
				}
				if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
					logrus.Println("read error:", err)
				}
				return
			}

			if messageType == websocket.TextMessage {
				var messageData BroadcastMessage
				if err := json.Unmarshal(message, &messageData); err != nil {
					logrus.Println("unmarshal error:", err)
					return
				}

				if messageData.Code == "FETCH_DEVICES" {
					devices, _ := service.FetchDevices(context.Background())
					Broadcast <- BroadcastMessage{
						Code:    "LIST_DEVICES",
						Message: "Device found",
						Result:  devices,
					}
				}
			} else {
				logrus.Println("unsupported message type:", messageType)
			}
		}
	}))
}
