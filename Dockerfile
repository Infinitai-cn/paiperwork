# Build the Go server from source and bundle the frontend app assets.
# This Dockerfile is intended for container hosting platforms like Railway.

FROM golang:1.25-bookworm AS builder
WORKDIR /src

# Copy module files first so dependency caching works.
COPY go.mod go.sum ./
RUN go mod download

# Copy the project and build the Linux executable.
COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-s -w" -o /app/Paiperwork-server ./dev/server/main.go

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

COPY --from=builder /app/Paiperwork-server /app/Paiperwork-server
COPY dev/app /app/app

RUN chmod +x /app/Paiperwork-server

ENV PAIPERWORK_BIND_HOST=0.0.0.0
ENV PAIPERWORK_OPEN_BROWSER=false

EXPOSE 7860
CMD ["/bin/sh", "-lc", "/app/Paiperwork-server ${PORT:-7860}"]
