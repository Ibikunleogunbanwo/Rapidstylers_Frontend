# RapidStylers Frontend

The customer, stylist, and admin web app for RapidStylers, a beauty technician appointment booking platform for Canada. This is the React application that lives at `rapidstylers.ca`. It talks to the Spring Boot API at `api.rapidstylers.ca` in production and handles the public landing page, stylist discovery, account registration, appointment booking, user dashboards, stylist operations, support, notifications, and the admin console.

## What you're looking at

This is a Create React App project built with React 18, Redux Toolkit, Tailwind CSS, MUI, Formik, Yup, and Zod. The routing is split by audience:

* `src/pages/generalPages` is the public experience: landing page, search, blog, login, password reset, stylist profile, and general content pages.
* `src/pages/users` is the client dashboard for profile management, appointments, saved stylists, cards, feedback, and support.
* `src/pages/styler` is the beauty technician experience: onboarding, profile setup, services, portfolio, availability, appointments, earnings-related views, and account settings.
* `src/pages/admin` is the platform admin console for categories, services, stylists, blog content, support, reviews, and operations.

Reusable UI and domain components live under `src/components`. Shared app state lives under `src/hooks/local`, API access is centralized in `src/hooks/remote`, and cross-page context providers live in `src/context`.

## Stack

* **React 18** with Create React App and React Router v6.
* **Redux Toolkit** for shared application state and async workflows.
* **Tailwind CSS** for utility-first styling, with project-level styles in `src/index.css`.
* **MUI 5** for selected UI primitives and form controls.
* **Formik, Yup, and Zod** for form handling and validation across legacy and newer flows.
* **Axios** for API communication through a centralized client.
* **React Toastify** for user-facing success and error messages.
* **Cloudinary upload support** through `src/utils/cloudinaryUpload.js`.
* **Google Maps / Places integration** for address capture, autocomplete, and booking distance support.
* **Jest + React Testing Library** for component and API contract tests.

Production deploys to Vercel. The backend should run separately, usually on a VPS, and be exposed through `api.rapidstylers.ca`.

## Prerequisites

* Node.js 18 or later
* npm 9+
* A running RapidStylers backend. In local development this is usually the Spring Boot API on `http://localhost:9090/rapid_stylers`.
* API key values that match the backend `.env` configuration.
* Google Maps credentials if you are testing address autocomplete or distance-based booking.

## Getting it running locally

```bash
git clone git@github.com:Ibikunleogunbanwo/Rapidstylers_Frontend.git
cd Rapidstylers_Frontend
npm install
cp .env.example .env
npm start
```

`npm start` runs the app on `http://localhost:3000` with Fast Refresh.

### Environment variables

Create `.env` from `.env.example` and fill in real values. `.env` and `.env.local` are intentionally gitignored.

```bash
# Must match APP_API_KEY in Rapidstylers_Backend/.env
REACT_APP_API_KEY=your_api_key

# Backend API base URL, including /rapid_stylers and no trailing slash
REACT_APP_API_BASE_URL=http://localhost:9090/rapid_stylers

# Must match the decrypt key expected by the backend integration
REACT_APP_DECRYPT_KEY=your_decrypt_key

# Google Maps browser key for address autocomplete and distance workflows
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key

# Google AdSense publisher ID. Leave empty until approved.
REACT_APP_ADSENSE_CLIENT=
```

Create React App also reads `.env.local`, and it can override `.env`. If local data looks different from what you expect, check both files before debugging the code.

## npm scripts

* `npm start` starts the local development server.
* `npm test` runs the Jest test runner in watch mode.
* `CI=true npm test -- --watchAll=false` runs the test suite once, which is better for verification before pushing.
* `npm run build` creates a production build in `build/`.
* `npm run eject` ejects Create React App configuration. Avoid this unless the team explicitly decides to own the full build setup.

## Project layout

```text
src/
|-- assets/                 images, videos, logos, SVG icons, animation files
|-- components/             reusable UI and domain components
|-- context/                React context providers for location and stylist signup
|-- hooks/
|   |-- local/              Redux store, reducers, and local state workflows
|   `-- remote/             Axios clients, API service methods, API contract tests
|-- pages/
|   |-- admin/              admin login, categories, blog, stylists, support, operations
|   |-- generalPages/       landing, auth, search, blog, stylist profiles
|   |-- styler/             stylist onboarding, dashboard, appointments, profile
|   `-- users/              client dashboard, appointments, account, support
|-- utils/                  constants, crypto helpers, Cloudinary helpers
|-- App.js                  route registration and lazy-loaded page entry points
|-- index.js                React app bootstrap
`-- index.css               global styles, Tailwind layers, toast styling
```

## Conventions worth following

* **API calls** go through `src/hooks/remote/apiService.js`. The Axios client attaches the shared API key and current JWT, so avoid calling Axios directly from page components.
* **Backend responses use `statusCode` in the response body.** Some failed requests may still return HTTP 200, so service methods must check app-level status codes before treating a request as successful.
* **Auth tokens** are stored in `sessionStorage` under `rapidstylers_auth_token` and attached by the API client interceptor.
* **Booking pricing** is backend-owned. The frontend can display service price, included travel distance, travel fee, and appointment total, but it should not calculate the final payable amount as the source of truth.
* **Blog content** is fetched from `/list_blog`. The public pages include fallback posts so the landing page does not break when the backend is unavailable. If Vercel shows different blog counts than localhost, confirm the deployed frontend can reach the backend before changing static content.
* **Environment files stay local.** Do not commit `.env`, `.env.local`, `.freebuff/`, agent skill folders, or machine-specific IDE files.
* **Toasts** come from React Toastify. Keep error messages surfaced through `APIService.extractError` unless a page needs a specific inline message too.

## Deployment

Vercel deploys the frontend from GitHub. Production should use:

```text
rapidstylers.ca       -> Vercel frontend
www.rapidstylers.ca   -> Vercel frontend
api.rapidstylers.ca   -> Spring Boot backend on VPS
```

Set the production environment variables in Vercel project settings:

```bash
REACT_APP_API_BASE_URL=https://api.rapidstylers.ca/rapid_stylers
REACT_APP_API_KEY=production_api_key
REACT_APP_DECRYPT_KEY=production_decrypt_key
REACT_APP_GOOGLE_MAPS_KEY=production_google_maps_key
REACT_APP_ADSENSE_CLIENT=
```

After changing environment variables in Vercel, redeploy the frontend. Vercel builds React env values into the static bundle, so updating the setting alone is not enough.

## Things that commonly trip people up

* **Localhost and Vercel show different data.** Vercel may be using fallback content because the deployed API URL or API key is missing. Check the browser Network tab for failed `/list_blog`, search, or appointment requests.
* **`.env.local` overrides `.env`.** If your local app is calling the wrong backend port, inspect both files.
* **Wrong password does not show an error.** The backend may return HTTP 200 with `statusCode: "400"` in the body, so login code must handle app-level failures.
* **CORS errors after backend deployment.** Add `https://rapidstylers.ca`, `https://www.rapidstylers.ca`, and local dev origins to the backend CORS allow-list.
* **Booking estimate looks wrong.** Confirm the stylist has base/included travel settings and that the home-service flow sends `travelDistanceKm`.

## Contributing

Keep pull requests focused. Separate styling-only changes from behavior changes when possible. Before pushing, run:

```bash
CI=true npm test -- --watchAll=false
npm run build
```

Develop on `dev`, then merge `dev` into `main` when the change is ready for production.

## Contact

Ibikunle Ogunbanwo, `ibikunleogunbanwo@gmail.com`.
