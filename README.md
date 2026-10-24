# Aaly Beirut Operations

Standalone company operations application with Arabic and English interfaces, Engineer / Manager / Seller access, overseas order stages, raw and cooked materials, sales and offers, accounting, contacts, documents, bank checklist review, and activity logs.

This is the **self-hosted source distribution**, ready to place at the root of a private GitHub repository. It runs on Node.js 24 or a Linux Docker server. It does not require a ChatGPT account, Sites, Cloudflare D1, or R2 at runtime.

**Start here in Arabic:** [دليل التشغيل والنشر](docs/SELF_HOSTING_AR.md).

## What is included

- Full application source and locked dependency versions.
- Native Node server, SQLite database, private uploaded-file storage.
- Server-side permissions, salted scrypt password hashes, expiring HttpOnly sessions, login throttling, and same-origin write checks.
- Dockerfile, Docker Compose, optional Caddy HTTPS reverse proxy.
- GitHub Actions build and integration checks.
- Backup command and restoration instructions.
- Three illustrated Arabic user manuals in `docs/manuals/`.

The package contains **no live company database, no production credentials, and no uploaded business files**. It initializes an empty workspace. Demonstration records are clearly marked sample data. Read [migration notes](docs/MIGRATION.md) before moving existing business records.

## Quick start with Docker

Install Docker Engine with the Compose plugin, or Docker Desktop on Windows. Open a terminal inside this folder:

```sh
cp .env.example .env
docker compose build
docker compose run --rm -it app node scripts/setup.mjs
docker compose up -d
```

On Windows PowerShell use `Copy-Item .env.example .env` for the first command.

The setup command asks for your engineer email and three different role passwords. No password is preconfigured. Open **http://localhost:3000**.

Sign in using the account email, selected role, and that role's password:

- Engineer: the email supplied during setup.
- Manager: `manager@aaly.local`.
- Seller: `seller@aaly.local`.

The engineer can create named staff account emails under System settings. These are application identifiers; email delivery or verification is not configured. Passwords are shared by role as requested. Someone with a role's password and a permitted account identifier can sign in as that account; this is not individual-password identity assurance.

## Publish on a VPS with HTTPS

This deployment is designed for **one application instance with local persistent storage**. Do not share the SQLite directory over a network filesystem or run multiple replicas against it. It is not a static GitHub Pages site or an ephemeral serverless deployment.

1. Point a domain A/AAAA record to your VPS. Open inbound TCP ports 80 and 443.
2. Set `DOMAIN` and `ACME_EMAIL` in `.env`.
3. Build and initialize as above.
4. Start the HTTPS composition:

```sh
docker compose -f compose.yaml -f compose.https.yaml up -d --build
```

Caddy obtains and renews HTTPS certificates. The HTTPS override sets the trusted origin to `https://DOMAIN` and secure cookies to true. The application port remains bound to loopback on the host.

If using an existing reverse proxy, use `compose.yaml`, set `APP_ORIGIN=https://your-domain` and `COOKIE_SECURE=true`, and forward requests to `127.0.0.1:3000`. Keep the exact origin without a trailing slash.

## Run without Docker

Use Node.js 24.x and the pnpm version declared in package.json:

```sh
corepack enable
corepack pnpm install --frozen-lockfile
cp .env.example .env
npm run setup
npm run build
npm start
```

For development use `npm run dev`. For a VPS, use a process manager or systemd and an HTTPS reverse proxy. Set `DATA_DIR` to an absolute persistent path writable by the application user.

## GitHub

Create an empty private repository on GitHub. From this extracted folder:

```sh
git init
git add .
git commit -m "Initial Aaly Beirut standalone application"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Replace the remote URL with your own. `.gitignore` excludes secrets, uploads, database files, build output, and backups. Do not force-add them. The CI workflow tests and builds the code; it does not automatically deploy or store server credentials.

## Update

Back up first. Pull your reviewed changes, then run:

```sh
docker compose -f compose.yaml -f compose.https.yaml up -d --build
```

For a local HTTP deployment omit the HTTPS override. The named `aaly_data` volume persists across rebuilds. Database migrations apply at first database access and are recorded; do not edit migrations that were already applied. Do not use `docker compose down -v` unless you intend to delete the data volume.

## Backup and restore

Stop the application to keep the database and document files consistent, then run the backup command:

```sh
docker compose stop app
docker compose run --rm app node scripts/backup.mjs --app-stopped
docker compose start app
```

The command prints a path under `/data/backups/`. Copy the chosen backup out of the running container, using its exact printed folder name:

```sh
docker compose cp app:/data/backups/EXACT-FOLDER ./aaly-backup
```

Store a protected copy off the server. Backups contain private records, password hashes, and documents. A JSON export in the app is not a full backup.

To restore, stop the app, preserve its current data volume, and create a **new empty data volume**. Copy the backup's `aaly.sqlite` and `uploads/` into that volume's root. Set ownership to UID/GID 1000 for the provided image. Point the Compose `aaly_data` volume at the restored volume, reset role passwords with the command below (invalidates old sessions), and start the app. Never overlay the snapshot on old `aaly.sqlite-wal` / `aaly.sqlite-shm` files. See the detailed Arabic steps.

For a direct Node install, stop the process and run `npm run backup -- --app-stopped`; copy the resulting folder outside `DATA_DIR`.

## Reset forgotten passwords

Requires terminal access to the server:

```sh
docker compose run --rm -it app node scripts/setup.mjs --reset-passwords
```

Or for Node: `npm run setup -- --reset-passwords`. The command resets all three role passwords and revokes old sessions. It does not erase business records.

## Current functional boundaries

- Bank checks evaluate manually entered invoice fields and attached-document requirements. They do not perform OCR, verify legal authenticity, or execute bank transfers.
- Sales are one product per form and recorded as cash. There is no built-in refund, sale edit, or multi-item invoice cart.
- Order stage changes do not change stock. Cooking yield and material conversions are recorded manually through stock additions/adjustments.
- Quantities are whole units. Use grams or another smaller unit when needed.
- Follow-up dates do not send notifications. Email invitations are not sent.
- Audit screen currently shows the latest 100 events. Raw database backups preserve the full stored audit table.

## Verification

```sh
npm test
npm run typecheck
npm run build
npm run test:integration
```

The integration test starts a real production Next.js server with a temporary database and checks authentication, permissions, inventory, sale idempotency, uploads/downloads, bank approval, export access, and origin checks. It does not modify your live `DATA_DIR`.

See `docs/VERIFICATION.md` for the verification performed for this ZIP, including environment limits.
