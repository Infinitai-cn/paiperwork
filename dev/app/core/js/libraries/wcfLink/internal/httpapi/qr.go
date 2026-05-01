package httpapi

import qrcode "github.com/skip2/go-qrcode"

func GenerateQRCodePNG(content string) ([]byte, error) {
	return qrcode.Encode(content, qrcode.Medium, 320)
}
