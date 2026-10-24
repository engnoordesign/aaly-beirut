# Moving existing business data

This ZIP exports the application source, not the private hosted database or stored documents. The Sites service database and object store are not accessible as local files in this package.

For a fresh installation, run setup and begin with your records. For an existing company dataset:

1. Sign in to the old app as Engineer and download Export records.
2. Download each original document from Documents. Keep its exported document ID, original name, category, order ID, expiry, size, and hash together.
3. Retain a copy of both exports before making any migration.
4. Have the migration operator map the JSON records into the same `records`, `stock`, `documents`, and `audit` tables after the new schema is initialized. Preserve IDs and relations, or rewrite every referencing ID consistently. Validate counts, currencies, stock quantities, dates, and file hashes.
5. Store uploaded bytes at `DATA_DIR/uploads/<document-id>` and a sibling `<document-id>.json` containing its contentType. Match the metadata row to the same ID. Do not use untrusted paths as filenames.
6. Create/review standalone members and fresh role passwords. Do not copy ChatGPT identity headers, hosted credentials, or old session settings into this installation.
7. Compare sample orders, stock totals, journal balances, and document downloads before switching staff to the new server.

The hosted JSON export includes only the workspace's currently returned audit entries (latest 100), not a full historical database backup. No automatic live migration is performed by this ZIP. The local `scripts/backup.mjs` command supports complete backups after you begin using this standalone installation.
