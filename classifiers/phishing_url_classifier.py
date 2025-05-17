# %% [markdown]
# # Phishing URL Classifier
# 
# This notebook implements a comprehensive phishing URL classification system that combines multiple approaches:
# 1. Traditional feature extraction from URLs and HTML content
# 2. BERT-based URL classification
# 3. XGBoost model for final classification
# 
# ## Project Structure
# - `data/`: Contains raw and processed datasets
# - `extractors/`: Contains feature extraction modules
# - `models/`: Saved model files
# 
# ## Dependencies
# The following packages are required:
# - pandas, numpy: Data manipulation
# - aiohttp: Asynchronous HTTP requests
# - torch, transformers: BERT model
# - scikit-learn: Model evaluation
# - xgboost: Final classifier
# - joblib: Model persistence

# %%
import os
import pandas as pd
import numpy as np
import asyncio
import aiohttp
from aioitertools.asyncio import gather
import torch
from transformers import BertTokenizerFast, BertForSequenceClassification, pipeline
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
import xgboost as xgb
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from tqdm.notebook import tqdm

from classifiers.extractors.feature_extractor import extract_features_from_url

# Set random seeds for reproducibility
np.random.seed(42)
torch.manual_seed(42)

# Create necessary directories
os.makedirs('data', exist_ok=True)
os.makedirs('models', exist_ok=True)

# %% [markdown]
# ## 1. Data Loading and Preprocessing
# 
# First, we'll load and preprocess our datasets. We'll handle both the raw URLs and any existing processed data.

# %%
def load_datasets():
    """Load and prepare datasets for processing."""
    try:
        urls = pd.read_csv("data/urls2.csv")
        print(f"Loaded {len(urls)} URLs from urls2.csv")
    except FileNotFoundError:
        print("urls2.csv not found. Please ensure the file exists in the data directory.")
        return None
    
    try:
        handled_urls = pd.read_csv("data/dataset.csv")
        print(f"Loaded {len(handled_urls)} processed URLs from dataset.csv")
    except FileNotFoundError:
        print("dataset.csv not found. Creating new dataset.")
        handled_urls = pd.DataFrame()
    
    return urls, handled_urls

# Load datasets
urls, handled_urls = load_datasets()

# %% [markdown]
# ## 2. Feature Extraction
# 
# Extract features from URLs using both traditional methods and HTML content analysis.

# %%
async def get_features(url) -> dict | None:
    """Extract features from a single URL."""
    async with aiohttp.ClientSession() as session:
        try:
            res = await session.get(url, timeout=10)
            valid = True
            html = await res.text()
            res.close()
        except Exception as e:
            print(f"Error processing {url}: {str(e)}")
            valid = False
    
    if not valid:
        return {
            "url": url,
            "status": "invalid",
        }
    
    features = extract_features_from_url(url, html)
    return {
        "url": url
    } | features | {"status": "legitimate"}

async def validate_urls():
    """Process URLs in batches and extract features."""
    if urls is None:
        return
    
    # Remove duplicates and filter
    urls_to_process = urls[~urls["url"].isin(handled_urls["url"])]
    urls_to_process = urls_to_process[urls_to_process["is_spam"] == False]
    
    print(f"Processing {len(urls_to_process)} new URLs")
    
    tasks = []
    batch_size = 1000
    
    for i in tqdm(range(0, len(urls_to_process), batch_size)):
        batch = urls_to_process.iloc[i : i + batch_size]
        for _, record in batch.iterrows():
            url = record["url"]
            tasks.append(get_features(url))
        
        results = await gather(*tasks, limit=500)
        dataset = pd.DataFrame(results)
        
        # Save progress
        dataset.to_csv("data/dataset.csv", mode="a", header=False, index=False)
        tasks = []
        
        print(f"Processed {min(i + batch_size, len(urls_to_process))} URLs")

# Run feature extraction
await validate_urls()

# %% [markdown]
# ## 3. BERT URL Classification
# 
# Initialize and use the BERT model for URL classification.

# %%
def initialize_bert_model():
    """Initialize BERT model and tokenizer."""
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model_name = "CrabInHoney/urlbert-tiny-v4-phishing-classifier"
    
    print(f"Using device: {device}")
    
    tokenizer = BertTokenizerFast.from_pretrained(model_name)
    model = BertForSequenceClassification.from_pretrained(model_name)
    model.to(device)
    
    classifier = pipeline(
        "text-classification",
        model=model,
        tokenizer=tokenizer,
        device=0 if torch.cuda.is_available() else -1,
        return_all_scores=True
    )
    
    return classifier

async def add_url_bert_classification():
    """Add BERT classification scores to the dataset."""
    classifier = initialize_bert_model()
    
    urls = pd.read_csv("data/urls_with_features.csv")
    urls["url_bert_classification"] = None
    unhandled_urls = urls[urls["url_bert_classification"].isna()]
    
    print(f"Processing {len(unhandled_urls)} URLs with BERT")
    
    for index, record in tqdm(unhandled_urls.iterrows(), total=len(unhandled_urls)):
        url = record["url"]
        try:
            result = classifier(url)
            label_1_score = result[0][1]['score']
            urls.at[index, "url_bert_classification"] = label_1_score
        except Exception as e:
            urls.at[index, "url_bert_classification"] = str(e)
        
        if index % 100 == 0:
            urls.to_csv("data/urls_with_features_and_url_classification.csv", index=False)
            print(f"Saved progress at {index} URLs")

# Run BERT classification
await add_url_bert_classification()

# %% [markdown]
# ## 4. Model Training and Evaluation
# 
# Prepare the data and train the XGBoost model.

# %%
def prepare_data():
    """Prepare data for model training."""
    # Load the processed dataset
    df = pd.read_csv('data/urls_with_features_and_url_classification.csv')
    
    # Remove external features
    external_features = [
        "domain_registration_length",
        "whois_registered_domain",
        "web_traffic",
        "domain_age",
        "google_index",
        "dns_record",
        "page_rank",
    ]
    
    df = df.drop(columns=[col for col in external_features if col in df.columns])
    
    # Handle missing values
    df = df.fillna(df.mean())
    
    # Prepare features and target
    X = df.drop(['url', 'status'], axis=1)
    y = (df['status'] == 'phishing').astype(int)
    
    return train_test_split(X, y, test_size=0.2, random_state=42)

def train_and_evaluate_model(X_train, X_test, y_train, y_test):
    """Train and evaluate the XGBoost model."""
    # Initialize model
    xgb_model = xgb.XGBClassifier(
        n_estimators=100,
        learning_rate=0.1,
        max_depth=5,
        random_state=42
    )
    
    # Train model
    xgb_model.fit(X_train, y_train)
    
    # Make predictions
    y_pred = xgb_model.predict(X_test)
    
    # Calculate metrics
    metrics = {
        'accuracy': accuracy_score(y_test, y_pred),
        'precision': precision_score(y_test, y_pred),
        'recall': recall_score(y_test, y_pred),
        'f1': f1_score(y_test, y_pred)
    }
    
    # Print metrics
    for metric, value in metrics.items():
        print(f"{metric.capitalize()}: {value:.4f}")
    
    # Plot confusion matrix
    cm = confusion_matrix(y_test, y_pred)
    plt.figure(figsize=(8, 6))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues')
    plt.title('Confusion Matrix')
    plt.ylabel('True Label')
    plt.xlabel('Predicted Label')
    plt.show()
    
    return xgb_model, metrics

# Prepare data and train model
X_train, X_test, y_train, y_test = prepare_data()
model, metrics = train_and_evaluate_model(X_train, X_test, y_train, y_test)

# %% [markdown]
# ## 5. Feature Importance Analysis
# 
# Analyze which features are most important for the model's predictions.

# %%
def analyze_feature_importance(model, X):
    """Analyze and visualize feature importance."""
    # Get feature importance
    feature_importance = pd.DataFrame({
        'feature': X.columns,
        'importance': model.feature_importances_
    })
    
    # Sort by importance
    feature_importance = feature_importance.sort_values('importance', ascending=False)
    
    # Plot top 20 features
    plt.figure(figsize=(12, 6))
    sns.barplot(x='importance', y='feature', data=feature_importance.head(20))
    plt.title('Top 20 Most Important Features')
    plt.xlabel('Importance')
    plt.tight_layout()
    plt.show()
    
    return feature_importance

# Analyze feature importance
feature_importance = analyze_feature_importance(model, X_train)

# %% [markdown]
# ## 6. Model Persistence and Export
# 
# Save the trained model and related files for future use.

# %%
def save_model_and_metadata(model, X, metrics, feature_importance):
    """Save model and related metadata."""
    # Save the model
    joblib.dump(model, 'models/phishing_url_classifier.joblib')
    
    # Save feature names
    joblib.dump(list(X.columns), 'models/feature_names.joblib')
    
    # Save metrics
    pd.DataFrame([metrics]).to_csv('models/model_metrics.csv', index=False)
    
    # Save feature importance
    feature_importance.to_csv('models/feature_importance.csv', index=False)
    
    print("Model and metadata saved successfully.")

# Save model and metadata
save_model_and_metadata(model, X_train, metrics, feature_importance)

# %% [markdown]
# ## 7. Model Testing
# 
# Test the model on new URLs.

# %%
def predict_url(url: str) -> dict:
    """Predict if a URL is phishing or legitimate."""
    # Load model and feature names
    model = joblib.load('models/phishing_url_classifier.joblib')
    feature_names = joblib.load('models/feature_names.joblib')
    
    # Extract features
    features = extract_features_from_url(url, "")  # Empty HTML as we don't need it for prediction
    
    # Add BERT classification
    classifier = initialize_bert_model()
    bert_score = classifier(url)[0][1]['score']
    features['url_bert_classification'] = bert_score
    
    # Prepare features for prediction
    X = pd.DataFrame([features])
    X = X[feature_names]  # Ensure correct feature order
    
    # Make prediction
    prediction = model.predict(X)[0]
    probability = model.predict_proba(X)[0][1]
    
    return {
        'url': url,
        'is_phishing': bool(prediction),
        'phishing_probability': float(probability),
        'bert_score': float(bert_score)
    }

# Test the model
test_urls = [
    "https://www.google.com",
    "https://www.paypal.com",
    "http://suspicious-site.com/login"
]

for url in test_urls:
    result = predict_url(url)
    print(f"\nURL: {result['url']}")
    print(f"Is Phishing: {result['is_phishing']}")
    print(f"Phishing Probability: {result['phishing_probability']:.4f}")
    print(f"BERT Score: {result['bert_score']:.4f}") 