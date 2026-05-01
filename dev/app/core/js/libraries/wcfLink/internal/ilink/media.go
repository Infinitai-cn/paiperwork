package ilink

import (
	"bytes"
	"context"
	"crypto/aes"
	"crypto/md5"
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type GetUploadURLResponse struct {
	UploadParam      string `json:"upload_param,omitempty"`
	ThumbUploadParam string `json:"thumb_upload_param,omitempty"`
}

type UploadedMedia struct {
	DownloadEncryptedQueryParam string
	AESKeyHex                   string
	PlainSize                   int
	CipherSize                  int
}

func (c *Client) GetUploadURL(
	ctx context.Context,
	baseURL,
	token string,
	reqBody map[string]any,
) (GetUploadURLResponse, error) {
	reqBody["base_info"] = map[string]any{
		"channel_version": c.channelVersion,
	}
	var out GetUploadURLResponse
	if err := c.postJSON(ctx, strings.TrimRight(baseURL, "/")+"/ilink/bot/getuploadurl", token, reqBody, &out); err != nil {
		return GetUploadURLResponse{}, err
	}
	return out, nil
}

func (c *Client) UploadLocalMedia(
	ctx context.Context,
	cdnBaseURL,
	baseURL,
	token,
	toUserID,
	filePath string,
	mediaType int,
) (UploadedMedia, error) {
	plaintext, err := os.ReadFile(filePath)
	if err != nil {
		return UploadedMedia{}, err
	}
	rawMD5 := md5.Sum(plaintext)
	aesKey := make([]byte, 16)
	if _, err := rand.Read(aesKey); err != nil {
		return UploadedMedia{}, err
	}
	fileKeyBytes := make([]byte, 16)
	if _, err := rand.Read(fileKeyBytes); err != nil {
		return UploadedMedia{}, err
	}
	fileKey := hex.EncodeToString(fileKeyBytes)
	ciphertext, err := encryptAesECB(plaintext, aesKey)
	if err != nil {
		return UploadedMedia{}, err
	}

	uploadResp, err := c.GetUploadURL(ctx, baseURL, token, map[string]any{
		"filekey":       fileKey,
		"media_type":    mediaType,
		"to_user_id":    toUserID,
		"rawsize":       len(plaintext),
		"rawfilemd5":    hex.EncodeToString(rawMD5[:]),
		"filesize":      len(ciphertext),
		"no_need_thumb": true,
		"aeskey":        hex.EncodeToString(aesKey),
	})
	if err != nil {
		return UploadedMedia{}, err
	}
	if strings.TrimSpace(uploadResp.UploadParam) == "" {
		return UploadedMedia{}, fmt.Errorf("getuploadurl returned empty upload_param")
	}

	downloadParam, err := c.uploadCiphertextToCDN(ctx, cdnBaseURL, uploadResp.UploadParam, fileKey, ciphertext)
	if err != nil {
		return UploadedMedia{}, err
	}
	return UploadedMedia{
		DownloadEncryptedQueryParam: downloadParam,
		AESKeyHex:                   hex.EncodeToString(aesKey),
		PlainSize:                   len(plaintext),
		CipherSize:                  len(ciphertext),
	}, nil
}

func (c *Client) SendImageMessage(ctx context.Context, baseURL, token, toUserID, contextToken, text string, uploaded UploadedMedia) error {
	item := map[string]any{
		"type": 2,
		"image_item": map[string]any{
			"media": map[string]any{
				"encrypt_query_param": uploaded.DownloadEncryptedQueryParam,
				"aes_key":             base64.StdEncoding.EncodeToString([]byte(uploaded.AESKeyHex)),
				"encrypt_type":        1,
			},
			"mid_size": uploaded.CipherSize,
		},
	}
	return c.sendMediaItems(ctx, baseURL, token, toUserID, contextToken, text, item)
}

func (c *Client) SendVideoMessage(ctx context.Context, baseURL, token, toUserID, contextToken, text string, uploaded UploadedMedia) error {
	item := map[string]any{
		"type": 5,
		"video_item": map[string]any{
			"media": map[string]any{
				"encrypt_query_param": uploaded.DownloadEncryptedQueryParam,
				"aes_key":             base64.StdEncoding.EncodeToString([]byte(uploaded.AESKeyHex)),
				"encrypt_type":        1,
			},
			"video_size": uploaded.CipherSize,
		},
	}
	return c.sendMediaItems(ctx, baseURL, token, toUserID, contextToken, text, item)
}

func (c *Client) SendFileMessage(ctx context.Context, baseURL, token, toUserID, contextToken, text, fileName string, uploaded UploadedMedia) error {
	item := map[string]any{
		"type": 4,
		"file_item": map[string]any{
			"media": map[string]any{
				"encrypt_query_param": uploaded.DownloadEncryptedQueryParam,
				"aes_key":             base64.StdEncoding.EncodeToString([]byte(uploaded.AESKeyHex)),
				"encrypt_type":        1,
			},
			"file_name": fileName,
			"len":       fmt.Sprintf("%d", uploaded.PlainSize),
		},
	}
	return c.sendMediaItems(ctx, baseURL, token, toUserID, contextToken, text, item)
}

func (c *Client) SendVoiceMessage(ctx context.Context, baseURL, token, toUserID, contextToken, text string, encodeType int, uploaded UploadedMedia) error {
	item := map[string]any{
		"type": 3,
		"voice_item": map[string]any{
			"media": map[string]any{
				"encrypt_query_param": uploaded.DownloadEncryptedQueryParam,
				"aes_key":             base64.StdEncoding.EncodeToString([]byte(uploaded.AESKeyHex)),
				"encrypt_type":        1,
			},
			"encode_type": encodeType,
			"text":        "",
		},
	}
	return c.sendMediaItems(ctx, baseURL, token, toUserID, contextToken, text, item)
}

func (c *Client) sendMediaItems(ctx context.Context, baseURL, token, toUserID, contextToken, text string, mediaItem map[string]any) error {
	items := make([]map[string]any, 0, 2)
	if strings.TrimSpace(text) != "" {
		items = append(items, map[string]any{
			"type": 1,
			"text_item": map[string]any{
				"text": text,
			},
		})
	}
	items = append(items, mediaItem)

	for _, item := range items {
		msg := map[string]any{
			"from_user_id":  "",
			"to_user_id":    toUserID,
			"client_id":     fmt.Sprintf("wcfLink-%d", time.Now().UnixNano()),
			"message_type":  2,
			"message_state": 2,
			"item_list":     []map[string]any{item},
		}
		if strings.TrimSpace(contextToken) != "" {
			msg["context_token"] = contextToken
		}
		var out SendMessageResponse
		if err := c.postJSON(ctx, strings.TrimRight(baseURL, "/")+"/ilink/bot/sendmessage", token, map[string]any{
			"msg": msg,
			"base_info": map[string]any{
				"channel_version": c.channelVersion,
			},
		}, &out); err != nil {
			return err
		}
		if out.ErrCode != 0 || out.Ret != 0 {
			errText := out.ErrMsg
			if strings.TrimSpace(errText) == "" {
				errText = "sendmessage returned non-zero status"
			}
			return fmt.Errorf("%s (ret=%d errcode=%d)", errText, out.Ret, out.ErrCode)
		}
	}
	return nil
}

func (c *Client) DownloadMessageMedia(ctx context.Context, cdnBaseURL string, item MessageItem) ([]byte, string, string, error) {
	switch item.Type {
	case 2:
		if item.ImageItem == nil || strings.TrimSpace(item.ImageItem.Media.EncryptQueryParam) == "" {
			return nil, "", "", fmt.Errorf("image media is missing")
		}
		aesKey := item.ImageItem.Media.AESKey
		if item.ImageItem.AESKey != "" {
			aesKey = base64.StdEncoding.EncodeToString([]byte(item.ImageItem.AESKey))
		}
		buf, err := c.downloadCDNMedia(ctx, cdnBaseURL, item.ImageItem.Media.EncryptQueryParam, aesKey)
		if err != nil {
			return nil, "", "", err
		}
		mime := detectMIME(buf, ".jpg")
		return buf, "image"+extensionFromMIME(mime, ".jpg"), mime, nil
	case 3:
		if item.VoiceItem == nil || strings.TrimSpace(item.VoiceItem.Media.EncryptQueryParam) == "" || strings.TrimSpace(item.VoiceItem.Media.AESKey) == "" {
			return nil, "", "", fmt.Errorf("voice media is missing")
		}
		buf, err := c.downloadCDNMedia(ctx, cdnBaseURL, item.VoiceItem.Media.EncryptQueryParam, item.VoiceItem.Media.AESKey)
		if err != nil {
			return nil, "", "", err
		}
		return buf, "voice.silk", "audio/silk", nil
	case 4:
		if item.FileItem == nil || strings.TrimSpace(item.FileItem.Media.EncryptQueryParam) == "" || strings.TrimSpace(item.FileItem.Media.AESKey) == "" {
			return nil, "", "", fmt.Errorf("file media is missing")
		}
		buf, err := c.downloadCDNMedia(ctx, cdnBaseURL, item.FileItem.Media.EncryptQueryParam, item.FileItem.Media.AESKey)
		if err != nil {
			return nil, "", "", err
		}
		fileName := item.FileItem.FileName
		if strings.TrimSpace(fileName) == "" {
			fileName = "file.bin"
		}
		return buf, fileName, detectMIME(buf, filepath.Ext(fileName)), nil
	case 5:
		if item.VideoItem == nil || strings.TrimSpace(item.VideoItem.Media.EncryptQueryParam) == "" || strings.TrimSpace(item.VideoItem.Media.AESKey) == "" {
			return nil, "", "", fmt.Errorf("video media is missing")
		}
		buf, err := c.downloadCDNMedia(ctx, cdnBaseURL, item.VideoItem.Media.EncryptQueryParam, item.VideoItem.Media.AESKey)
		if err != nil {
			return nil, "", "", err
		}
		return buf, "video.mp4", "video/mp4", nil
	default:
		return nil, "", "", fmt.Errorf("unsupported media item type %d", item.Type)
	}
}

func (c *Client) uploadCiphertextToCDN(ctx context.Context, cdnBaseURL, uploadParam, fileKey string, ciphertext []byte) (string, error) {
	endpoint := fmt.Sprintf("%s/upload?encrypted_query_param=%s&filekey=%s",
		strings.TrimRight(cdnBaseURL, "/"),
		url.QueryEscape(uploadParam),
		url.QueryEscape(fileKey),
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(ciphertext))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/octet-stream")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("cdn upload http %d: %s", resp.StatusCode, string(body))
	}
	downloadParam := resp.Header.Get("x-encrypted-param")
	if strings.TrimSpace(downloadParam) == "" {
		return "", fmt.Errorf("cdn upload response missing x-encrypted-param")
	}
	return downloadParam, nil
}

func (c *Client) downloadCDNMedia(ctx context.Context, cdnBaseURL, encryptedQueryParam, aesKeyBase64 string) ([]byte, error) {
	endpoint := fmt.Sprintf("%s/download?encrypted_query_param=%s",
		strings.TrimRight(cdnBaseURL, "/"),
		url.QueryEscape(encryptedQueryParam),
	)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("cdn download http %d: %s", resp.StatusCode, string(raw))
	}
	if strings.TrimSpace(aesKeyBase64) == "" {
		return raw, nil
	}
	key, err := parseAESKey(aesKeyBase64)
	if err != nil {
		return nil, err
	}
	return decryptAesECB(raw, key)
}

func encryptAesECB(plaintext, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	padded := pkcs7Pad(plaintext, block.BlockSize())
	out := make([]byte, len(padded))
	for start := 0; start < len(padded); start += block.BlockSize() {
		block.Encrypt(out[start:start+block.BlockSize()], padded[start:start+block.BlockSize()])
	}
	return out, nil
}

func decryptAesECB(ciphertext, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	if len(ciphertext)%block.BlockSize() != 0 {
		return nil, fmt.Errorf("ciphertext size %d is not a multiple of block size", len(ciphertext))
	}
	out := make([]byte, len(ciphertext))
	for start := 0; start < len(ciphertext); start += block.BlockSize() {
		block.Decrypt(out[start:start+block.BlockSize()], ciphertext[start:start+block.BlockSize()])
	}
	return pkcs7Unpad(out, block.BlockSize())
}

func parseAESKey(aesKeyBase64 string) ([]byte, error) {
	decoded, err := base64.StdEncoding.DecodeString(aesKeyBase64)
	if err != nil {
		return nil, err
	}
	if len(decoded) == 16 {
		return decoded, nil
	}
	if len(decoded) == 32 && isHexASCII(decoded) {
		return hex.DecodeString(string(decoded))
	}
	return nil, fmt.Errorf("unexpected aes_key length %d", len(decoded))
}

func isHexASCII(value []byte) bool {
	for _, b := range value {
		switch {
		case b >= '0' && b <= '9':
		case b >= 'a' && b <= 'f':
		case b >= 'A' && b <= 'F':
		default:
			return false
		}
	}
	return true
}

func pkcs7Pad(src []byte, blockSize int) []byte {
	padding := blockSize - len(src)%blockSize
	out := make([]byte, len(src)+padding)
	copy(out, src)
	for i := len(src); i < len(out); i++ {
		out[i] = byte(padding)
	}
	return out
}

func pkcs7Unpad(src []byte, blockSize int) ([]byte, error) {
	if len(src) == 0 || len(src)%blockSize != 0 {
		return nil, fmt.Errorf("invalid padded buffer size")
	}
	padding := int(src[len(src)-1])
	if padding == 0 || padding > blockSize || padding > len(src) {
		return nil, fmt.Errorf("invalid PKCS7 padding")
	}
	for _, b := range src[len(src)-padding:] {
		if int(b) != padding {
			return nil, fmt.Errorf("invalid PKCS7 padding")
		}
	}
	return src[:len(src)-padding], nil
}

func detectMIME(buf []byte, fallbackExt string) string {
	contentType := http.DetectContentType(buf)
	if contentType == "application/octet-stream" {
		switch strings.ToLower(fallbackExt) {
		case ".jpg", ".jpeg":
			return "image/jpeg"
		case ".png":
			return "image/png"
		case ".gif":
			return "image/gif"
		case ".mp4":
			return "video/mp4"
		case ".pdf":
			return "application/pdf"
		}
	}
	return contentType
}

func extensionFromMIME(mime, fallback string) string {
	switch mime {
	case "image/jpeg":
		return ".jpg"
	case "image/png":
		return ".png"
	case "image/gif":
		return ".gif"
	case "video/mp4":
		return ".mp4"
	}
	return fallback
}
