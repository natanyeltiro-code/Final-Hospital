# Project Structure

This project is split into a Vite React frontend and an Express/MySQL backend.

```text
.
├── api/                  # Vercel serverless entry points
├── backend/
│   ├── config/           # Backend configuration, including database connection
│   ├── database/         # SQL setup/schema files
│   ├── middleware/       # Express middleware
│   ├── routes/           # Extracted backend route modules
│   ├── scripts/
│   │   ├── checks/       # Database inspection/debug scripts
│   │   ├── maintenance/  # Data repair/update scripts
│   │   ├── setup/        # Setup, seed, and migration scripts
│   │   └── tests/        # Manual backend/API test scripts
│   └── server.js         # Main Express app entry point
├── public/               # Static frontend assets
├── scripts/              # Root-level helper scripts
└── src/
    ├── assets/           # Frontend images and SVG assets
    ├── components/       # Reusable React components
    ├── pages/            # Page/dashboard-level React views
    ├── services/         # API clients and external service wrappers
    └── utils/            # Shared frontend utility functions
```

## Main Commands

```bash
npm run dev       # Start frontend and backend together
npm run build     # Build the frontend
npm run lint      # Run lint checks
```

Backend-only commands can be run from the `backend` folder:

```bash
cd backend
npm start
npm run migrate
```

## Notes

- Keep production backend code in `backend/server.js`, `backend/routes`, `backend/middleware`, and `backend/config`.
- Put one-off database/debug files under `backend/scripts` instead of the backend root.
- Put schema files under `backend/database`.
- Keep reusable frontend UI under `src/components`, page-level views under `src/pages`, API clients under `src/services`, and shared helpers under `src/utils`.
