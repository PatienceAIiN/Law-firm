#!/usr/bin/env bash
# Creates a local Postgres role + DB for development.
# Run once: bash scripts/setup-local-db.sh
set -euo pipefail

DB_USER="${USER}"
DB_NAME="lawfirm_dev"
DB_PASS="devpass"

echo "==> creating role '$DB_USER' (if missing)..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE $DB_USER LOGIN SUPERUSER PASSWORD '$DB_PASS';"

echo "==> creating database '$DB_NAME' (if missing)..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" | grep -q 1 \
  || sudo -u postgres createdb -O "$DB_USER" "$DB_NAME"

LOCAL_URL="postgresql://$DB_USER:$DB_PASS@127.0.0.1:5432/$DB_NAME"

cat > .env.local <<EOF
# Local-dev override. Next.js loads .env.local AFTER .env so these win.
# Delete this file to fall back to the prod Supabase URL in .env.
DATABASE_URL=$LOCAL_URL
DIRECT_URL=$LOCAL_URL
EOF

echo
echo "Wrote .env.local pointing at $LOCAL_URL"
echo "Syncing schema..."
npx prisma db push --skip-generate
echo
echo "Done. Restart 'npm run dev' to pick up .env.local."
