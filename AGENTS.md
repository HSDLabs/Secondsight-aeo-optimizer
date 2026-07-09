# Repository Guidelines

## Project Structure & Module Organization

SecondSight GEO Optimizer is a Vite React app with a Node/Express API. Frontend source lives in `src/`: shared UI in `src/components`, layout shell in `src/layout`, route views in `src/pages`, hooks in `src/hooks`, utilities in `src/utils`, and CSS in `src/styles` plus page-specific styles. Static assets are in `public/`. Backend entrypoint and API routes live in `server/index.js` and `server/routes/`; crawler, intelligence, and page-analysis logic is organized under `server/services/`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev:all`: run the Vite client and nodemon API server together.
- `npm run dev`: start only the Vite frontend at `http://localhost:5173`.
- `npm run server`: start only the backend with nodemon on port `3001`.
- `npm run build`: create a production frontend build in `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint across the repository.

There is currently no `npm test` script; use linting, build checks, and targeted smoke testing when changing behavior.

## Coding Style & Naming Conventions

Use modern ES modules throughout. React components use PascalCase filenames and exports, such as `CrawlerAccess.jsx`; hooks use `useSomething` naming; plain helpers use camelCase. Keep page-specific modules close to their route folder under `src/pages`. Prefer small, focused service functions in `server/services` and route handlers in `server/routes`.

Follow the existing two-space JSON style and React JSX formatting. ESLint is the project’s main style gate, so run `npm run lint` before handing off changes.

## Testing Guidelines

No formal test framework is configured yet. For frontend changes, run `npm run dev:all` and manually exercise the affected page. For backend crawler or external intelligence changes, smoke test the related route and inspect server logs. If adding tests later, colocate them near the code they cover and use descriptive names like `crawlerUtils.test.js` or `sitemapParser.test.js`.

## Commit & Pull Request Guidelines

Recent history uses short, imperative summaries such as `configured for deployment` and `fixed bugs`; prefer clearer imperative messages like `Add combined dev script` or `Fix crawler settings fallback`. Pull requests should include a concise description, testing performed, linked issues when relevant, and screenshots for visible UI changes.

## Security & Configuration Tips

The server reads environment variables from `.env` and `server/.env`. Do not commit API keys or secrets. When changing configuration, document required variables and keep defaults safe for local development.

