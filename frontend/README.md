# Frontend

Static Next.js app for F1 Weather Resilience. Historical NOAA ISD profiles are loaded from `public/data/app.json`. The weekend optimizer runs in the browser, so this folder can be exported to GitHub Pages.

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # writes ./out
```

GitHub Pages uses `NEXT_PUBLIC_BASE_PATH=/<repo-name>` during CI. See the root README for deploy steps.
