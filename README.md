<p align="center">
  <img src="https://avatars.githubusercontent.com/u/315996143?s=240&v=4" alt="Synapse Racing" width="112" />
</p>

<h1 align="center">Synapse Racing — Frontend</h1>

<p align="center">
  3D racing platform with AI training, garage customization, and real-time multiplayer.
</p>

<p align="center">
  <a href="https://github.com/synapse-racing">github.com/synapse-racing</a>
</p>

---

React 19 + Three.js application for Synapse Racing. Ships a full NEAT AI training environment, a 3D garage to customize vehicles, and a multiplayer racing mode — all in the browser with no native dependencies.

## Requirements

- Node.js 24 or higher
- Corepack enabled (`corepack enable`)
- Backend running on `http://localhost:3000` (see [synapse-backend](../synapse-backend))

## Installation

```bash
corepack enable
pnpm install
```

Copy the environment template and adjust the API URL if the backend runs on a different port:

```bash
cp .env.example .env
```

```text
# .env
VITE_API_URL=http://localhost:3000/api
```

> In development, Vite proxies both `/api` and `/socket.io` to `http://localhost:3000`, so
> you only need the `VITE_API_URL` variable in production builds. The production Docker
> image serves the SPA through Nginx, which proxies the API under the same origin.

## Scripts

| Command | Description |
|---|---|
| `pnpm dev` | Start the Vite dev server at `http://localhost:5173` |
| `pnpm build` | Type-check and bundle for production |
| `pnpm preview` | Serve the production bundle locally |
| `pnpm lint` | Run oxlint across all source files |
| `pnpm test` | Run the full Vitest suite (jsdom) |
| `pnpm test:watch` | Watch mode for Vitest |
| `pnpm build:vehicles` | Export vehicle GLB assets from source scripts |

## Project Structure

```
src/
├── app/                  # Root providers (router, query client, auth context)
├── assets/               # Static assets (fonts, images, models)
├── features/
│   ├── auth/             # Registration, login, session restoration, logout
│   ├── garage/           # 3D vehicle customizer (model, paint, finish, number)
│   ├── training/         # NEAT AI training environment
│   │   ├── neat/         # Core algorithm (genome, genes, species, crossover, mutation)
│   │   ├── simulation/   # Physics loop, checkpoint crossing, race contract
│   │   ├── components/   # HUD, leaderboard, minimap, telemetry, fitness chart
│   │   ├── persistence/  # Save/load training runs (authenticated & guest)
│   │   └── api/          # REST client for training-runs endpoints
│   └── multiplayer/      # Lobby, race, results (Socket.IO)
├── pages/                # Top-level routable pages
├── shared/
│   ├── api/              # Axios instance, token interceptors
│   ├── config/           # Runtime environment config
│   ├── game/             # Shared 3D components (camera, speed control, car actions)
│   └── three/            # Three.js helpers, vehicle rigs, race camera
└── test/                 # Vitest setup and shared test utilities
```

## Features

### Authentication

JWT-based auth with rotating refresh tokens. The access token lives exclusively in memory; the refresh token is stored in an `HttpOnly` cookie and its hash is persisted server-side with Argon2id. Guests can train and play without an account; progress can be imported on registration.

### Garage

Interactive 3D showroom where players configure their car before a race. Supports multiple body models (loaded as `.glb` files), paint color, finish type (matte, gloss, metallic), and race number. Appearance is saved to the user's account via `PATCH /api/users/me/appearance` and restored on every session.

### NEAT Training (`/training`)

Browser-native implementation of the NEAT algorithm:

- Population of 24 feed-forward neural networks driving cars around a procedurally generated circuit
- Full speciation, compatibility thresholds, elitism, structural mutations, and crossover
- Seeded PRNG for deterministic replay
- Training runs and generation snapshots are persisted to the backend after each generation; any run can be resumed from its latest checkpoint, restoring population, PRNG state, and innovation history exactly
- HUD includes a live leaderboard, 2D minimap with 60 FPS car markers (direct SVG DOM mutation, zero React re-renders), telemetry panel with raycast visualization, and a generation fitness history chart

### Multiplayer (`/multiplayer`)

Private rooms for up to 64 players via Socket.IO. The backend runs the authoritative simulation at 20 Hz and broadcasts race snapshots at 10 Hz; the client interpolates car positions inside the shared 3D track.

## Tech Stack

| Layer | Library / Tool |
|---|---|
| UI | React 19, React Router 7 |
| 3D | Three.js 0.185, React Three Fiber 9, Drei 10 |
| State | TanStack Query 5, React Hook Form 7 |
| Validation | Zod 4 |
| Realtime | Socket.IO Client 4 |
| Build | Vite 8, TypeScript 6 |
| Lint | oxlint |
| Test | Vitest 4, Testing Library 16, jsdom |

## Docker

The `Dockerfile` builds a production image with an Nginx server. It serves the SPA, falls back all unknown routes to `index.html`, and proxies `/api` and `/socket.io` to the backend container.

```bash
docker build -t synapse-frontend .
docker run -p 80:80 synapse-frontend
```

See the backend repository for the full `compose.prod.yaml` stack.
