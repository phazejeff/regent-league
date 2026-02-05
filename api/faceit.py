import os
import requests

FACEIT_API_KEY = os.environ.get("FACEIT_API_KEY")
API_URL = "https://open.faceit.com/data/v4"
HEADER = {"Authorization" : f"Bearer {FACEIT_API_KEY}"}

class Faceit:
    @staticmethod
    def get_match(faceit_url: str):
        match_id = faceit_url.removesuffix("/").split("/")[-1]
        match_data = requests.get(API_URL + "/matches/" + match_id, headers=HEADER).json()
        match_stats = requests.get(API_URL + "/matches/" + match_id + "/stats", headers=HEADER).json()

        return match_data, match_stats

Faceit.get_match("https://www.faceit.com/en/cs2/room/1-cdebb786-f451-49b3-a39d-5c40f9f772bd")