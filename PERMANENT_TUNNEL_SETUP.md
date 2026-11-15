# Permanent Named Cloudflare Tunnel Guide for `policy.fddcloud.me`

Why this is needed:
A quick tunnel (`trycloudflare.com`) generates a new random URL whenever restarted.
A **Named Permanent Tunnel** binds permanently to **`api.fddcloud.me`** so your Cloudflare Worker (`policy.fddcloud.me`) **NEVER** has to change its `BACKEND_API_URL` again!

---

## 3 Simple Steps to Create a Permanent Tunnel (Takes 2 Minutes)

### Step 1: Login to Cloudflare in Terminal
In PowerShell on your PC, run:
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel login
```
* A browser window will open automatically asking you to select your domain (`fddcloud.me`).
* Click **Authorize**.
* Cloudflare will download your permanent certificate file (`cert.pem`) to your PC.

---

### Step 2: Create Your Permanent Tunnel
Run:
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel create policy-backend
```
* This creates a permanent tunnel named `policy-backend` and outputs a Tunnel ID (e.g., `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`).

---

### Step 3: Route the Tunnel to `api.fddcloud.me`
Run:
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel route dns policy-backend api.fddcloud.me
```
* Cloudflare will automatically create a CNAME DNS record in your `fddcloud.me` account pointing `api.fddcloud.me` to your PC's tunnel.

---

## Running the Permanent Tunnel Anytime

Whenever you want the backend online, simply run:
```powershell
& "C:\Program Files (x86)\cloudflared\cloudflared.exe" tunnel run --url http://localhost:8000 policy-backend
```

### In Cloudflare Worker Settings:
Set `BACKEND_API_URL` once to:
```text
https://api.fddcloud.me
```
It will **NEVER** change or switch again!
