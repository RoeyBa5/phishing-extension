from __future__ import annotations

import asyncio

import aiohttp
import pandas as pd
from aioitertools.asyncio import gather

from classifiers.extractors.feature_extractor import extract_features_from_url

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

async def add_url_bert_classification():
    urls = pd.read_csv("urls_with_features.csv")
    urls["url_bert_classification"] = None
    unhandled_urls = urls[urls["url_bert_classification"].isna()]
    counter = 0
    for index, record in unhandled_urls.iterrows():
        url = record["url"]
        try:
            result = classifier(url)
            label_1_score = result[0][1]['score']
            urls.at[index, "url_bert_classification"] = label_1_score
        except Exception as e:
            urls.at[index, "url_bert_classification"] = str(e)

        if counter == 100:
            urls.to_csv("urls_with_features_and_url_classification.csv", index=False)
            counter = 0
        more_to_go = urls[urls["url_bert_classification"].isna()].shape[0]
        if more_to_go % 1000 == 0:
            print(f"{more_to_go} urls left to process")
        counter += 1

if __name__ == "__main__":
    asyncio.run(add_url_bert_classification())

