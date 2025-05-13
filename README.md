# Quorix

**Clarity from the Crowd**

Quorix is a real-time audience intelligence app for corporate events and research seminars. It aims to replace chaotic Twitter walls and static word clouds with synthesized, moderator-ready questions that reflect the most pressing topics on attendees’ minds.

---

## Project Status

This project is in early development. The repository contains a backend (Flask) and a frontend (React) with initial structure, test files, and utility scripts. Core features are under construction.

## Directory Structure

- `backend/` – Flask backend with API routes, models, synthesis utilities, and tests
- `frontend/` – React frontend with components, pages, and utilities
- `create_issues.py` – Script for issue management
- `run_tests.sh` – Shell script to run backend tests
- `README.md` – Project documentation (this file)

## Key Features (Planned)

- 🔐 Attendee login via QR code and event ID
- ✍️ Authenticated question submission tied to user identity
- 🧠 AI-powered synthesis of similar questions using OpenAI
- 🛡 Moderator tools for approving, merging, and filtering questions
- 💬 Real-time extraction from Zoom, Microsoft Teams, and Google Meet chats
- 📡 Auto-refreshing view of synthesized questions for on-stage use

## Tech Stack

- **Frontend:** React (see `frontend/`)
- **Backend:** Flask (see `backend/`)
- **Auth:** Email + Event Code (planned)
- **AI Integration:** OpenAI API (planned)
- **Deployment:** Heroku, Render, or Docker (planned)

## Getting Started

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd quorix
   ```
2. (Optional) Initialize project structure:
   ```bash
   python init_quorix_structure.py
   ```
3. Set up the backend:
   ```bash
   cd backend
   pip install -r requirements.txt
   # To run tests:
   ../run_tests.sh
   ```
4. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   npm start
   ```

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements or bug fixes.

## License

MIT

---

Quorix: Clarity from the Crowd.
