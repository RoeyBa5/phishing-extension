from __future__ import annotations

import asyncio

import aiohttp
import pandas as pd
from aioitertools.asyncio import gather

from classifiers.extractors.feature_extractor import extract_features_from_url


async def validate_urls():
    urls = pd.read_csv("urls2.csv")
    handled_urls = pd.read_csv("dataset.csv")
    # remove duplicates
    urls = urls[~urls["url"].isin(handled_urls["url"])]
    urls = urls[urls["is_spam"] == False]
    tasks = []
    # iterate phishing_urld in batches of size 100
    for i in range(0, len(urls), 1000):
        batch = urls.iloc[i : i + 1000]
        for index, record in batch.iterrows():
            url = record["url"]
            tasks.append(get_features(url))
        results = await gather(*tasks, limit=500)
        dataset = pd.DataFrame(results)
        # save to dataset.csv in the end
        dataset.to_csv("dataset.csv", mode="a", header=False, index=False)
        tasks = []


async def get_features(url) -> dict | None:
    async with aiohttp.ClientSession() as session:
        try:
            res = await session.get(url)
            valid = True
            html = await res.text()
            res.close()
        except Exception:
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

if __name__ == "__main__":
    asyncio.run(validate_urls())

