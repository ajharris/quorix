# Quorix

**Clarity from the Crowd**

Quorix is a real-time audience intelligence platform for corporate events and research seminars. It enables attendees to submit questions, moderators to manage and synthesize them, and speakers to view approved questions live. The system is designed for clarity, moderation, and actionable audience engagement.

---

## Features

- **Attendee:**
  - Register/login for events (QR code or event code)
  - Submit questions (with timestamp and user ID)
  - View all submitted questions and their statuses
- **Moderator:**
  - View, approve, delete, merge, and flag questions
  - Exclude questions from AI synthesis
  - Publish links and manage event chat
  - Ban/unban users
- **Speaker:**
  - Fullscreen view of approved questions with navigation and dismiss controls
- **Admin:**
  - Manage users and events
  - View all questions and filter by event
- **AI Synthesis:**
  - Cluster and synthesize similar questions for efficient moderation
- **Testing:**
  - Comprehensive backend (pytest) and frontend (Jest) test suites

## Tech Stack

- **Frontend:** React, Bootstrap, Jest
- **Backend:** Flask, Flask-SQLAlchemy, Flask-Migrate, Gunicorn, pytest
- **Database:** SQLite (demo), PostgreSQL (cloud/production)
- **Auth:** Email-based (with roles: attendee, moderator, speaker, admin)
- **AI Integration:** OpenAI (for question synthesis)
- **Deployment:** Procfile for Gunicorn, ready for Heroku/Render/Docker

## Directory Structure

- `backend/` – Flask backend (API, models, routes, tests, migrations)
- `frontend/` – React frontend (components, pages, build, tests)
- `run_tests.sh` – Run all backend and frontend tests
- `setup_and_start.sh` – Setup Python venv, install dependencies, and start backend
- `Procfile` – Gunicorn entrypoint for deployment
- `requirements.txt` – Top-level requirements

## Getting Started

### 1. Clone the repository
```bash
git clone <repo-url>
cd quorix
```

### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
# (Optional) Seed demo data:
# python seed_demo_data.py
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run build  # For production/static serving
npm start      # For development
```

### 4. Running the App
- Backend: `python backend/app.py` (or use `gunicorn backend.app:app` for production)
- Frontend: `npm start` (development) or serve the `frontend/build` folder (production)

### 5. Running All Tests
```bash
./run_tests.sh
```
- Runs backend tests (pytest) and frontend tests (Jest)

## Usage
- Visit the app in your browser (default: http://localhost:3000 for frontend, http://localhost:5001 for backend API)
- Register/login as attendee, moderator, speaker, or admin
- Attendees can submit questions; moderators manage and synthesize; speakers view approved questions

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

## License

NONE

---

Quorix: Clarity from the Crowd.
