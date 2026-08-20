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
DEMO_MODE=true

# External Databases
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
2. Start the development server:
   ```bash
   npm run dev
   ```
3. The application will be accessible at `http://localhost:3000/`.

## Simulated vs Real Features

**Currently Implemented:**
- **Frontend Architecture:** React, Redux Toolkit, React Router, SCSS, Webpack.
- **UI/UX Design System:** Custom styling with Holberton Red accents, Dark Mode first.
- **i18n Translation Setup:** Full, deep localization support for Azerbaijani (AZ), English (EN), and Russian (RU) across all dynamic data and structural UI.
- **Node.js Express Server:** Foundation set up for production API routing.
- **Demo Mode Architecture:** The system currently runs in `DEMO_MODE`, which uses a factory pattern to serve in-memory Mock Repositories. Real MySQL/Redis/MongoDB repository interfaces exist but are bypassed until external services are configured.
- **Strict Simulation Workflow:** The "Simulate Threat" feature triggers a full mocked workflow (Incident creation, Notification dispatch, Audit Logging, and Dashboard statistics updates) using strict Redux Thunks. Workflows enforce real-world RBAC progression (NEW -> ACKNOWLEDGED -> RESOLVED).
- **Role-Based Access Control:** Frontend routes are protected by `ProtectedRoute` and `RoleGuard` components, simulating USER, ORGANIZATION_ADMIN, and SUPERADMIN access levels.
- **Advanced Dashboard:** Accurate 24h event calculations and dynamic response times based on incident historical timestamps.

**Future Features (Not Yet Implemented):**
- **Real AI Integration:** Python + YOLOv8 + OpenCV edge service for actual threat detection.
- **Real Database Integration:** Connecting the existing repository interfaces to live MySQL, MongoDB, and Redis instances.
- **Live Video Streaming:** Replacing the CSS grid/placeholder with an actual WebRTC/HLS video stream from edge cameras.
- **Real-Time WebSockets:** Replacing Redux simulations with live Socket.IO events pushed from the server.
