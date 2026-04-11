# 🚀 Najah Platform: Production Deployment Checklist

Follow these steps for a smooth, high-performance "go-live".

## ⚛️ Phase 1: Frontend (Vercel)
1. **Import Repository**: Select the `frontend` directory as the root.
2. **Framework Preset**: Choose **Vite**.
3. **Environment Variables**:
   - `VITE_API_URL`: Set to your production backend URL (e.g., `https://najah-api.railway.app/api`).
   - `VITE_SOCKET_URL`: Set to your backend base URL (e.g., `https://najah-api.railway.app`).
   - `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth client ID.
4. **Deploy**: Build and verify routing works (React Router).

## ⚙️ Phase 2: Backend (Railway / Render)
1. **Import Repository**: Select the `backend` directory.
2. **Environment Variables**:
   - `PORT`: 5000 (Railway handles internal mapping).
   - `NODE_ENV`: production
   - `CLIENT_URL`: Your Vercel domain (e.g., `https://najah.vercel.app`).
   - `JWT_SECRET`: Generate a random 64-character string.
   - `DATABASE_URL`: Your production Postgres string.
   - `MONGODB_URI`: Your production Mongo string.
   - `REDIS_URL`: Your production Redis string.
   - `FIREBASE_PROJECT_ID` ... and all other Firebase/SMTP keys.
3. **Deploy**: Verify the health check (`/health`) returns `{"status":"ok"}`.

## 🛡️ Phase 3: Final Verification
- [ ] **CORS**: Can the frontend login?
- [ ] **Socket.IO**: Does the real-time chat work? (Ensure WebSocket upgrade is supported).
- [ ] **Firebase**: Can users upload avatars/files?
- [ ] **Google Login**: Is the Redirect URI updated in [Google Console](https://console.cloud.google.com)?

> [!IMPORTANT]
> **Database Host**: If you use Docker on a VPS (Approach 2), ensure the ports `5432`, `27017`, and `6379` are **NOT** open to the public internet unless protected by a firewall.
