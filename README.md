# Project Rebuild

This project was rebuilt on 2026-02-10 with a new architecture.

## Structure
- `client/`: New React + TypeSript + Vite frontend
- `server/`: Java Spring Boot backend (requires Java 17+ and Maven)
- `_legacy/`: Archived backup of the previous codebase

## Getting Started
1. **Frontend**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

2. **Backend** (Requires Java):
   ```bash
   cd server
   ./mvnw spring-boot:run
   ```
