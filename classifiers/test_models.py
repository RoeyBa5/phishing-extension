import joblib
from transformers import BertTokenizerFast, BertForSequenceClassification, pipeline
import torch

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model_name = "CrabInHoney/urlbert-tiny-v4-phishing-classifier"
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
xgb_model = joblib.load('xgb_model.pkl')

def classify_url(url: str) -> str:
    """
    Classify the URL as phishing or benign.
    """
    result = classifier(url)
    # Get the label with the highest score
    label = max(result[0], key=lambda x: x['score'])
    return label['label']

def classify_website(url: str) -> str:
    features = ...

    # results
    url_classification = classify_url(url)
    xgb_classification = ...
