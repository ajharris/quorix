
# Quorix

**Clarity from the Crowd**

Quorix is a real-time audience intelligence app for corporate events and research seminars. It replaces chaotic Twitter walls and static word clouds with synthesized, moderator-ready questions that reflect the most pressing topics on attendees’ minds.

## Key Features

- 🔐 Attendee login via QR code and event ID
- ✍️ Authenticated question submission tied to user identity
- 🧠 AI-powered synthesis of similar questions using OpenAI
- 🛡 Moderator tools for approving, merging, and filtering questions
- 💬 Real-time extraction from Zoom, Microsoft Teams, and Google Meet chats
- 📡 Auto-refreshing view of synthesized questions for on-stage use
- ⚙️ Clean backend/frontend structure (Flask + React)

## Tech Stack

- Frontend: React or Next.js
- Backend: Flask or FastAPI
- Auth: Email + Event Code or OAuth (SSO)
- AI Integration: OpenAI API
- Deployment: Heroku, Render, or Docker

## Getting Started

This project is in early development. To initialize the project structure:

```bash
python init_quorix_structure.py
```

Then start setting up your backend and frontend frameworks.

## License

MIT

---

Quorix: Clarity from the Crowd.
