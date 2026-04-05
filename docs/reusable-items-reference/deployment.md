# Deployment Strategies

This project is container-ready and follows industrial benchmarks for both bare-metal and containerized deployments.

## 🏗️ Backend Deployment (Server)

### 1. Using Docker (Recommended for Production)
The system includes configuration for multi-stage Docker builds and Docker Compose orchestration.

- **`docker-compose.yml`**: Full application stack including the Node.js API and MongoDB database.
  - **Start Stack**: `npm run docker:prod` (or `docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d`).
  - **Stop Stack**: `docker-compose down`.

### 2. Manual PM2 Deployment (Bare-Metal)
PM2 is used for managing the Node.js process with high reliability.

- **Configuration**: Uses `ecosystem.config.json` for name, script path, and environment variables.
- **Start Command**: `npm start` (or `pm2 start ecosystem.config.json`).
- **Monitoring**: Use `pm2 list`, `pm2 logs`, or `pm2 monit` to observe system health.

---

## 🎨 Frontend Deployment (Client)

### 1. Build & Serve (Standard Flow)
The React application is built via Vite as a collection of static assets (HTML, JS, CSS).

- **Generation**: `npm run build`.
- **Output**: The `/dist` folder is created containing minified, chunked, and optimized assets.

### 2. Static Asset Hosting
The compiled `/dist` directory can be hosted on:
- **Nginx / Apache**: Recommended for most enterprise-grade hosting setups.
- **Vercel / Netlify**: Ideal for rapid prototyping and continuous delivery.
- **S3 / CloudFront**: Best for globally distributed edge-performance hosting.

---

## 🔒 Environment Management

Ensure correct `.env` files are present in both `/server` and `/client` before proceeding with any deployment strategy:
1. **Server**: Needs `MONGODB_URL`, `JWT_SECRET`, `AWS_ACCESS_KEY`, etc.
2. **Client**: Needs `VITE_API_URL` to point to the backend server's address.
