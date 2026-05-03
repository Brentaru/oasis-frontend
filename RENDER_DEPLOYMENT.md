# Oasis Frontend Render Deployment

## Render settings

- Service type: Static Site
- Root directory: leave blank if this repo is only `oasis-frontend`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`

## Environment variables

```text
VITE_API_BASE_URL=https://oasis-backend-zfr5.onrender.com/api
```

## Redirect/Rewrites

Add this rewrite so refresh works on `/dashboard`, `/library`, `/browse`, and reader routes:

```text
Source: /*
Destination: /index.html
Action: Rewrite
```

After deploying, open the frontend URL and confirm login, Browse, Library, Profile, and Reader can call the backend.
