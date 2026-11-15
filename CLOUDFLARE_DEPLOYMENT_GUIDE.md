# Production Cloudflare Deployment Guide
## National Healthcare Policy Decision Intelligence System (NHP-DIS)

This guide provides end-to-end instructions for deploying the NHP-DIS platform to your custom domain using **Cloudflare** with full HTTPS, DDoS mitigation, and edge caching.

---

## 1. Environment Variables Checklist

A clean [`.env.example`](file:///d:/research/basyian/mp_edu_policy/.env.example) is provided in the repository root. Copy it to `.env`:

```bash
cp .env.example .env
```

### Key Environment Variables

| Variable | Required? | Default / Example | Purpose |
| :--- | :--- | :--- | :--- |
| `GROQ_API_KEY` | Optional | `gsk_...` | Powers LLaMA-3.3-70B for natural language policy synthesis & Policy Copilot. If omitted, the engine falls back to deterministic neuro-symbolic rule explanations. |
| `BACKEND_HOST` | No | `0.0.0.0` | Host IP for FastAPI/Uvicorn server. |
| `BACKEND_PORT` | No | `8000` | Port for FastAPI/Uvicorn server. |
| `VITE_API_URL` | Domain-dependent | `https://api.yourdomain.com` or `""` | Base URL used by the React frontend to reach the backend. **See below for how to configure this.** |
| `LOG_LEVEL` | No | `INFO` | Backend logging level. |

> [!IMPORTANT]
> **Understanding `VITE_API_URL` in Production:**
> - **Unified Domain / Reverse Proxy / Cloudflare Tunnel:** If your frontend and backend run under the same domain (e.g. frontend at `policy.yourdomain.com` and backend API calls routed to `/health`, `/simulate`, etc. via Nginx or Cloudflare Tunnel), set `VITE_API_URL=` (empty). The frontend will automatically make same-origin relative requests, completely preventing Mixed-Content (`HTTPS -> HTTP`) errors.
> - **Separate API Subdomain:** If your backend runs at `https://api.yourdomain.com`, set `VITE_API_URL=https://api.yourdomain.com`. Remember that Vite inlines this at **build time** (`npm run build`).

---

## 2. Recommended Architecture: Cloudflare Tunnel (Zero Trust)

Cloudflare Tunnel (`cloudflared`) connects your server directly to Cloudflare without opening any firewall ports, port forwarding, or configuring public IP addresses. It automatically manages SSL/TLS certificates and protects against DDoS attacks.

```
                    ┌──────────────────────────┐
                    │    Cloudflare Edge       │
                    │   (SSL, DDoS, Cache)     │
                    └────────────┬─────────────┘
                                 │ Encrypted Tunnel
                                 ▼
                    ┌──────────────────────────┐
                    │   Your Server / VPS      │
                    │   (cloudflared daemon)   │
                    ├────────────┬─────────────┤
                    │ :3000 (UI) │ :8000 (API) │
                    └────────────┴─────────────┘
```

### Step 1: Install `cloudflared` on Your Server
- **Ubuntu/Debian:**
  ```bash
  curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
  sudo dpkg -i cloudflared.deb
  ```
- **Windows (PowerShell):**
  ```powershell
  winget install --id Cloudflare.cloudflared
  ```
- **Docker:** Included via `cloudflare/cloudflared:latest`.

### Step 2: Create a Cloudflare Tunnel
1. Log in to your Cloudflare account:
   ```bash
   cloudflared tunnel login
   ```
2. Create the tunnel:
   ```bash
   cloudflared tunnel create nhp-dis
   ```
   (Note the Tunnel ID outputted, e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

### Step 3: Configure Ingress Routing
Create a configuration file at `~/.cloudflared/config.yml`:

```yaml
tunnel: <YOUR-TUNNEL-ID>
credentials-file: /root/.cloudflared/<YOUR-TUNNEL-ID>.json

ingress:
  # 1. Frontend Web Dashboard
  - hostname: policy.yourdomain.com
    service: http://localhost:3000

  # 2. Backend FastAPI Server
  - hostname: api.yourdomain.com
    service: http://localhost:8000

  # Catch-all rule (required)
  - service: http_status:404
```

### Step 4: Route DNS in Cloudflare
```bash
cloudflared tunnel route dns nhp-dis policy.yourdomain.com
cloudflared tunnel route dns nhp-dis api.yourdomain.com
```

### Step 5: Start the App & Tunnel
1. Start the backend & frontend:
   ```bash
   docker compose up -d
   ```
2. Start the tunnel as a system service:
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   ```

---

## 3. Alternative Architecture: Cloudflare Pages (Frontend) + Cloud Backend

If you prefer to host the frontend serverless on Cloudflare Pages and the backend on a container platform (such as Render, Fly.io, Railway, or a VPS):

### Frontend on Cloudflare Pages:
1. Go to **Cloudflare Dashboard** > **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
2. Select your repository: `https://github.com/Shekharshubh1/Policy.git`.
3. Configure build settings:
   - **Framework preset:** `Vite`
   - **Root directory:** `national_health_policy/frontend`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Set Environment Variable in Cloudflare Pages:
   - `VITE_API_URL` = `https://api.yourdomain.com`
5. Click **Save and Deploy**.
6. Under **Custom domains**, add `policy.yourdomain.com` (Cloudflare configures DNS automatically).

### Backend on Cloud Server:
1. Deploy `national_health_policy/Dockerfile.backend` to your server or platform.
2. In Cloudflare DNS, point `api.yourdomain.com` to the server IP (A Record) or host CNAME with the Cloudflare Proxy (Orange Cloud) enabled.

---

## 4. Critical Cloudflare Dashboard Settings

In the Cloudflare Dashboard for your domain (`yourdomain.com`):

1. **SSL/TLS Encryption Mode:**
   - Navigate to **SSL/TLS** > **Overview**.
   - Select **Full** or **Full (Strict)**.
   - ⚠️ **NEVER choose "Flexible"**: It causes infinite redirect loops (`ERR_TOO_MANY_REDIRECTS`) because Cloudflare requests your server over unencrypted HTTP while enforcing HTTPS at the edge.

2. **Always Use HTTPS:**
   - Navigate to **SSL/TLS** > **Edge Certificates**.
   - Toggle **Always Use HTTPS** to **ON**.
   - Toggle **Automatic HTTPS Rewrites** to **ON**.
   - Set **Minimum TLS Version** to **TLS 1.2**.

3. **WebSockets Support:**
   - Navigate to **Network** > toggle **WebSockets** to **ON**.

4. **Browser Cache TTL & Caching Rules:**
   - Under **Caching** > **Configuration**, set Browser Cache TTL to **Respect Existing Headers**.
   - Static assets (`/assets/*.js`, `/assets/*.css`) contain unique Vite hashes and are cached aggressively by Nginx / Cloudflare.

---

## 5. Pre-Flight Verification Checklist

Before launching to stakeholders:

- [ ] `.env` exists and contains optional `GROQ_API_KEY` (if using Groq LLM synthesis).
- [ ] Backend health check responds: `curl https://api.yourdomain.com/health` returns `{"status":"healthy",...}`.
- [ ] Dataset summary responds: `curl https://api.yourdomain.com/summary` returns `{"status":"success", "total_records": 1278, ...}`.
- [ ] Frontend loads over HTTPS without mixed-content warnings in the browser DevTools Console.
- [ ] Simulation test: Open **Policy Simulator**, move sliders, click **Run Simulation** — verify posterior probabilities render without console errors.
- [ ] Longitudinal forecast test: Open **Longitudinal Forecast**, select indicators, and verify 2015–2035 trajectories plot cleanly.
- [ ] Error Boundary test: Open all 10 tabs to confirm zero blank screens.
