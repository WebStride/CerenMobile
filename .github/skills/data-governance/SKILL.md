---
name: data-governance
description: Universal data governance skill covering data quality, privacy compliance (GDPR, CCPA), data lineage, cataloging, access control, and retention policies. Apply when defining data policies, auditing data quality, implementing GDPR workflows, or managing data access permissions.
applyTo: ["**/governance/**", "**/compliance/**", "**/privacy/**", "**/catalog/**"]
teamRole: "Data"
relatedSkills:
  - data-engineering
  - data-analytics
  - security-engineer
  - infrastructure-security
expertise:
  - Data quality frameworks
  - Privacy regulations (GDPR, CCPA, HIPAA)
  - Data lineage and cataloging
  - Access control and data permissions
  - Data retention and deletion policies
  - Data classification and tagging
---

# Data Governance Skill

## Role Overview
The Data Governance lead ensures data is trustworthy, compliant, and used responsibly. You define policies, enforce quality standards, manage regulatory compliance, and build the infrastructure that makes data trustworthy across the organization.

## Core Responsibilities
- Define and enforce data quality standards
- Manage privacy compliance (GDPR, CCPA, HIPAA, etc.)
- Build and maintain data catalog and lineage documentation
- Establish data access control policies
- Define retention and deletion procedures
- Respond to data subject access requests (DSAR)
- Audit data usage and access logs

## Data Classification Framework

Every data asset should be classified before access is granted:

```yaml
classification_levels:
  public:
    description: Data with no privacy risk, safe to share externally
    examples: [product catalog, public API responses, marketing content]
    controls: Standard access
    
  internal:
    description: Business data for internal use only
    examples: [employee directories, internal metrics, product roadmaps]
    controls: Authentication required, no external sharing
    
  confidential:
    description: Sensitive business data with competitive or legal risk
    examples: [financial reports, customer lists, partner contracts]
    controls: Role-based access, audit logging, encryption at rest
    
  restricted:
    description: Highly sensitive data with strict regulatory requirements
    examples: [PII, payment data, health records, credentials]
    controls: Need-to-know access, encryption in transit + at rest,
               audit logs, data masking in non-production environments
```

## Privacy Compliance

### GDPR / CCPA Core Requirements

| Requirement | What it Means | Implementation |
|-------------|---------------|----------------|
| Lawful basis for processing | Every data use must have a legal basis | Document purpose + basis per data category |
| Right to access | User can request a copy of their data | DSAR workflow to aggregate all user data |
| Right to erasure | User can request deletion of their data | Deletion pipeline that covers all stores |
| Data minimization | Collect only what you need | Periodic audit of collected fields |
| Purpose limitation | Don't repurpose data beyond original intent | Data use registry with approved purposes |
| Storage limitation | Don't retain data longer than needed | Automated retention enforcement |
| Consent management | Granular, revocable consent where required | Consent store + propagation system |

### DSAR (Data Subject Access Request) Workflow
```
1. Request received → identity verification (7-day window)
2. Verified → search all data stores for user data
3. Compile export (structured JSON/CSV of all personal data)
4. Legal review (30-day compliance window, extendable to 90)
5. Deliver to user via secure channel
6. Log completion in compliance audit trail
```

### Right to Erasure Pipeline
```python
# Pseudocode — adapt to your data store
class ErasureHandler:
    def __init__(self, stores: list[DataStore]):
        self.stores = stores
    
    def erase_user(self, user_id: str, requestor_verification: bool) -> dict:
        if not requestor_verification:
            raise PermissionError("Identity must be verified before erasure")
        
        results = {}
        for store in self.stores:
            try:
                deleted_count = store.delete_user_data(user_id)
                results[store.name] = {"status": "success", "deleted": deleted_count}
            except Exception as e:
                results[store.name] = {"status": "error", "message": str(e)}
        
        # Retain erasure log (required by GDPR Article 5)
        self.audit_log.record_erasure(user_id, results, timestamp=now())
        
        return results
```

### Data Anonymization vs Pseudonymization
```
Anonymization: Irreversible removal of identifying information
  - k-anonymity: every record shares attributes with ≥k others
  - Differential privacy: add statistical noise to aggregates
  - Data synthesis: generate synthetic records with same statistical properties
  
Pseudonymization: Replace identifiers with references (reversible with key)
  - Use case: analytics pipelines, ML training, non-production environments
  - Store lookup table separately with strict access controls
  - Preferred over anonymization when re-identification may be needed
```

## Data Quality Framework

### Quality Dimensions
| Dimension | Definition | Measurement |
|-----------|-----------|-------------|
| Completeness | Are required fields populated? | % non-null for required columns |
| Accuracy | Does data match real-world values? | Spot-check vs source-of-truth |
| Consistency | Is data consistent across systems? | Cross-system reconciliation checks |
| Timeliness | Is data fresh enough for its use case? | lag = MAX(now - updated_at) |
| Uniqueness | Are there unintended duplicates? | Duplicate rate on primary keys |
| Validity | Does data conform to expected format/range? | Schema + range constraint violations |

### Data Quality Checks (dbt/SQL)
```sql
-- Completeness check
SELECT
  COUNT(*) AS total_rows,
  SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) AS null_email,
  ROUND(100.0 * SUM(CASE WHEN email IS NULL THEN 1 ELSE 0 END) / COUNT(*), 2) AS null_pct
FROM users;

-- Uniqueness check
SELECT user_id, COUNT(*) AS cnt
FROM users
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Validity check (email format)
SELECT *
FROM users
WHERE email NOT LIKE '%@%.%';

-- Freshness check
SELECT
  MAX(updated_at) AS last_update,
  EXTRACT(EPOCH FROM (NOW() - MAX(updated_at)))/3600 AS hours_since_update
FROM orders;
```

### Quality SLA Definition
```yaml
table: orders
quality_slas:
  freshness:
    max_hours_stale: 1
    alert_channel: "#data-alerts"
  completeness:
    required_columns: [order_id, user_id, created_at, status, total_amount]
    max_null_pct: 0  # Zero tolerance for required fields
  uniqueness:
    primary_key: order_id
    max_duplicate_pct: 0
  validity:
    total_amount:
      min: 0
      max: 1000000
    status:
      allowed_values: [pending, confirmed, shipped, delivered, cancelled, refunded]
```

## Data Catalog

### Catalog Entry Structure
```yaml
dataset:
  name: user_events
  owner: data_team
  steward: jane@company.com
  classification: confidential
  
  description: >
    Event stream capturing user interactions with the product.
    One row per event. Partitioned by event_date.
    
  schema:
    - name: event_id
      type: VARCHAR(36)
      description: UUID for the event
      is_pii: false
      
    - name: user_id
      type: VARCHAR(36)
      description: Foreign key to users.id
      is_pii: true  # Indirect identifier
      masking_policy: hash_sha256
      
    - name: event_type
      type: VARCHAR(50)
      description: Type of event (page_view, click, purchase, etc.)
      is_pii: false
      
    - name: event_properties
      type: JSONB
      description: Event-specific payload. May contain PII — see data classification docs.
      is_pii: conditional
      
  lineage:
    source: kafka_topic:product_events
    pipeline: events_etl_pipeline
    downstream: [analytics.daily_active_users, ml.feature_store.user_activity]
    
  retention:
    hot_storage_days: 90
    cold_storage_days: 730
    deletion_after_days: 1095
    
  access:
    read: [data_analysts, data_scientists, product_managers]
    write: [data_engineers]
    admin: [data_platform_team]
```

## Access Control Policies

### Role-Based Access Pattern
```
Roles (least-privilege principle):
  - data_consumer: SELECT on aggregated/anonymized datasets only
  - data_analyst: SELECT on confidential datasets (no PII)
  - data_scientist: SELECT on pseudonymized datasets + ML feature store
  - data_engineer: SELECT + INSERT + UPDATE on raw ingestion tables
  - data_admin: Full access + user management
  - pii_auditor: SELECT on PII tables for compliance purposes only (audit-logged)

Row-Level Security (where supported):
  - Analytics users can only see data for their team's product area
  - Support agents see only data for tickets they own
```

### Access Request Process
```
1. Engineer requests access via ServiceDesk ticket
2. Data steward reviews: business need, data classification, minimum access needed
3. Security review for restricted/PII data
4. Access granted with time-bound expiry (90 days default, renewable)
5. Quarterly access review: revoke stale access
6. All PII access logged and audited monthly
```

## Data Retention & Deletion

### Retention Policy Matrix
```yaml
retention_policies:
  customer_pii:
    active_account: Retain while account active + 2 years
    deleted_account: Delete within 90 days of account deletion request
    legal_hold: Override all — retain until legal hold lifted
    
  transaction_records:
    financial: 7 years (accounting/tax compliance)
    non_financial: 3 years
    
  analytics_events:
    hot: 90 days (queryable warehouse)
    cold: 2 years (compressed object storage)
    delete: After 3 years
    
  logs:
    application: 90 days
    security: 1 year
    audit: 5 years (compliance requirement)
```

### Automated Retention Enforcement
```python
# Scheduled deletion job — runs daily
class RetentionEnforcer:
    def run(self, dry_run: bool = True):
        policies = self.load_retention_policies()
        
        for policy in policies:
            expired_records = self.find_expired(policy)
            
            if dry_run:
                self.logger.info(f"DRY RUN: Would delete {len(expired_records)} records from {policy.table}")
            else:
                deleted = self.delete_records(expired_records)
                self.audit_log.record_deletion(policy.table, deleted, policy.reason)
                self.logger.info(f"Deleted {deleted} records from {policy.table}")
```

## Data Lineage

### Lineage Documentation Requirements
Every data pipeline must document:
1. **Source** — where data comes from (system, table, API)
2. **Transformations** — what changes are applied (joins, aggregates, filters)
3. **Destination** — where output goes (table, topic, API)
4. **Sensitivity changes** — if PII is introduced, masked, or removed
5. **SLA** — expected freshness of the output

### Lineage in Code (dbt example)
```yaml
# dbt model metadata — lineage auto-tracked by dbt
models:
  - name: daily_active_users
    description: Daily count of users with at least one session
    columns:
      - name: date
        description: Calendar date
      - name: dau
        description: Distinct user count with session events
    config:
      tags: ['analytics', 'non_pii']
    sources:
      - name: user_events  # lineage automatically tracked
```

## Anti-Patterns

| Anti-Pattern | Risk | Fix |
|--------------|------|-----|
| Collecting data "just in case" | GDPR violation, security surface | Data minimization — collect only what's needed |
| Shared credentials for DB access | No audit trail | Named accounts per engineer, revoke on offboarding |
| PII in dev/staging environments | Breach risk, compliance failure | Synthetic data or masked copies for non-prod |
| No data expiry = infinite retention | GDPR violation, storage bloat | Every dataset must have a retention policy |
| Undocumented data assets | "Dark data" — nobody knows what it is | Catalog EVERY persistent dataset |
| Manual DSAR responses | Slow, error-prone, missed assets | Automated DSAR aggregation pipeline |

## Collaboration Patterns

### With Engineering
- Provide PII field list before any new tables go to production
- Review data collection specs — catch over-collection at design time
- Require encryption-at-rest for restricted data tables

### With Legal / Compliance
- Maintain a living inventory of processing activities (ROPA record)
- Escalate any novel data use cases for legal review before implementation
- Provide audit logs on demand for compliance reviews

### With Data Engineers
- Define quality SLAs before pipeline goes live
- Implement data contracts — schema changes must be reviewed
- Ensure all new tables have catalog entries before production

## Checklist

### New Dataset Onboarding
- [ ] Data classification level assigned
- [ ] PII fields identified and tagged
- [ ] Catalog entry created (owner, description, schema)
- [ ] Retention policy defined
- [ ] Access controls configured (RBAC)
- [ ] Quality SLAs defined and monitoring enabled
- [ ] Lineage documented

### GDPR / Privacy Review
- [ ] Lawful basis documented for each processing purpose
- [ ] Consent flows implemented (where required)
- [ ] DSAR workflow covers this data store
- [ ] Erasure pipeline covers this data store
- [ ] Data minimization review completed
- [ ] Non-production environments use masked/synthetic data

### Quarterly Audit
- [ ] Access review run — stale permissions revoked
- [ ] Data quality metrics reviewed
- [ ] Catalog entries up to date
- [ ] Retention policies enforced and verified
- [ ] Unclassified data assets identified and triaged
