# Paiperwork cloud-only deployment (Oracle Always Free)

This deployment uses your existing Linux distribution package from dist/linux:
- Paiperwork-server
- app/

It runs one VM with:
- Paiperwork Go server on 127.0.0.1:8182
- Caddy reverse proxy with HTTPS on your domain

## 1. Provision VM

- Oracle Cloud Always Free Ampere VM (Ubuntu 22.04 recommended)
- Open ports 80 and 443 in Oracle security list and VM firewall
- Point DNS A record to the VM public IP

## 2. Build and upload

From your project machine:

```bash
cd dev/server
bash build.sh
```

Upload dist/linux and this deployment directory to VM.

## 3. Install

On the VM:

```bash
cd /path/to/deployment/oracle-free
sudo bash deploy.sh /path/to/dist/linux your-domain.example.com
```

## 4. Verify

```bash
systemctl status paiperwork caddy
curl -I https://your-domain.example.com
```

## Runtime behavior

- Server bind host is controlled by PAIPERWORK_BIND_HOST.
- Default remains localhost when env var is unset.
- Service config sets PAIPERWORK_BIND_HOST=127.0.0.1 and PAIPERWORK_OPEN_BROWSER=false.

## Cloud-only compatibility

Hosted mode rewrites hardcoded localhost fetch calls in app runtime so cloud endpoints are used.
Unsupported local-only endpoints (ps/version/delete) return 501 in cloud-only mode.

## Notes

- Users still need valid cloud model API access (for example Ollama cloud API key).
- Add authentication and rate limiting before broad public access.
