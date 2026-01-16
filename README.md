# THE GEAR - VET WebXR Hub

**THE GEAR** is an open-source WebXR platform designed for Vocational Education and Training (VET). It allows schools and students to upload, manage, and interact with 3D digital twins of industrial equipment directly in the browser, with support for VR headsets (Meta Quest), mobile devices, and desktops.

## 🚀 Key Features

*   **3D Asset Repository**: Upload and manage `.glb`, `.gltf`, `.obj` models.
*   **WebXR Viewer**: Interactive VR/AR visualization using A-Frame and Three.js.
*   **Molecular Viewer**: Dedicated PDB viewer for chemistry and biology molecules.
*   **CAD Support**: Download and preview support for `.stp` / `.step` industrial files.
*   **Interactive Hotspots**: Add educational Points of Interest (POI) with text, video, and audio.
*   **AI Mentor**: Voice-activated AI assistant (Gemini 2.0 Flash) for context-aware guidance.
*   **Multi-User Workshops**: Experimental shared virtual spaces for collaborative learning.
*   **Dashboard**: "Featured" models highlight and category-based filtering (sectors).

## 🛠 Tech Stack

### Frontend
*   **React 18** (Vite)
*   **TypeScript**
*   **TailwindCSS** (Styling)
*   **A-Frame** (WebXR Framework)
*   **Three.js** (3D Rendering)

### Backend
*   **Node.js / Express**
*   **MariaDB / MySQL** (Database)
*   **Multer** (File Uploads)
*   **Google Gemini API** (AI Features)

---

## 💻 Local Initalization

### 1. Prerequisities
*   Node.js (v18+)
*   MariaDB or MySQL Server

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/blagojevicboban/GEAR.git
cd GEAR

# Install dependencies
npm install
```

### 3. Database Setup
1.  Create a MySQL/MariaDB database named `gear`.
2.  Import the initial schema and data.
    *   **Option A (Full Dump):** Restoration from `scripts/gear_full_dump.sql` (Recommended).
    *   **Option B (Manual):** Run `server/database_init.sql` (if available) and then apply migrations in `scripts/`.

```bash
# Example import
mysql -u your_user -p gear < scripts/gear_full_dump.sql
```

3.  Configure environment variables.
    Create a `.env` file in the root directory:
    ```env
    DB_HOST=localhost
    DB_USER=gear
    DB_PASSWORD=your_password
    DB_NAME=gear
    API_KEY=your_google_gemini_api_key
    ```

### 4. Running Locally
```bash
# Start the development server (Frontend + Backend)
npm run start
```
*   Frontend: `http://localhost:3001` (Proxied via Backend if using production build) or `http://localhost:5173` (Vite Dev).
*   **Recommended for Dev:** `npm run dev` (Vite) + `node server/index.js` (Backend) in separate terminals.

---

## 🌍 Deployment (Production)

### Server Requirements
*   Linux Server (Ubuntu/Debian recommended)
*   Node.js & NPM
*   PM2 (Process Manager)
*   Nginx (Web Server / Proxy)
*   MariaDB/MySQL

### Deployment Steps
1.  **Pull Code**:
    ```bash
    cd /path/to/app
    git pull origin main
    npm install
    npm run build
    ```

2.  **Database Migration**:
    Ensure valid database structure.
    ```bash
    mariadb -u gear -p gear < scripts/migration_add_featured.sql
    ```

3.  **Start Services**:
    ```bash
    pm2 start server/index.js --name gear-backend
    pm2 start deployment/webhook.js --name gear-webhook
    pm2 save
    ```

### 🔧 Nginx Configuration (Critical)
The application assumes it is running behind a proxy. Ensure your Nginx config proxies `/api` requests to the Node.js backend (default port 3001).

**Important**: The application uses `/api/uploads` to serve static assets on production to avoid Nginx 404 errors for direct file access.

```nginx
location /api/ {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}

# The backend handles serving uploads via /api/uploads
# No specific location block needed for /uploads if using the /api/ alias strategy.
```

---

## 🐛 Troubleshooting

### "Failed to load resource" (Images/Models 404)
*   **Cause**: Nginx is trying to serve `/uploads/...` from the React `dist` folder instead of the backend.
*   **Fix**: The code automatically rewrites URLs to `/api/uploads/...`. Ensure your backend is running and Nginx is correctly proxying `/api` to `localhost:3001`.

### Database Connection Error
*   Check `.env` file credentials.
*   Ensure MariaDB service is running (`systemctl status mariadb`).

### 500 Error on Upload
*   **Cause**: Missing database columns.
*   **Fix**: Run `scripts/migration_add_featured.sql` to add `isFeatured` column.

---

## 🤝 Contributing
1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request
