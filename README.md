# ISMP — Intelligent Security Monitoring Platform

ISMP transforms passive CCTV monitoring into an active AI-assisted incident-management system. It uses YOLO models at the edge to detect threats (such as firearms) and securely transmits alerts and evidence to a central web platform for immediate response.

## Architecture

- **Frontend:** React, Redux Toolkit, React Router, SCSS, Webpack
- **Backend:** Node.js, Express.js
- **Databases:** MySQL (business logic), MongoDB (telemetry), Redis (caching, live states)
- **Realtime:** Socket.IO / WebSockets
- **Edge Service (Future):** Python + YOLOv8 + OpenCV

## Setup and Installation

### Prerequisites

- Node.js (v18+)
- MySQL, MongoDB, Redis servers running locally or remotely.
- On Windows, we recommend using Docker Desktop or WSL2 to run the databases.

### Environment Variables

Copy `.env.example` to `.env` and fill in the details:

```env
PORT=3000
NODE_ENV=development
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=root
MYSQL_DB=ismp
MONGO_URI=mongodb://localhost:27017/ismp
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
```

### Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server (runs both Backend and Webpack Dev Middleware):
   ```bash
   npm run dev
   ```

3. The application will be accessible at `http://localhost:3000/`.

### Windows Setup Considerations

If running on Windows without WSL:
- Install Redis using a Windows port or Docker.
- Start Node scripts via standard Git Bash or Command Prompt.
- Do not use Linux-specific shell commands in scripts without cross-platform tools like `cross-env`.

## Future Python Detector Integration

The prototype currently relies on a simulated threat detection panel on the frontend. The real detector will act as an edge device and push events via REST.

**Expected Contract:**

```http
POST /api/cameras/:id/heartbeat
Content-Type: application/json

{
  "status": "ONLINE",
  "engine": "YOLOv8"
}
```

```http
POST /api/incidents
Content-Type: application/json

{
  "cameraId": "demo-camera",
  "type": "weapon",
  "confidence": 0.94,
  "timestamp": "2026-08-20T10:30:00Z"
}
```

## Simulated vs Real Features

**Implemented (Real):**
- Frontend Architecture (React, Redux, SCSS, Router)
- Webpack build system
- UI/UX Design System (Holberton Red, Dark Mode)
- i18n Translation Setup (AZ, EN, RU)
- Node.js Express server foundation

**Simulated (Demo):**
- The backend features a full **`DEMO_MODE` fallback architecture**. By default, it runs with in-memory seeded repositories.
- If `DEMO_MODE=true` or database connection strings are absent, it bypasses the connection attempts and uses temporary data.
- The real repository implementations for MySQL, MongoDB, and Redis exist alongside the mock ones under `/backend/repositories` and will be activated once credentials are supplied.
- Auth is mocked for demo UI traversal.
- YOLO detection is simulated via the "Simulate Threat" button in Live Monitoring.
- Database connections are mocked with static frontend states and backend memory until full ORM integration is enabled.
