# Oasis Frontend

React web client for Oasis, a manga reading app with account login, MangaDex browsing, saved library titles, reading history, and profile management.

## Tech Stack

- React 19
- Vite 7
- React Router 7
- ESLint 9
- Render static site deployment

## Features

- Login and registration
- Protected dashboard routes
- MangaDex browse with filters
- Series details and chapter list
- Web reader
- Saved library
- Profile menu and profile management

## Project Structure

```text
src
+-- components   # Shared navigation and profile menu UI
+-- pages        # Route-level pages
+-- apiConfig.js # Backend URL helpers and fetch wrapper
+-- authSession.js
+-- readingStore.js
+-- sourceApi.js # Library and MangaDex API helpers
```

## Getting Started

Install dependencies:

```powershell
npm install
```

Create a local environment file from the example:

```powershell
Copy-Item .env.example .env.local
```

Start the development server:

```powershell
npm run dev
```

Vite will print the local URL, usually `http://localhost:5173`.

## Environment Variables

```text
VITE_API_BASE_URL=https://oasis-backend-zfr5.onrender.com/api
```

In development, if `VITE_API_BASE_URL` is not set, the app uses `/api`. In production, it falls back to the Render backend URL above.

## Available Scripts

```powershell
npm run dev      # Start Vite locally
npm run build    # Build production assets into dist
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```

## Routes

- `/login`
- `/register`
- `/dashboard`
- `/browse`
- `/library`
- `/library/:seriesId`
- `/reader/:seriesId/:chapterId`
- `/profile`

Unauthenticated users are redirected to `/login`; authenticated users are redirected away from public auth pages to `/dashboard`.

## Deployment

This project includes `render.yaml` for Render static site deployment.

Render settings:

- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_BASE_URL`
- Rewrite: `/*` to `/index.html`

See `RENDER_DEPLOYMENT.md` for the manual deployment checklist.
