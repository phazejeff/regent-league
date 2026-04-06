# RegentsLeague.com
This is the official repository for all code relating to regentsleague.com

# Setup
The backend is in the `api` folder and the frontend is in the `frontend` folder.

The backend uses the uv package manager, so simply do this to run:
```
cd api
uv sync
uv run fastapi dev main.py
```

The frontend uses npm. You will first need to go to `frontend/next.config.ts` and change `API_ROOT` to your own localhost backend, by default is `http://127.0.0.1:8000`.
Then, just run:
```
npm install
npm run dev
```
