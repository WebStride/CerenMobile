---
name: data-engineering
description: Universal data engineering skill covering ETL/ELT pipeline design, data warehouse modeling, streaming architectures, data quality, and orchestration. Apply when building data pipelines, migrations, or analytical infrastructure.
applyTo: ["**/*.sql", "**/migrations/**", "**/pipelines/**", "**/dbt/**", "**/airflow/**"]
teamRole: "Data"
relatedSkills:
  - data-analytics
  - data-governance
  - backend-engineer
  - devops-engineer
  - monitoring
expertise:
  - etl-elt-pipelines
  - data-warehouse-modeling
  - streaming-architecture
  - data-quality
  - orchestration
---

# Data Engineering Skill

## Role Overview
Data engineers build reliable, scalable pipelines that move, transform, and serve data — ensuring downstream consumers (analysts, ML engineers, applications) always have fresh, accurate, trustworthy data.

## Core Responsibilities
- Design and implement ETL/ELT data pipelines
- Build and maintain data warehouse schemas
- Implement data quality checks and monitoring
- Optimize query performance and storage costs
- Manage pipeline orchestration and scheduling
- Ensure data lineage and observability
- Collaborate on data contracts with producers

## Data Pipeline Patterns

### ETL vs ELT Decision
```
ETL (Transform before load):
  - Legacy data warehouses with limited compute
  - Sensitive data requiring masking before storage
  - Small/medium data volumes

ELT (Load then transform):
  - Modern cloud warehouses (BigQuery, Snowflake, Redshift)
  - Large data volumes where warehouse compute is cheaper
  - When raw data preservation is required
  - Default choice for new pipelines
```

### Pipeline Architecture Layers
```
Source Systems → [Ingestion] → Raw Layer → [Transform] → Staging → [Model] → Serving Layer

Raw Layer:     Exact copy of source, append-only, never modified
Staging Layer: Cleaned, typed, deduplicated
Serving Layer: Business-ready dimensional models (facts + dimensions)
```

## Data Modeling

### Dimensional Modeling (Kimball)
```sql
-- Fact table: measurable events
CREATE TABLE fact_orders (
  order_id        BIGINT PRIMARY KEY,
  user_key        INT REFERENCES dim_users(user_key),
  product_key     INT REFERENCES dim_products(product_key),
  date_key        INT REFERENCES dim_date(date_key),
  quantity        INT NOT NULL,
  revenue         DECIMAL(12,2) NOT NULL,
  created_at      TIMESTAMP NOT NULL
);

-- Dimension table: descriptive context
CREATE TABLE dim_users (
  user_key        INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id         VARCHAR(36) NOT NULL,        -- business key
  email           VARCHAR(255),
  country         VARCHAR(50),
  user_tier       VARCHAR(20),
  valid_from      TIMESTAMP NOT NULL,
  valid_to        TIMESTAMP,                   -- SCD Type 2
  is_current      BOOLEAN DEFAULT TRUE
);
```

### SCD (Slowly Changing Dimensions) Strategy
```
Type 1 — Overwrite: No history needed (e.g., correcting typos)
Type 2 — New row: Full history required (e.g., user address changes)
Type 3 — Add column: Limited history (e.g., previous vs current status)
```

## Data Quality Framework

### Quality Dimensions
| Dimension | Definition | Test Example |
|-----------|-----------|-------------|
| Completeness | No unexpected nulls | `COUNT(*) WHERE email IS NULL = 0` |
| Uniqueness | No duplicates on PK | `COUNT(*) = COUNT(DISTINCT id)` |
| Validity | Values in expected range | `amount >= 0` |
| Consistency | Referential integrity | All order user_ids exist in users |
| Timeliness | Data freshness SLA | Max `created_at` < 2 hours ago |
| Accuracy | Matches source system | Row counts match source within 0.01% |

### dbt Test Pattern
```yaml
# schema.yml
models:
  - name: fact_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: revenue
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 100000
      - name: user_key
        tests:
          - relationships:
              to: ref('dim_users')
              field: user_key
```

## Pipeline Orchestration

### DAG Design Principles
```python
# Airflow DAG example
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'data-engineering',
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
    'email_on_failure': True,
    'email': ['data-eng@yourcompany.com'],
}

with DAG(
    'orders_pipeline',
    default_args=default_args,
    schedule_interval='@hourly',
    start_date=datetime(2024, 1, 1),
    catchup=False,           # Never run all missed intervals
    max_active_runs=1,       # Prevent concurrent runs
) as dag:
    extract = PythonOperator(task_id='extract', python_callable=extract_orders)
    validate = PythonOperator(task_id='validate', python_callable=validate_data)
    load = PythonOperator(task_id='load', python_callable=load_to_warehouse)

    extract >> validate >> load
```

### Idempotency Rule
Every pipeline run must produce identical results if run multiple times:
- Use `MERGE`/`UPSERT` not `INSERT`
- Include `execution_date` in partition keys
- Clear target partition before writing

## Streaming Architecture

### When to Use Streaming
```
Batch (default):     Data freshness > 15 minutes, cost-sensitive
Micro-batch:         5–15 minute freshness (Spark Structured Streaming)
Real-time streaming: < 1 minute freshness (Kafka + Flink/Beam)
```

### Kafka Consumer Pattern
```python
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'orders.created',
    bootstrap_servers=['kafka:9092'],
    group_id='warehouse-consumer',
    auto_offset_reset='earliest',
    enable_auto_commit=False,      # Manual commit for exactly-once
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

for message in consumer:
    try:
        process_order(message.value)
        consumer.commit()           # Commit only after successful processing
    except Exception as e:
        send_to_dead_letter_queue(message, e)
        consumer.commit()           # Commit to skip poison message
```

## Collaboration Patterns

### With Backend Engineers
- Define data contracts (schema, types, null constraints) before producers ship
- Agree on event schemas for Kafka topics
- Request database read replicas for heavy analytical queries

### With Data Analytics
- Deliver clean, documented models in the serving layer
- Provide data dictionaries and column descriptions
- Alert on pipeline failures before analysts start their day

### With Data Governance
- Implement PII tagging and masking at ingestion
- Apply retention policies at the pipeline level
- Maintain data lineage documentation

## Pipeline Checklist (before production)
- [ ] Idempotency tested (run twice → same result)
- [ ] Data quality tests passing (not_null, unique, relationships)
- [ ] Failure alerts configured (Slack/email)
- [ ] Backfill strategy documented
- [ ] Query cost estimated and approved
- [ ] Data freshness SLA defined and monitored
- [ ] PII data masked/encrypted in transit and at rest

## Anti-Patterns to Avoid
- **Modifying raw layer** — raw is immutable; only transform in staging+
- **No idempotency** — always design for safe re-runs
- **Silent failures** — every pipeline step must alert on failure
- **Hardcoded credentials in DAGs** — always use secret managers
- **SELECT * in production queries** — explicit column selection only
- **No data quality checks** — validate before serving to downstream consumers
