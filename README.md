# SPOT EV — Electric Vehicle Route Tracking

Flask web app for **live EV / shuttle tracking**: public map, driver login, route views, and an admin console. Backend is **Firebase Realtime Database** plus Firebase Auth.

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask)
![Firebase](https://img.shields.io/badge/Firebase-Realtime%20DB-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)

## What it does

| Role | Surfaces |
| --- | --- |
| Public rider | Home, contact, live **track** map, published **routes** |
| Driver | Login, dashboard, status updates |
| Admin | Admin login, driver and route management |

Stack: Python, Flask, Jinja templates, static CSS/JS, `firebase-admin`.

## Project layout

```
EVfinal/
├── app.py                 # Flask routes and Firebase access
├── main.py                # Local entrypoint
├── requirements.txt
├── templates/             # HTML views
├── static/                # CSS, JS, icons
└── .env.example           # Required environment variables
```

## Run locally

1. Clone the repo and create a virtual environment.
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and set:
   - `SESSION_SECRET`
   - `GOOGLE_APPLICATION_CREDENTIALS` pointing at a **local** Firebase service-account JSON (not in git)
4. Start the app:

```bash
python main.py
```

The development server listens on `http://127.0.0.1:5000`.

## Security

Service-account JSON files are **gitignored**. If an admin SDK key was ever committed historically, rotate it in Google Cloud / Firebase Console and issue a new key.

Do not commit `.env` or credential files.

## Author

**Raja Wasim** — [github.com/RajaWasim100](https://github.com/RajaWasim100)
