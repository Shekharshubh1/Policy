# NHP-DIS Document 12: Deployment Architecture

---

## 1. Deployment Overview

NHP-DIS is designed for deployment across three tiers:
1. **Local Development:** Single-machine (Windows/Linux/macOS) for research and prototyping.
2. **Government Cloud Staging:** Azure / NIC Cloud virtual machines for MoHFW review.
3. **National Production:** Kubernetes cluster with auto-scaling, monitoring, and CI/CD.

---

## 2. Container Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Docker Compose Stack                 │
│                                                       │
│  ┌─────────────────────┐  ┌────────────────────────┐ │
│  │  nhp-dis-backend     │  │  nhp-dis-frontend      │ │
│  │  Python 3.11-slim    │  │  Node 20-alpine        │ │
│  │  FastAPI + Uvicorn   │  │  Vite build → Nginx    │ │
│  │  Port: 8000          │  │  Port: 80/443          │ │
│  │  pgmpy + pandas      │  │  Static SPA (669 KB)   │ │
│  └─────────┬───────────┘  └──────────┬─────────────┘ │
│            │                          │               │
│            └──────────┬───────────────┘               │
│                       │                               │
│  ┌────────────────────▼──────────────────────────┐   │
│  │  nhp-dis-data (Volume)                         │   │
│  │  /app/data/official_district_health_data.csv   │   │
│  │  /app/models/static_bn_model.pkl               │   │
│  │  /app/models/dbn_model.pkl                     │   │
│  └────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

## 3. Dockerfiles

### 3.1 Backend Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# System dependencies for scipy/numpy
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ ./backend/
COPY data/ ./data/
COPY models/ ./models/
COPY scripts/ ./scripts/

WORKDIR /app/backend
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 3.2 Frontend Dockerfile

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.3 Nginx Configuration

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://nhp-dis-backend:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 30s;
    }
}
```

---

## 4. Docker Compose

```yaml
version: "3.9"
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: nhp-dis-backend
    ports:
      - "8000:8000"
    volumes:
      - ./data:/app/data:ro
      - ./models:/app/models:ro
    environment:
      - GROQ_API_KEY=${GROQ_API_KEY}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: nhp-dis-frontend
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
```

---

## 5. Kubernetes Deployment (Production)

### 5.1 Backend Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nhp-dis-backend
  namespace: nhp-dis
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nhp-dis-backend
  template:
    metadata:
      labels:
        app: nhp-dis-backend
    spec:
      containers:
        - name: backend
          image: registry.azurecr.io/nhp-dis-backend:latest
          ports:
            - containerPort: 8000
          resources:
            requests:
              cpu: "500m"
              memory: "1Gi"
            limits:
              cpu: "2000m"
              memory: "4Gi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 15
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /health
              port: 8000
            initialDelaySeconds: 10
            periodSeconds: 10
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nhp-dis-backend-hpa
  namespace: nhp-dis
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nhp-dis-backend
  minReplicas: 2
  maxReplicas: 8
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

---

## 6. CI/CD Pipeline (GitHub Actions)

```yaml
name: NHP-DIS CI/CD
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r backend/requirements.txt
      - run: python scripts/evaluate_models.py

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          registry: registry.azurecr.io
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
      - run: |
          docker build -f Dockerfile.backend -t registry.azurecr.io/nhp-dis-backend:${{ github.sha }} .
          docker push registry.azurecr.io/nhp-dis-backend:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - uses: azure/k8s-deploy@v5
        with:
          manifests: k8s/
          images: registry.azurecr.io/nhp-dis-backend:${{ github.sha }}
```

---

## 7. Monitoring & Observability

| Component | Tool | Purpose |
|-----------|------|---------|
| Application Metrics | Prometheus + Grafana | Request latency, error rates, model inference times |
| Log Aggregation | Azure Monitor / ELK | Structured JSON logs from uvicorn |
| Health Checks | Kubernetes liveness/readiness | Automatic pod restart on failure |
| Alerting | PagerDuty / Azure Alerts | P95 latency > 500ms, error rate > 1% |
