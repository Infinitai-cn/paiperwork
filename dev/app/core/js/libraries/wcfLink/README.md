# wcfLink

`wcfLink` 是一个可复用的 Go 核心库，用来接入 iLink 微信通道。

它提供两种使用方式：

- 作为 Go 库嵌入到你自己的程序里
- 作为一个本地 HTTP 服务独立运行

桌面应用已经拆分到独立项目 [wcfLink-GUI](https://github.com/lich0821/wcfLink-GUI)。

## 当前支持

- 扫码登录
- 登录状态轮询
- 已登录账号持久化
- iLink `getupdates` 长轮询
- 文本消息收发
- 图片、视频、文件发送
- 图片、语音、视频、文件接收与落盘
- 本地事件存储
- `context_token` 管理
- 本地 HTTP API
- SQLite 状态存储

## 目录

- 公开入口：[engine/engine.go](./engine/engine.go)
- 后台入口：[cmd/wcfLink/main.go](./cmd/wcfLink/main.go)
- 应用服务：[internal/app/app.go](./internal/app/app.go)
- 协议实现：[internal/ilink/client.go](./internal/ilink/client.go)
- 媒体协议：[internal/ilink/media.go](./internal/ilink/media.go)
- 存储层：[internal/store/store.go](./internal/store/store.go)
- HTTP API：[internal/httpapi/server.go](./internal/httpapi/server.go)
- 轮询 worker：[internal/worker/poller.go](./internal/worker/poller.go)

## 运行要求

- Go `1.25+`
- 默认使用 SQLite

## 快速开始

### 方式一：作为本地 HTTP 服务运行

构建并启动：

```bash
go build -o ./bin/wcfLink ./cmd/wcfLink
./bin/wcfLink
```

默认监听地址：

```text
127.0.0.1:17890
```

### Paiperwork 代理集成

如果将 `wcfLink` 嵌入 Paiperwork，Paiperwork 会将浏览器端的 `/api/wechat/*` 请求代理到本地 `wcfLink` 实例。

常见的代理路径如下：

- `/api/wechat/api/accounts/login/qr?session_id=...`
- `/api/wechat/api/accounts/login/status?session_id=...`
- `/api/wechat/events?after_id=...&limit=20`
- `/api/wechat/api/messages/send-text`
- `/api/wechat/api/messages/send-media`

这些请求在后台会被转发到 `127.0.0.1:17890`，并且 `/api/wechat` 前缀会被 Paiperwork 自动移除。

启动后你可以通过 HTTP API 完成扫码登录、查询账号、拉取事件、发送消息。

查看当前二进制版本：

```bash
./bin/wcfLink -version
```

### 方式二：作为 Go 库嵌入

先安装模块：

```bash
go get github.com/lich0821/wcfLink@latest
```

最小示例：

```go
package main

import (
	"context"
	"log/slog"
	"os"

	"github.com/lich0821/wcfLink/engine"
)

func main() {
	ctx := context.Background()
	cfg := engine.LoadConfig()

	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	eng, err := engine.New(ctx, cfg, logger)
	if err != nil {
		panic(err)
	}
	defer eng.Shutdown()

	if err := eng.StartBackground(ctx); err != nil {
		panic(err)
	}

	select {}
}
```

## 登录流程

无论你是通过 Go 库还是 HTTP API，登录流程都一样：

1. 发起登录，拿到二维码会话
2. 轮询登录状态
3. 用户扫码确认
4. 登录成功后账号会自动持久化，并启动长轮询

### Go 库登录示例

```go
session, err := eng.StartLogin(ctx, "")
if err != nil {
	return err
}

png, err := eng.GetLoginQRCodePNG(ctx, session.SessionID)
if err != nil {
	return err
}

_ = os.WriteFile("qrcode.png", png, 0o644)

status, err := eng.GetLoginStatus(ctx, session.SessionID)
if err != nil {
	return err
}

_ = status
```

### HTTP 登录示例

发起登录：

```bash
curl -s -X POST http://127.0.0.1:17890/api/accounts/login/start \
  -H 'Content-Type: application/json' \
  -d '{}'
```

返回里会包含：

- `session_id`
- `qr_code_url`

轮询登录状态：

```bash
curl -s "http://127.0.0.1:17890/api/accounts/login/status?session_id=login_xxx"
```

如果你要直接拿二维码 PNG：

```bash
curl -o qrcode.png "http://127.0.0.1:17890/api/accounts/login/qr?session_id=login_xxx"
```

## 作为库时可直接调用的接口

当前 `engine.Engine` 已公开这些核心方法：

- `StartBackground`
- `Shutdown`
- `StartLogin`
- `GetLoginStatus`
- `GetLoginSession`
- `GetLoginQRCodePNG`
- `ListAccounts`
- `ListEvents`
- `GetSettings`
- `UpdateSettings`
- `SendText`
- `SendMedia`
- `LogoutAccount`

当前公开的版本接口：

- `engine.CurrentVersion()`

### 发送文本

```go
err := eng.SendText(ctx, accountID, toUserID, "你好", "")
```

说明：

- 如果 `contextToken` 传空，会尝试从本地已保存的会话上下文里查
- 当前发送仍然要求对方至少先来过一条消息

### 发送媒体

```go
err := eng.SendMedia(ctx, accountID, toUserID, "image", "/abs/path/demo.jpg", "图片说明", "")
```

`mediaType` 当前支持：

- `image`
- `video`
- `file`

说明：

- `text` 不为空时，会先发文本，再发媒体
- 音频内容发送当前不可用

## HTTP API

当前可用接口：

- `GET /health/live`
- `GET /health/ready`
- `GET /api/version`
- `POST /api/accounts/login/start`
- `GET /api/accounts/login/status`
- `GET /api/accounts/login/qr`
- `GET /api/accounts`
- `GET /api/events`
- `GET /api/settings`
- `POST /api/settings`
- `POST /api/messages/send-text`
- `POST /api/messages/send-media`

### 查询账号

```bash
curl -s http://127.0.0.1:17890/api/accounts
```

### 查询版本

```bash
curl -s http://127.0.0.1:17890/api/version
```

### 查询事件

```bash
curl -s "http://127.0.0.1:17890/api/events?after_id=0&limit=100"
```

返回的事件里会包含：

- `direction`
- `event_type`
- `from_user_id`
- `to_user_id`
- `body_text`
- `media_path`
- `media_file_name`
- `media_mime_type`

### 发送文本

```bash
curl -s -X POST http://127.0.0.1:17890/api/messages/send-text \
  -H 'Content-Type: application/json' \
  -d '{
    "account_id": "xxx@im.bot",
    "to_user_id": "yyy@im.wechat",
    "text": "你好"
  }'
```

### 发送媒体

```bash
curl -s -X POST http://127.0.0.1:17890/api/messages/send-media \
  -H 'Content-Type: application/json' \
  -d '{
    "account_id": "xxx@im.bot",
    "to_user_id": "yyy@im.wechat",
    "type": "image",
    "file_path": "/absolute/path/to/demo.jpg",
    "text": "图片说明"
  }'
```

说明：

- `type` 可传 `image`、`video`、`file`
- `text` 可选
- 当前音频内容发送不可用

## 媒体文件保存

入站媒体默认保存到：

```text
<state-dir>/media/
```

事件记录中会保存：

- `media_path`
- `media_file_name`
- `media_mime_type`

## 配置

支持环境变量：

- `WCFLINK_LISTEN_ADDR`
- `WCFLINK_STATE_DIR`
- `WCFLINK_DB_PATH`
- `WCFLINK_MEDIA_DIR`
- `WCFLINK_BASE_URL`
- `WCFLINK_CDN_BASE_URL`
- `WCFLINK_CHANNEL_VERSION`
- `WCFLINK_POLL_TIMEOUT`
- `WCFLINK_LOG_LEVEL`

默认配置：

- 数据目录：`./bin/data/`
- 数据库：`./bin/data/wcfLink.db`
- 媒体目录：系统临时目录（用于临时上传文件，不在 state 目录下持久化）
