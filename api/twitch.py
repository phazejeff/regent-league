import os
import requests

TWITCH_USERNAME = "regent_xd"
TWITCH_CLIENT_AUTH = os.environ.get("TWITCH_CLIENT_ID")
TWITCH_CLIENT_SECRET = os.environ.get("TWITCH_CLIENT_SECRET")

class Twitch:
    def __init__(self):
        url = 'https://id.twitch.tv/oauth2/token'
        params = {
            'client_id': TWITCH_CLIENT_AUTH,
            'client_secret': TWITCH_CLIENT_SECRET,
            'grant_type': 'client_credentials'
        }
        resp = requests.post(url, params=params)
        if resp.status_code == 400:
            return
        data = resp.json()
        self.access_token = data['access_token']

    def is_channel_live(self):
        # Using the "Get Streams" endpoint
        url = 'https://api.twitch.tv/helix/streams'
        headers = {
            'Client-ID': TWITCH_CLIENT_AUTH,
            'Authorization': f'Bearer {self.access_token}'
        }
        params = {
            'user_login': TWITCH_USERNAME
        }
        resp = requests.get(url, headers=headers, params=params)
        data = resp.json()
        # If the "data" array is non-empty, the channel is live
        if data['data']:
            return True
        else:
            return False