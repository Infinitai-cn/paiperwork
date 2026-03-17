FROM debian:bookworm-slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Expected files in this folder:
# - Paiperwork-server
# - app/
COPY Paiperwork-server /app/Paiperwork-server
COPY app /app/app

RUN chmod +x /app/Paiperwork-server

ENV PAIPERWORK_BIND_HOST=0.0.0.0
ENV PAIPERWORK_OPEN_BROWSER=false

EXPOSE 7860

CMD ["/app/Paiperwork-server", "7860"]
