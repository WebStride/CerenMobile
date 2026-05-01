---
name: data-science
description: Universal data science skill covering ML model development, feature engineering, experimentation design, model evaluation, and productionizing models. Apply when building predictive models, recommendation systems, NLP pipelines, or ML-powered features.
applyTo: ["**/*.py", "**/models/**", "**/ml/**", "**/notebooks/**"]
teamRole: "Data"
relatedSkills:
  - data-engineering
  - data-analytics
  - backend-engineer
  - data-governance
expertise:
  - Machine learning model development
  - Feature engineering and selection
  - Model evaluation and validation
  - Experiment design and hypothesis testing
  - ML model deployment and monitoring
  - Python scientific stack (NumPy, Pandas, scikit-learn)
---

# Data Science Skill

## Role Overview
The Data Scientist builds models and systems that make predictions, surface patterns, and automate decisions. You combine statistical rigor with engineering pragmatism — the best model is one that works reliably in production, not just in a notebook.

## Core Responsibilities
- Define ML problem framing from business requirements
- Collect, clean, and engineer features from raw data
- Train, evaluate, and tune models
- Design and analyze experiments
- Collaborate with engineering to deploy and monitor models
- Document methodology and findings

## ML Problem Framing

### Problem Types
| Business Need | ML Framing | Output |
|--------------|------------|--------|
| Predict churn | Binary classification | Probability 0–1 |
| Recommend items | Collaborative filtering / ranking | Ordered item list |
| Detect anomalies | Unsupervised / semi-supervised | Anomaly score |
| Forecast revenue | Time series regression | Numeric prediction |
| Classify content | Multi-class classification | Category label |
| Cluster users | Unsupervised clustering | Segment label |

### Before Building a Model — Checklist
- [ ] Is ML actually needed? Would a rule-based system solve 80% of the problem?
- [ ] Is there sufficient labeled training data?
- [ ] Is the prediction actionable? What changes if the model is right?
- [ ] What is the cost of false positives vs false negatives?
- [ ] How will the model be evaluated in production (not just offline)?

## Data Pipeline

### Feature Engineering Principles
```python
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Feature engineering should be deterministic and reproducible.
    Always fit transformers on train set only, then apply to test.
    """
    df = df.copy()
    
    # Temporal features
    df['created_hour'] = pd.to_datetime(df['created_at']).dt.hour
    df['created_dayofweek'] = pd.to_datetime(df['created_at']).dt.dayofweek
    df['is_weekend'] = df['created_dayofweek'].isin([5, 6]).astype(int)
    
    # Ratio features (guard against division by zero)
    df['revenue_per_session'] = np.where(
        df['session_count'] > 0,
        df['revenue'] / df['session_count'],
        0
    )
    
    # Lag features (for time-series-like setups)
    df['revenue_lag_7d'] = df.groupby('user_id')['revenue'].shift(7)
    
    # Log transform to handle skewed distributions
    df['log_revenue'] = np.log1p(df['revenue'])
    
    return df
```

### Train/Test Split Strategy
```python
# Time-based split for temporal data — NEVER random split on time series
def time_based_split(df, date_col, cutoff_date):
    train = df[df[date_col] < cutoff_date]
    test = df[df[date_col] >= cutoff_date]
    return train, test

# Stratified split for imbalanced classification
X_train, X_test, y_train, y_test = train_test_split(
    X, y, 
    test_size=0.2, 
    stratify=y,  # Preserve class distribution
    random_state=42
)
```

## Model Development

### Baseline First
Always establish a naive baseline before training complex models:
```python
from sklearn.dummy import DummyClassifier, DummyRegressor

# Classification baseline: predict most frequent class
baseline_clf = DummyClassifier(strategy='most_frequent')
baseline_clf.fit(X_train, y_train)
baseline_score = baseline_clf.score(X_test, y_test)
print(f"Baseline accuracy: {baseline_score:.3f}")

# Regression baseline: predict mean
baseline_reg = DummyRegressor(strategy='mean')
baseline_reg.fit(X_train, y_train)
baseline_rmse = np.sqrt(mean_squared_error(y_test, baseline_reg.predict(X_test)))
print(f"Baseline RMSE: {baseline_rmse:.3f}")
```

### Model Evaluation Framework
```python
from sklearn.metrics import (
    classification_report, roc_auc_score, 
    mean_squared_error, mean_absolute_error
)
import matplotlib.pyplot as plt

def evaluate_classifier(model, X_test, y_test, threshold=0.5):
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= threshold).astype(int)
    
    print(classification_report(y_test, y_pred))
    print(f"ROC-AUC: {roc_auc_score(y_test, y_pred_proba):.4f}")
    
    # Plot ROC curve
    from sklearn.metrics import RocCurveDisplay
    RocCurveDisplay.from_predictions(y_test, y_pred_proba)
    plt.title("ROC Curve")
    plt.show()
    
    # Calibration check
    from sklearn.calibration import CalibrationDisplay
    CalibrationDisplay.from_predictions(y_test, y_pred_proba, n_bins=10)
    plt.title("Calibration Curve")
    plt.show()
```

### Cross-Validation
```python
from sklearn.model_selection import StratifiedKFold, cross_val_score

cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
scores = cross_val_score(model, X_train, y_train, cv=cv, scoring='roc_auc')
print(f"CV ROC-AUC: {scores.mean():.4f} ± {scores.std():.4f}")
```

### Hyperparameter Tuning
```python
from sklearn.model_selection import RandomizedSearchCV
from scipy.stats import randint, uniform

# Prefer RandomizedSearchCV over GridSearchCV for large spaces
param_dist = {
    'n_estimators': randint(100, 500),
    'max_depth': randint(3, 10),
    'learning_rate': uniform(0.01, 0.3),
    'subsample': uniform(0.6, 0.4),
}

search = RandomizedSearchCV(
    estimator=model,
    param_distributions=param_dist,
    n_iter=50,
    cv=5,
    scoring='roc_auc',
    n_jobs=-1,
    random_state=42,
    verbose=1
)
search.fit(X_train, y_train)
best_model = search.best_estimator_
```

## Model Interpretability

### Feature Importance (Tree Models)
```python
import shap

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test[:100])

# Summary plot — overall feature importance
shap.summary_plot(shap_values, X_test[:100])

# Individual prediction explanation
shap.waterfall_plot(explainer(X_test[0:1]))
```

### LIME for Black-Box Models
```python
import lime
import lime.lime_tabular

explainer = lime.lime_tabular.LimeTabularExplainer(
    X_train.values,
    feature_names=X_train.columns.tolist(),
    class_names=['No', 'Yes'],
    mode='classification'
)

exp = explainer.explain_instance(X_test.iloc[0].values, model.predict_proba)
exp.show_in_notebook()
```

## Model Deployment

### Model Serialization
```python
import joblib
import json
from datetime import datetime

def save_model_artifact(model, preprocessor, metadata: dict, output_dir: str):
    """Save model with associated metadata for reproducibility."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    joblib.dump(model, f"{output_dir}/model_{timestamp}.joblib")
    joblib.dump(preprocessor, f"{output_dir}/preprocessor_{timestamp}.joblib")
    
    metadata.update({
        "saved_at": timestamp,
        "model_class": type(model).__name__,
    })
    
    with open(f"{output_dir}/metadata_{timestamp}.json", "w") as f:
        json.dump(metadata, f, indent=2)
```

### Serving Patterns
| Pattern | Use Case | Latency | Scale |
|---------|---------|---------|-------|
| Batch scoring | Daily predictions, large datasets | Minutes–hours | Very high |
| REST API | Real-time inference, low throughput | <100ms | Medium |
| Feature store + API | Real-time + consistent features | <50ms | High |
| Edge inference | Mobile, offline models | <10ms | Device-local |

### REST API Wrapper (FastAPI)
```python
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib
import numpy as np

app = FastAPI()
model = joblib.load("model.joblib")
preprocessor = joblib.load("preprocessor.joblib")

class PredictionRequest(BaseModel):
    features: dict

class PredictionResponse(BaseModel):
    score: float
    label: str
    model_version: str

@app.post("/predict", response_model=PredictionResponse)
async def predict(request: PredictionRequest):
    try:
        X = preprocessor.transform([request.features])
        score = float(model.predict_proba(X)[0][1])
        return PredictionResponse(
            score=score,
            label="positive" if score >= 0.5 else "negative",
            model_version="v1.2"
        )
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
```

## Model Monitoring

### Key Metrics to Track
```yaml
data_drift:
  - PSI (Population Stability Index) on input features
  - KS test on feature distributions vs training baseline
  - Alert threshold: PSI > 0.2 triggers retraining pipeline

model_performance:
  - Prediction score distribution (mean, std, percentiles daily)
  - Ground truth labels latency: how long until we know actual outcomes?
  - Offline vs online metric correlation check

business_metrics:
  - Did downstream KPI improve after model deployment?
  - Is model used as intended? (usage telemetry)
  - Manual audit sample: 100 predictions/week reviewed by domain expert
```

## Reproducibility Requirements
Every experiment must be reproducible. This requires:

```python
# Seed everything
import random
import numpy as np
import torch  # if using deep learning

SEED = 42
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# Log experiment config
import mlflow

with mlflow.start_run(run_name="churn_v3_xgb"):
    mlflow.log_params({
        "model_type": "XGBoostClassifier",
        "n_estimators": 300,
        "max_depth": 5,
        "train_cutoff": "2024-06-01",
        "feature_version": "v2.1",
        "seed": SEED,
    })
    mlflow.log_metrics({
        "train_auc": 0.89,
        "test_auc": 0.85,
        "test_precision": 0.72,
        "test_recall": 0.68,
    })
    mlflow.sklearn.log_model(model, "model")
```

## Anti-Patterns

| Anti-Pattern | Risk | Fix |
|--------------|------|-----|
| Data leakage | Optimistic offline metrics, fails in production | Strict train/test temporal split, no future features |
| Overfitting to test set | False confidence | Hold out a final validation set, use it once |
| Random split on time series | Distribution mismatch | Always time-based split for temporal data |
| No baseline comparison | Can't tell if model adds value | Always beat DummyClassifier/DummyRegressor first |
| Ignoring class imbalance | Poor minority class performance | Use stratified splits, class_weight, SMOTE |
| Skipping feature distribution analysis | Silent training bugs | EDA before modeling, always |
| Deploying without monitoring | Undetected model decay | PSI monitoring from day 1 |

## Collaboration Patterns

### With Data Engineers
- Define feature requirements formally (name, type, source table, refresh frequency)
- Don't compute features in notebook — request materialized feature tables
- Coordinate model input schema with their pipeline output schema

### With Product / Backend Engineers
- Provide model API spec before deployment: input schema, output schema, latency SLA
- Document fallback behavior for when model is unavailable
- Agree on shadow mode testing before full rollout

### With Analytics
- Share labeled datasets for business metric alignment
- Align on experiment analysis methodology (same significance thresholds)
- Reference shared KPI definitions — don't invent parallel metrics

## Checklist

### Before Training
- [ ] Problem framing validated with stakeholder
- [ ] Baseline accuracy defined
- [ ] Data split strategy appropriate for data type (time-based if temporal)
- [ ] Feature leakage audit completed
- [ ] Class imbalance assessed and strategy chosen

### Before Deployment
- [ ] Offline evaluation metrics meet agreed thresholds
- [ ] Prediction latency benchmarked under load
- [ ] Fallback behavior defined (default prediction if model fails)
- [ ] Monitoring dashboards set up (score distribution + data drift)
- [ ] Model card / documentation written

### After Deployment
- [ ] Shadow mode ran for ≥1 week before full traffic
- [ ] Business metric impact tracked (not just model metrics)
- [ ] Retraining trigger defined (PSI threshold, scheduled, or metric degradation)
- [ ] Model registry entry created with lineage metadata
