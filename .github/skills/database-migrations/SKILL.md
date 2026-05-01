---
name: database-migrations
description: 'Prisma migration workflow for CerenMobile MySQL database. Covers creating migrations, rollback strategies, data safety checks, seeding, and production migration procedures. Use when changing the database schema, adding new tables, or troubleshooting migration failures.'
argument-hint: 'What database change are you making? (add field, new table, rename, remove, seed data)'
origin: ECC
---

# Database Migrations — Prisma + MySQL

**Applies to:** All database schema changes in `backend/prisma/schema.prisma`.  
**Trigger:** Before any schema change, before production deployments involving migrations.

> "Never modify a production database without a tested migration script and a rollback plan."

---

## When to Activate

- Adding or removing fields from Prisma schema
- Creating new tables or relations
- Changing field types or constraints
- Preparing a production deployment that includes schema changes
- Debugging migration failures or drift
- Seeding test or initial data

---

## Migration Workflow

### Step 1 — Modify the Schema

Edit `backend/prisma/schema.prisma`:
```prisma
// Example: Adding a notes field to the Order model
model Order {
  id         Int      @id @default(autoincrement())
  customerId Int
  status     String
  notes      String?  // ← New optional field
  createdAt  DateTime @default(now())
}
```

### Step 2 — Create Migration File

```bash
cd backend

# Development: creates migration SQL + runs it
npx prisma migrate dev --name add_notes_to_orders

# This creates: prisma/migrations/[timestamp]_add_notes_to_orders/migration.sql
# AND regenerates the Prisma client
```

**Naming convention for migrations:**
```
add_[field]_to_[table]
remove_[field]_from_[table]
create_[table]
rename_[old]_to_[new]_in_[table]
add_[table]_[relation]_relation
alter_[field]_type_in_[table]
```

### Step 3 — Review the Generated SQL

Always read the generated migration SQL before applying to production:
```bash
cat prisma/migrations/[timestamp]_migration_name/migration.sql
```

**Red flags in migration SQL:**
```sql
-- ⚠️ These are destructive — verify they're intentional
DROP TABLE ...
DROP COLUMN ...
ALTER TABLE ... MODIFY COLUMN ... (type changes can lose data)

-- ✅ These are safe
ALTER TABLE ... ADD COLUMN ...
CREATE TABLE ...
CREATE INDEX ...
```

### Step 4 — Regenerate Prisma Client

```bash
npx prisma generate
```

This must be run after every schema change, even if no migration is needed.

---

## Production Migration Procedure

### Pre-Migration Checklist
```
□ Migration tested in development environment
□ Migration SQL reviewed for destructive operations
□ Database backup taken (mysqldump or RDS snapshot)
□ Downtime window scheduled if migration is long-running
□ Rollback script prepared
□ Backend deployed with backward-compatible code first (if needed)
```

### Apply Migration to Production

```bash
# On EC2 backend server
cd /home/ubuntu/ceren-backend

# Pull latest code
git pull origin main

# Apply pending migrations (does NOT prompt or reset)
npx prisma migrate deploy

# Regenerate client
npx prisma generate

# Restart backend
pm2 restart ceren-backend
```

**Key difference:**
- `prisma migrate dev` — Development only (resets and re-applies if needed)
- `prisma migrate deploy` — Production safe (only applies pending, never resets)

---

## Rollback Strategy

Prisma does not have automatic rollback. Use these approaches:

### Option 1 — Reverse Migration (Safe for additive changes)
```sql
-- If you added a column and need to roll back:
ALTER TABLE orders DROP COLUMN notes;
```

### Option 2 — Restore from Backup
```bash
# Restore MySQL backup
mysql -u root -p ceren_db < backup_before_migration.sql
```

### Option 3 — Write a Down Migration
```bash
# Create a new migration that reverses the change
npx prisma migrate dev --name rollback_notes_from_orders
```
Then in the generated migration, write the reverse SQL.

---

## Safe Migration Patterns

### Adding a Non-Nullable Field
```prisma
// ❌ This will FAIL on existing data — no default value
model Order {
  priority Int  // NOT NULL with no default
}

// ✅ Option 1: Make it nullable
model Order {
  priority Int?
}

// ✅ Option 2: Provide a default
model Order {
  priority Int @default(1)
}
```

### Renaming a Column (Safe Approach)
```
Step 1: Add new column with new name (with nullable)
Step 2: Deploy code that writes to BOTH old and new columns
Step 3: Backfill new column from old column
Step 4: Deploy code that reads from new column
Step 5: Make new column non-nullable
Step 6: Drop old column
```

### Changing a Column Type
```sql
-- Always check if existing data is compatible first
SELECT COUNT(*) FROM orders WHERE CAST(old_field AS [new_type]) IS NULL;
-- If 0 rows, safe to proceed
```

---

## Seeding Data

### Development Seed
```bash
# Run the Prisma seed script
cd backend
npx prisma db seed
```

**Seed file: `backend/prisma/seed.ts`**
```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Insert test customer
  await prisma.uSERCUSTOMERMASTER.upsert({
    where: { phone: '+91XXXXXXXXXX' },
    update: {},
    create: {
      phone: '+91XXXXXXXXXX',
      customerId: 2005,
    },
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Add to `backend/package.json`:**
```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

## Checking Migration Status

```bash
# See which migrations have been applied
npx prisma migrate status

# If schema drift detected (local schema differs from DB):
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma

# Force a baseline (if database has manual changes not tracked by Prisma)
npx prisma migrate resolve --applied [migration_name]
```

---

## Common Migration Errors

### Error: "Drift detected"
```
The database schema is not in sync with the migration history.
```
**Fix:**
```bash
# Option 1: Reset in dev (destroys all data)
npx prisma migrate reset

# Option 2: Baseline the current state (keeps data)
npx prisma migrate resolve --applied [migration_folder_name]
```

### Error: "Foreign key constraint fails"
```
Cannot add foreign key constraint
```
**Fix:** Ensure parent table rows exist before inserting child rows. Check migration order.

### Error: "Column cannot be null"
```
Field of required type but found no value provided
```
**Fix:** Add `@default(value)` to schema or make field optional (`?`).

---

## Verification Checklist

- [ ] Schema change reviewed by a second engineer
- [ ] Migration SQL manually reviewed for destructive operations
- [ ] Migration tested in development with real-ish data volume
- [ ] `prisma migrate status` shows no pending migrations in dev
- [ ] Rollback plan documented
- [ ] Database backup taken before production migration
- [ ] `prisma generate` run after schema change
- [ ] All Prisma query changes tested after migration
- [ ] No breaking changes to existing API contracts
