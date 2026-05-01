package ilink

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type Client struct {
	httpClient     *http.Client
	channelVersion string
}

func NewClient(channelVersion string, timeout time.Duration) *Client {
	return &Client{
		httpClient:     &http.Client{Timeout: timeout},
		channelVersion: channelVersion,
	}
}

type QRCodeResponse struct {
	QRCode    string `json:"qrcode"`
	QRCodeURL string `json:"qrcode_img_content"`
}

type QRStatusResponse struct {
	Status      string `json:"status"`
	BotToken    string `json:"bot_token"`
	AccountID   string `json:"ilink_bot_id"`
	BaseURL     string `json:"baseurl"`
	ILinkUserID string `json:"ilink_user_id"`
}

type TextItem struct {
	Text string `json:"text,omitempty"`
}

type VoiceItem struct {
	Media          CDNMedia `json:"media,omitempty"`
	Text       string `json:"text,omitempty"`
	EncodeType int    `json:"encode_type,omitempty"`
	Playtime   int    `json:"playtime,omitempty"`
}

type FileItem struct {
	Media    CDNMedia `json:"media,omitempty"`
	FileName string `json:"file_name,omitempty"`
	MD5      string `json:"md5,omitempty"`
	Len      string `json:"len,omitempty"`
}

type CDNMedia struct {
	EncryptQueryParam string `json:"encrypt_query_param,omitempty"`
	AESKey            string `json:"aes_key,omitempty"`
	EncryptType       int    `json:"encrypt_type,omitempty"`
}

type ImageItem struct {
	Media      CDNMedia `json:"media,omitempty"`
	ThumbMedia CDNMedia `json:"thumb_media,omitempty"`
	AESKey     string   `json:"aeskey,omitempty"`
	MidSize    int      `json:"mid_size,omitempty"`
}

type VideoItem struct {
	Media      CDNMedia `json:"media,omitempty"`
	ThumbMedia CDNMedia `json:"thumb_media,omitempty"`
	VideoSize  int      `json:"video_size,omitempty"`
}

type MessageItem struct {
	Type      int        `json:"type,omitempty"`
	TextItem  *TextItem  `json:"text_item,omitempty"`
	VoiceItem *VoiceItem `json:"voice_item,omitempty"`
	FileItem  *FileItem  `json:"file_item,omitempty"`
	ImageItem *ImageItem `json:"image_item,omitempty"`
	VideoItem *VideoItem `json:"video_item,omitempty"`
}

type WeixinMessage struct {
	Seq          int64         `json:"seq,omitempty"`
	MessageID    int64         `json:"message_id,omitempty"`
	FromUserID   string        `json:"from_user_id,omitempty"`
	ToUserID     string        `json:"to_user_id,omitempty"`
	ClientID     string        `json:"client_id,omitempty"`
	CreateTimeMS int64         `json:"create_time_ms,omitempty"`
	MessageType  int           `json:"message_type,omitempty"`
	MessageState int           `json:"message_state,omitempty"`
	ItemList     []MessageItem `json:"item_list,omitempty"`
	ContextToken string        `json:"context_token,omitempty"`
}

type GetUpdatesResponse struct {
	Ret                int             `json:"ret,omitempty"`
	ErrCode            int             `json:"errcode,omitempty"`
	ErrMsg             string          `json:"errmsg,omitempty"`
	Messages           []WeixinMessage `json:"msgs,omitempty"`
	GetUpdatesBuf      string          `json:"get_updates_buf,omitempty"`
	LongPollingTimeout int             `json:"longpolling_timeout_ms,omitempty"`
}

type SendMessageResponse struct {
	Ret     int    `json:"ret,omitempty"`
	ErrCode int    `json:"errcode,omitempty"`
	ErrMsg  string `json:"errmsg,omitempty"`
}

const (
	UploadMediaTypeImage = 1
	UploadMediaTypeVideo = 2
	UploadMediaTypeFile  = 3
	UploadMediaTypeVoice = 4
)

func (c *Client) FetchQRCode(ctx context.Context, baseURL string) (QRCodeResponse, error) {
	u, err := url.Parse(strings.TrimRight(baseURL, "/") + "/ilink/bot/get_bot_qrcode?bot_type=3")
	if err != nil {
		return QRCodeResponse{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return QRCodeResponse{}, err
	}
	var out QRCodeResponse
	if err := c.doJSON(req, "", nil, &out); err != nil {
		return QRCodeResponse{}, err
	}
	return out, nil
}

func (c *Client) FetchQRCodeStatus(ctx context.Context, baseURL, qrCode string) (QRStatusResponse, error) {
	u, err := url.Parse(strings.TrimRight(baseURL, "/") + "/ilink/bot/get_qrcode_status?qrcode=" + url.QueryEscape(qrCode))
	if err != nil {
		return QRStatusResponse{}, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return QRStatusResponse{}, err
	}
	req.Header.Set("iLink-App-ClientVersion", "1")
	var out QRStatusResponse
	if err := c.doJSON(req, "", nil, &out); err != nil {
		return QRStatusResponse{}, err
	}
	return out, nil
}

func (c *Client) GetUpdates(ctx context.Context, baseURL, token, getUpdatesBuf string) (GetUpdatesResponse, error) {
	body := map[string]any{
		"get_updates_buf": getUpdatesBuf,
		"base_info": map[string]any{
			"channel_version": c.channelVersion,
		},
	}
	var out GetUpdatesResponse
	if err := c.postJSON(ctx, strings.TrimRight(baseURL, "/")+"/ilink/bot/getupdates", token, body, &out); err != nil {
		return GetUpdatesResponse{}, err
	}
	return out, nil
}

func (c *Client) SendTextMessage(ctx context.Context, baseURL, token, toUserID, text, contextToken string) error {
	msg := map[string]any{
		"from_user_id":  "",
		"to_user_id":    toUserID,
		"client_id":     fmt.Sprintf("wcfLink-%d", time.Now().UnixNano()),
		"message_type":  2,
		"message_state": 2,
		"item_list": []map[string]any{
			{
				"type": 1,
				"text_item": map[string]any{
					"text": text,
				},
			},
		},
	}
	if strings.TrimSpace(contextToken) != "" {
		msg["context_token"] = contextToken
	}

	body := map[string]any{
		"msg": msg,
		"base_info": map[string]any{
			"channel_version": c.channelVersion,
		},
	}
	var out SendMessageResponse
	if err := c.postJSON(ctx, strings.TrimRight(baseURL, "/")+"/ilink/bot/sendmessage", token, body, &out); err != nil {
		return err
	}
	if out.ErrCode != 0 || out.Ret != 0 {
		errText := out.ErrMsg
		if strings.TrimSpace(errText) == "" {
			errText = "sendmessage returned non-zero status"
		}
		return fmt.Errorf("%s (ret=%d errcode=%d)", errText, out.Ret, out.ErrCode)
	}
	return nil
}

func (c *Client) postJSON(ctx context.Context, endpoint, token string, body any, out any) error {
	payload, err := json.Marshal(body)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(payload))
	if err != nil {
		return err
	}
	return c.doJSON(req, token, payload, out)
}

func (c *Client) doJSON(req *http.Request, token string, payload []byte, out any) error {
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("AuthorizationType", "ilink_bot_token")
	req.Header.Set("X-WECHAT-UIN", randomWechatUIN())
	if len(payload) > 0 {
		req.Header.Set("Content-Length", fmt.Sprintf("%d", len(payload)))
	}
	if strings.TrimSpace(token) != "" {
		req.Header.Set("Authorization", "Bearer "+strings.TrimSpace(token))
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("ilink http %d: %s", resp.StatusCode, string(raw))
	}
	if out == nil || len(raw) == 0 {
		return nil
	}
	if err := json.Unmarshal(raw, out); err != nil {
		return fmt.Errorf("decode response: %w", err)
	}
	return nil
}

func randomWechatUIN() string {
	n, err := rand.Int(rand.Reader, big.NewInt(1<<32-1))
	if err != nil {
		return base64.StdEncoding.EncodeToString([]byte(fmt.Sprintf("%d", time.Now().UnixNano())))
	}
	return base64.StdEncoding.EncodeToString([]byte(n.String()))
}
