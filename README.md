# Genesys RPG Manager (Self‑Hostable)

This repository contains a self‑hostable web application for managing Genesys RPG character sheets and game data.  It is built with Next.js (App Router) and TypeScript on the front‑end and uses Prisma ORM with a PostgreSQL database on the back‑end.  The design draws inspiration from Genesys Emporium’s dense card‑based layout and emphasises inline editing, optimistic updates and flexible filtering.

## Features

* **Characters** – Create, view and edit characters with full CRUD.  Inline editing autosaves fields on blur.  Each update automatically creates a version snapshot and stores it in the database.  Up to 100 versions are retained per character.  A built‑in version history viewer shows timestamps, computed diffs and allows restoring a past version with a click.
* **Items, Talents & Skills** – Full CRUD interfaces for game content.  Lists support inline editing and deletion, search by name and advanced filtering (e.g., by item type, rarity, skill characteristic or talent tier).  Users can save their favourite filter combinations as **saved views** and reapply them later.  Edit and delete actions are only available to authorised roles (Owners and GMs).  All changes are recorded in the audit log.
* **Import & Export** – Import wizard accepts CSV or JSON files for characters, items, talents and skills.  Users map file columns to internal fields, preview a few rows and import.  Exports are available in JSON or naive CSV for each entity.  Character pages also include a print‑friendly view for generating PDFs via the browser.
* **Settings** – System toggles (enable/disable Obligation, Duty, Morality), domain toggles (enable/disable Items, Weapons, Talents, etc.), SMTP configuration, theme and locale.  Settings persist in the database and can be modified via a form.  A test email button is stubbed for future implementation.
* **Audit Log** – A dedicated Audit Log page lists recent actions (create, update, delete) across all entities.  Entries show who performed the action, what was affected and when, with the ability to expand and view the JSON diff for each change.  Filtering by entity type is supported.
* **Role‑Based Access Control** – Users authenticate via a simple email login.  The first user becomes the `OWNER`, while subsequent users are `PLAYER`s by default.  Additional roles (`GM`, `VIEWER`) can be assigned in the database.  API routes enforce permissions on every request: Owners and GMs can manage all data, players can edit only their own characters and view others, and viewers have read‑only access.  The UI stores the user ID and role in local storage and includes them on every request via the `X‑User‑Id` header.
* **Saved Views** – On the Items, Talents and Skills pages, users can combine search terms and filters (e.g., item type, rarity, talent tier, skill characteristic) and save them as named **views**.  These saved views persist in the browser’s local storage and can be applied or deleted with a single click.
* **PDF Export** – Character detail pages include a “Download PDF” button that generates a server‑side PDF of the character sheet using `@react-pdf/renderer`.  The exported PDF includes the character’s name, credits, encumbrance, characteristics and derived stats.

* **Dice Roller** – A dedicated Dice Roller page lets you build a Genesys narrative dice pool (boost, setback, ability, proficiency, difficulty, challenge and force dice) and roll it client‑side.  The results show successes, failures, advantages, threats, triumphs, despairs and their net totals.  If you upload a narrative dice font via the Setup wizard, the roller can render symbols using that font.

* **Setup Wizard** – On first launch, if the application detects that a narrative dice font is missing or SMTP credentials have not been configured, it redirects the administrator to a Setup wizard.  The wizard prompts for uploading a proprietary Genesys dice font (if licensed) and flags missing SMTP configuration.  Once completed, the wizard sets a `setupComplete` flag and allows normal use.  Uploaded fonts are stored in a dedicated Docker volume so they persist across container rebuilds.
* **API** – RESTful route handlers under `/api/characters`, `/api/items`, `/api/talents`, `/api/skills`, `/api/import`, `/api/export` and `/api/audit` provide JSON data to the React front‑end.  Each modification triggers an audit entry and a version snapshot when applicable.
* **Prisma Schema & ERD** – A comprehensive data model with unique constraints and relations is defined in `prisma/schema.prisma` and visualised in the `specs/erd_prisma.md` document.  It covers users, characters, skills, talents, items, qualities, adversaries, sessions/XP, sharing, audit logging and settings.
* **Docker & Compose** – Multi‑stage Dockerfile builds a production Next.js app.  Docker Compose orchestrates the app, a PostgreSQL 16 database and a backup service that performs nightly `pg_dump`s and retains the last few backups.  Named volumes separate database data and uploaded portraits/exports/fonts, while the backups directory is bind‑mounted into the containers.

## Quick Start (Development)

1. **Install dependencies** (requires Node.js ≥ 18):

   ```bash
   cd webapp
   npm install
   ```

2. **Configure environment variables** by copying `.env.example` to `.env` and adjusting values as needed.  At minimum, set `DATABASE_URL` to point to your PostgreSQL instance and assign a `DEFAULT_OWNER_ID` to an existing user.

3. **Run database migrations and generate the Prisma client**:

   ```bash
   npx prisma migrate dev --name init
   npx prisma generate
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`.

## Deployment on Unraid using the Docker Compose plugin

These instructions assume you have an Unraid server with the Community Applications plugin installed.  Unraid ships with Docker support by default, but `docker compose` functionality requires an additional plugin.

### 1. Install the Docker Compose Manager plugin

1. In Unraid’s web UI, open **Apps** and search for **Docker Compose Manager**.  Install the plugin from the Community Applications store.  This plugin adds the `docker compose` CLI and a new **Compose** tab to the Docker page.
2. Once installed, go to **Docker → Compose** (the tab appears at the bottom of the Docker page) and click **Add Stack**.

### 2. Prepare your project directory

Unraid stores persistent data under `/mnt/user/appdata`.  It’s good practice to create a dedicated folder for each stack.  For example:

```bash
mkdir -p /mnt/user/appdata/genesys
cd /mnt/user/appdata/genesys
```

Copy the contents of the `webapp` directory from this repository into this folder (or clone the repository here).  In this folder you should have `docker-compose.yml`, `Dockerfile`, `prisma/`, `public/` and `src/` among others.

### 3. Create an environment file

The compose plugin allows you to reference an external `.env` file.  Create a file called `unraid.env` (see the `unraid.env.example` provided in this repository for guidance) and fill in the required variables:

- `DATABASE_URL` – Use the hostname `db` and credentials defined in the compose file (e.g., `postgresql://genesys:genesys@db:5432/genesys?schema=public`).
- `DEFAULT_OWNER_ID` – Leave as the all‑zero UUID on first run; after the first user registers, update this to the new user’s ID.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` – Optional; used for sending magic links and test emails.
- `SMTP_TLS` – `true` or `false` depending on your mail server.
- `BACKUP_RETENTION_DAYS` – Number of nightly backups to keep.

### 4. Define the stack in Compose Manager

1. In the **Add Stack** dialog, give the stack a name such as `genesys`.
2. Copy the contents of `docker-compose.yml` into the **Compose File** field.  This file defines three services: `db` (PostgreSQL 16), `app` (the Next.js application) and `backup` (nightly database dumps).  It declares named volumes for persistent database data and uploaded portraits/exports/fonts, plus a bind‑mount for backups.
3. In the **Environment File** field, select the `unraid.env` file created earlier.
4. Click **Save** to create the stack.  You can now start, stop or update it from the Compose Manager UI.

### 5. Start the stack

From the **Compose** page, click **Start** next to your `genesys` stack.  Unraid will pull the Postgres image, build the application image from the Dockerfile and start all services.  The web app will be available on port 3000 of your server.  The database will listen on port 5432.

### 6. Additional notes

- **Backups:** The `backup` service automatically runs `pg_dump` every 24 hours and keeps the last few backups in the `backups` directory (which is bind‑mounted into the `db` and `backup` containers).  Adjust this behaviour by editing the `entrypoint` in `docker-compose.yml` or by setting `BACKUP_RETENTION_DAYS` in your environment file.
- **Updating:** To update your stack, stop it from the Compose UI, pull the latest code into `/mnt/user/appdata/genesys`, then click **Update** or run `docker compose pull`/`docker compose up -d` from the command line.
- **Persistent storage:** Named volumes (`dbdata`, `portraits`, `exports` and `fonts`) map to directories under `/var/lib/docker/volumes` by default, while the `backups` directory is a bind‑mount within your project folder.  You can customise these paths by editing the `volumes` section of `docker-compose.yml`.
- **Reverse proxy:** For external access with HTTPS, configure a reverse proxy (e.g., SWAG, Nginx Proxy Manager or Traefik) to forward traffic to port 3000 on your server.

## Deployment on Render.com

Render is a platform‑as‑a‑service (PaaS) that can build and run containerised applications directly from a Git repository.  Two deployment approaches are supported: building from your `Dockerfile` or using Render’s native Node.js runtime.  Because this project already includes a Dockerfile, we recommend the Docker approach.

### 1. Prepare the repository

Ensure your project is hosted in a Git repository (e.g., GitHub).  Commit all application files, including `Dockerfile`, `docker-compose.yml`, `prisma` migrations and the `src` code.  Push these changes to your remote repository.

### 2. Create a Postgres database

In your Render dashboard, click **New → Database** and create a Postgres instance.  The free tier offers 256 MB of RAM and up to 100 connections, which is sufficient for a small gaming group.  Once created, copy the **Internal Database URL** (e.g., `postgres://<username>:<password>@<hostname>:5432/<db>`).  You will use this as your `DATABASE_URL` environment variable.

### 3. Deploy the app using Docker

1. Click **New → Web Service**, connect your repository and select the branch you want to deploy.
2. On the **Configure Web Service** page, set **Runtime** to **Docker**.  Render will detect your `Dockerfile` and build the image accordingly.
3. Specify any build arguments or custom commands if necessary (optional).  The default `CMD` in the Dockerfile starts the Next.js production server.
4. Under **Environment**, add the following variables:
   - `DATABASE_URL` – Use the internal connection string from your Render Postgres database.
   - `DEFAULT_OWNER_ID` – All‑zero UUID on first deploy; update later if needed.
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_TLS` – If you plan to send emails.
   - `BACKUP_RETENTION_DAYS` – Optional if you implement your own backup service.
5. Choose a plan: the free plan provides 0.1 CPU and 512 MB of RAM; this suffices for low‑traffic hobby use.  For higher concurrency, choose the Starter plan (0.5 CPU, 512 MB RAM) or higher.
6. Click **Create Web Service**.  Render will build your image using BuildKit and deploy it.  Subsequent pushes to the selected branch will trigger automatic redeploys.

### 4. Alternative: native Node.js runtime

If you prefer not to maintain a Dockerfile, you can deploy using Render’s native Node.js environment:

1. Create a **Web Service** and set the runtime to **Node.js**.
2. Set the **Build Command** to `npm install && npm run build`.
3. Set the **Start Command** to `npm run start`.
4. Configure environment variables as described above.
5. Render will provision and manage the runtime, but you may need to adjust for differences in file system paths and environment management.

### 5. Limitations and notes

- The free instance on Render sleeps after periods of inactivity, which may introduce cold starts when players return.
- Render does not automatically run `docker-compose.yml` files, so the `db` and `backup` services defined there are not used.  Use Render’s managed Postgres instead and rely on Render’s built‑in daily backups or schedule your own.


## Ops Runbook

### Backup & Restore

* **Manual Backup:** Run `docker-compose exec db pg_dump -U genesys genesys > backup.sql` to create an on‑demand backup.  Store the resulting file securely.
* **Manual Restore:** Copy your backup into the `db` container and run `docker-compose exec db psql -U genesys genesys < backup.sql` to restore.
* **Nightly Backups:** The `backup` service automatically produces nightly dumps in `/backups`.  The script keeps the seven most recent files.

### Updating Containers

1. Stop the application: `docker-compose down`.
2. Pull the latest code and rebuild: `git pull` then `docker-compose build`.
3. Apply database migrations: `docker-compose run --rm app npx prisma migrate deploy`.
4. Restart services: `docker-compose up -d`.

### Troubleshooting

* **Application fails to start:** Ensure that the database is reachable and that `DATABASE_URL` is correct.  Check the logs with `docker-compose logs app`.
* **Database errors on migration:** Run `npx prisma validate` to ensure your Prisma schema is valid.  You may need to reset your local database (`docker volume rm webapp_dbdata`) during development.
* **Email not sending:** Confirm that SMTP settings are correct in your `.env` file.  Use a tool like [MailHog](https://github.com/mailhog/MailHog) during development to catch outgoing mail.

## Cloud Deployment & Cost Guide

Although this application is designed for self‑hosting on Unraid, it can be deployed on a variety of cloud providers.  This section outlines several options, provides approximate costs and highlights available free tiers.  Prices are subject to change; consult each provider’s documentation for the latest information.

### DigitalOcean Droplets (IaaS)

DigitalOcean’s Basic Droplets offer predictable pricing.  As of 2022 a 1 GB RAM, 1 vCPU Droplet with 25 GB of SSD storage and 1 TB of transfer costs around **$6/month**, while larger instances scale to about $12/month for 2 GB RAM and $18/month for 3 GB RAM.  To deploy:

1. Create a Droplet running Ubuntu and size it according to your expected user count.
2. Install Docker and Docker Compose.
3. Clone this repository and configure your environment variables (`DATABASE_URL`, `DEFAULT_OWNER_ID`, SMTP, etc.).
4. Run `docker-compose up -d --build` to start the application and database.

DigitalOcean’s App Platform also supports containerised apps with a free tier for static sites, but always‑on services require paid plans.

### Render.com (PaaS)

Render offers a managed platform with a generous free tier.  A free Web Service provides **512 MB RAM and 0.1 CPU** at **$0/month**, while the Starter plan offers **512 MB RAM and 0.5 CPU** for about **$7/month**.  Render also provides a managed Postgres database with a free 256 MB tier and up to 100 connections.  For step‑by‑step deployment instructions, see the **Deployment on Render.com** section above.  Be aware that free services may sleep after periods of inactivity.

### Vercel / Netlify (Serverless)

Serverless platforms like Vercel and Netlify excel at front‑end deployments.  Vercel’s Hobby plan is free and suitable for Next.js applications, offering generous bandwidth and invocation allowances, while paid plans start around **$20 per user per month**.  To deploy this project you would configure API routes as serverless functions and connect to an external Postgres service (e.g., Supabase).  Be aware of cold starts and per‑invocation costs on free tiers.

### Railway & Other Platforms

Other PaaS providers like Railway, Fly.io and Northflank provide simple Git‑based deployments.  Railway’s free developer tier has been phased out; paid plans start at around **$5/month**.  Some platforms (e.g., Northflank and Fly.io) offer always‑on free tiers with static IPs, while others (e.g., DigitalOcean’s App Platform and Coolify) provide limited free offerings.  Evaluate whether your chosen platform’s free tier allows continuous uptime and whether static IP addresses are required for external integrations.

### Selecting a Provider

For a small gaming group (up to ~20 concurrent users) a single 1–2 GB instance on a provider like DigitalOcean or a free tier on Render is usually sufficient.  PaaS offerings simplify deployment at the cost of higher per‑resource pricing.  Serverless platforms are ideal for front‑end‑heavy workloads but may require additional services for stateful databases.  Free tiers are excellent for testing and hobby projects but often come with inactivity timeouts or usage limits.

## Acknowledgements

This project is inspired by Genesys Emporium and is intended for personal use by gaming groups.  It uses only open‑source libraries compatible with self‑hosting.  The data model and UI have been designed specifically for the Genesys narrative dice system using publicly available information about derived statistics.
