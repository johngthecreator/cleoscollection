import os
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / "web-app" / ".env")

brightdata_api_key = os.getenv("BRIGHTDATA_API_KEY")


def brightdata_scraper(target_url: str):
    url = "https://api.brightdata.com/request"

    payload = {
        "zone": "deal_unlocker",
        "url": target_url,
        "format": "raw",
    }
    headers = {
        "Authorization": f"Bearer {brightdata_api_key}",
        "Content-Type": "application/json"
    }

    return requests.post(url, json=payload, headers=headers)
