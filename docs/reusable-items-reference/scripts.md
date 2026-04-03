# Scripts & Workflows

This project includes several scripts to automate common tasks, from database management to build processes.

## 🛠️ Backend Scripts (`/server`)

### Built-in NPM Scripts
- **`npm run dev`**: Runs the server in development mode using `nodemon` and `cross-env`.
- **`npm start`**: Starts the production server using PM2 (controlled by `ecosystem.config.json`).
- **`npm run lint`**: Runs ESLint to check for code quality issues.
- **`npm run prettier:fix`**: Automatically formats the codebase based on Prettier rules.
- **`npm run test`**: Executes unit and integration tests using Jest.
- **`npm run docker:prod`**: Runs the entire stack using Docker Compose with production configurations.

### Custom Utility Scripts
- **`npm run permissions`**: Executes `scripts/config-permissions.js`.
  - **Function**: Reads `permission-schema.data.json` and generates a structured `src/config/permissions.json`.
  - **Usage**: Use this when adding new modules or features to automatically generate CRUD permission strings (e.g., `module.feature.read`).
- **`npm run seeds [seeder-name]`**: Executes `scripts/run-seeds.js`.
  - **Function**: Populates the MongoDB database with initial data (users, masters, settings).
  - **Example**: `npm run seeds users master` (Seeds the initial SuperAdmin and master data).

---

## 🎨 Frontend Scripts (`/client`)

The frontend leverages **Vite** for ultra-fast development and optimized production builds.

- **`npm run dev`**: Starts the Vite development server.
- **`npm run build`**: Compiles the TypeScript code and bundles the application for production using Vite.
- **`npm run preview`**: Serves the production bundle locally for final validation.
- **`npm run lint`**: Runs ESLint to identify React and TypeScript-specific code issues.

---

## 🏗️ Workflow Best Practices

1. **Development**: Use `npm run dev` for both backend and frontend.
2. **Setup**: After cloning the repository, run `npm install` in both directories, then `npm run permissions` and `npm run seeds users master` in the server directory.
3. **Quality Control**: Always run `npm run lint` before committing major changes to ensure consistency across the project.
