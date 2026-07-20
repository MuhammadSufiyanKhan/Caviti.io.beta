# Caviti.io.beta

Caviti is an AI-powered market intelligence platform for discovering customer pain points, identifying competitor weaknesses, and turning those insights into high-converting ad angles. The app combines a polished landing experience, Supabase-backed authentication, AI-heavy analysis pipelines, and an admin dashboard to help users transform public product information into actionable market intelligence.

## What this project does

The application currently supports:

- A public marketing experience for introducing the product
- User sign-up, sign-in, and account management through Supabase
- A dashboard where users can submit a product name or URL and run an analysis
- AI-generated reports with market gaps, insight summaries, and confidence scoring
- Billing and trial-based access flows
- An admin area for managing users, reports, payments, plans, notifications, and settings

## Core user flow

1. A visitor lands on the marketing site.
2. They create an account or sign in.
3. From the dashboard, they enter a product name or public URL.
4. The app scrapes the target content and enriches it with external intelligence sources.
5. An AI analysis is generated and stored as a report for the user.
6. The user can review, delete, and manage their reports from the dashboard.

## Tech stack

- Next.js 16 with the App Router
- React 19 and TypeScript
- Tailwind CSS for styling
- Supabase Auth and Postgres-backed data access
- Groq and OpenAI for AI analysis
- SerpAPI, Firecrawl, and Apify-based enrichment workflows
- Resend for transactional email delivery
- Framer Motion and Three.js for UI animation and visuals

## Project structure

```text
src/
  app/
    admin/              # Admin authentication and admin dashboard UI
    api/                # Route handlers for analysis, auth, reports, invoices, and admin actions
    auth/               # Auth-related pages and callback flows
    dashboard/          # User dashboard pages and report views
    login/              # Sign-in page
    signup/             # Sign-up page
    page.tsx            # Landing page
  components/          # Reusable UI components
  context/             # React context providers
  lib/                 # AI analysis, scraping, email, and OTP utilities
  types/               # Shared TypeScript types
  utils/supabase/      # Supabase browser and server clients
supabase/             # SQL schema and policy definitions
public/               # Static assets such as images and favicons
scripts/              # Helper scripts
```

## Prerequisites

Before running the app locally, make sure you have:

- Node.js 20 or newer
- npm
- A Supabase project
- API keys for the services used by the app:
  - Groq or OpenAI
  - SerpAPI
  - Firecrawl
  - Resend
  - Optional: Apify

## Environment configuration

Create a file named `.env.local` in the project root and add values similar to the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
OPENAI_API_KEY=your_openai_api_key_optional
SERPAPI_KEY=your_serpapi_key
FIRECRAWL_API_KEY=your_firecrawl_key
RESEND_API_KEY=your_resend_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=your_admin_email@example.com
APIFY_API_KEY=your_apify_key_optional
```

> Keep secrets out of version control. The repository is configured to ignore environment files and build artifacts.

## Installation

```bash
npm install
```

## Running locally

Start the development server:

```bash
npm run dev
```

Then open:

- http://localhost:3000

## Available scripts

```bash
npm run dev        # start development server
npm run build      # create production build
npm run start      # run production build locally
npm run lint       # run ESLint
npm run type-check # run TypeScript type checks
npm run format     # format source files with Prettier
```

## Main application areas

### Landing page
The landing page is the public entry point and explains the product’s value proposition with a visually rich UI.

### Authentication
Authentication is handled through Supabase and includes:

- user sign-up
- email verification flows
- sign-in
- password reset support

### Dashboard
Users can:

- enter a product name or URL
- run a market analysis
- view report history
- delete reports
- monitor remaining trial usage

### Admin dashboard
The admin interface is located under `/admin` and `/admin/dashboard`. It provides tools for:

- viewing analytics and activity
- managing users
- reviewing reports and analysis logs
- handling notification and message workflows
- managing plans, payments, and system settings

## API surface

The app exposes several internal API routes under `src/app/api`, including:

- `/api/analyze` — main analysis pipeline
- `/api/analyze-serpapi` — SerpAPI-backed analysis flow
- `/api/fetch-real-reviews` — review extraction and enrichment
- `/api/generate` — generation workflows
- `/api/send-invoice` — invoice delivery logic
- `/api/admin/*` — admin-only operations
- `/api/reports` — report CRUD operations

## Database and storage

The project uses Supabase for authentication and database-backed records. The SQL files in the `supabase/` directory contain schema and policy definitions for:

- user profiles
- admin access rules
- reports
- dashboard-related data

## Deployment

This project is well suited for deployment on Vercel or another Node.js hosting service.

Recommended deployment steps:

1. Connect the repository to your hosting platform.
2. Set all environment variables in the platform dashboard.
3. Use the build command:

```bash
npm run build
```

4. Deploy and verify that the Supabase and AI provider credentials are available in production.

## Notes and considerations

- Some analysis features depend on external services and may fail if the corresponding API keys are missing.
- The product experience is currently tailored for a SaaS-style workflow with trial-based access.
- The admin and dashboard sections assume that the Supabase project is configured correctly and that the required tables and policies exist.

## Contributing

If you want to extend the project:

- keep UI changes aligned with the existing dark, high-contrast visual system
- preserve the Supabase auth integration when adding new user-facing flows
- update API route logic carefully when introducing new analysis services
- keep environment-based configuration centralized in `.env.local`
