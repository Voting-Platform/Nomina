# Project Folder Structure

This project follows a clear separation between the frontend (Client) and backend (Server).

## Root Directory Structure

```text
/pelwatte-mcc
  ├── client/        # React/Vite Frontend
  ├── server/        # Node.js/Express Backend
  └── README.md      # Main project README
```

---

## 🏗️ Backend Folder Structure (Server)

The backend is an **AI-Powered Enterprise Backend Framework** built using Node.js and Express.

```text
/server
  ├── src/
  │   ├── config/         # Configuration files (DB, Passport, etc.)
  │   ├── controllers/    # Business logic & Route handlers
  │   ├── core/           # Core system logic
  │   ├── mcp/            # Model Context Protocol implementations
  │   ├── middlewares/    # Custom Express middlewares
  │   ├── models/         # Mongoose schemas/models
  │   ├── routes/         # API Route definitions (v1)
  │   ├── services/       # Service layer for complex logic
  │   ├── utils/          # Utility functions
  │   ├── validations/    # Request validation logic using Zod/Joi
  │   └── index.js        # Entry point
  ├── bin/                # CLI/Script entry points
  ├── scripts/            # Database management/seeding scripts
  ├── tests/              # Jest test suites
  ├── Dockerfile          # Docker configuration
  ├── docker-compose.yml  # Local multi-container setup
  └── ecosystem.config.json # PM2 deployment config
```

---

## 🎨 Frontend Folder Structure (Client)

The frontend is a **modern React Dashboard** built on top of Vite and TailwindCSS.

```text
/client
  ├── src/
  │   ├── api/            # API services using Axios and TanStack Query
  │   ├── components/     # UI components
  │   │   └── chroma-components/ # Specialized reusable UI elements
  │   ├── hooks/          # Custom React hooks
  │   ├── layout/         # Layout components (Header, Sidebar, etc.)
  │   ├── lib/            # External library configurations
  │   ├── pages/          # Page-level components
  │   ├── providers/      # React Context providers
  │   ├── routes/         # Application routing configuration
  │   ├── store/          # State management (Zustand)
  │   ├── types/          # TypeScript interface definitions
  │   ├── utils/          # Common helper functions
  │   ├── App.tsx         # Root app component
  │   └── main.tsx        # React entry point
  ├── public/             # Static assets
  └── vite.config.ts      # Vite configuration
```
