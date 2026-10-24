# Verification for this source distribution

Validated in the authoring environment:

- TypeScript compilation and production Next.js build.
- Real Node.js 24 production-server HTTP tests.
- SQLite schema migrations and transaction rollback.
- Password hashing, email/role login, denied role escalation and logout.
- Manager/seller restrictions and engineer-only export.
- Raw/cooked categories, stock reclassification, stock bounds.
- Sales quantity reduction, repeat-request idempotency, accounting insert path.
- Private document upload/download and seller denial.
- Bank checklist approval with uploaded document linking.
- Same-origin write enforcement.
- CLI initialization and SQLite backup integrity, including uploaded-file copying.

No Docker daemon or external VPS/domain was available here. The Docker image, HTTPS certificate issuance, GitHub-hosted CI, clean Internet dependency installation, and production hardware behavior have not been run in this environment. The Dockerfile follows the tested production build and includes the runtime migrations and persistent directory.

No live business data was copied or changed. No GitHub repository was created and no external server was deployed as part of preparing the ZIP.
