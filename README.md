# EaseTravel

**EaseTravel** is an AI-powered travel planner designed to make trip planning simpler and more personalized.

The goal is to let users describe the kind of trip they want in natural language and use AI to help build and refine an itinerary. Users can interact with an AI travel assistant, provide their preferences, and continue modifying their plans as their trip evolves.

## Features

* **AI Travel Assistant** — Chat with an AI assistant to get personalized travel planning help
* **Trip Planning** — Create travel plans based on a destination and number of days
* **Interactive Planning** — Continue refining travel plans through natural-language conversations
* **Context-Aware Conversations** — The assistant can use the destination and user-provided context when generating responses
* **Responsive Frontend** — React-based interface designed for an interactive planning experience
* **API-Based Architecture** — React frontend communicates with a Python FastAPI backend

## Tech Stack

### Frontend

* React 18
* JavaScript
* Vite
* React Router
* Tailwind CSS
* React Markdown
* Axios

### Backend

* Python
* FastAPI
* Uvicorn
* Pydantic
* Google Gemini API

## Running Locally

### Prerequisites

Make sure you have:

* [Node.js](https://nodejs.org/) 20+
* Python 3.10+
* Git
* A Google Gemini API key

The frontend is configured to run on port `3000`, while the backend runs on port `8000`.

### 1. Clone the repository

```bash
git clone https://github.com/VictorSharon/travel-planner.git
cd travel-planner
```

### 2. Configure the Gemini API key

The backend uses the `GEMINI_API_KEY` environment variable to authenticate with Google Gemini.

Create a `.env` file inside the `backend` directory:

```bash
cd backend
touch .env
```

Add:

```env
GEMINI_API_KEY=your_gemini_api_key
```

You can optionally specify a Gemini model:

```env
GEMINI_MODEL=gemini-2.5-flash
```

Then return to the project root:

```bash
cd ..
```

### 3. Install frontend dependencies

```bash
cd frontend
npm install
```

### 4. Start the frontend

```bash
npm run dev
```

The frontend will be available at:

```text
http://localhost:3000
```

### 5. Start the backend

Open a second terminal and navigate to the backend:

```bash
cd travel-planner/backend
```

Create a virtual environment:

```bash
python3 -m venv .venv
```

Activate it:

**macOS / Linux**

```bash
source .venv/bin/activate
```

**Windows**

```bash
.venv\Scripts\activate
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

You can verify that it is running by visiting:

```text
http://localhost:8000/health
```

Expected response:

```json
{
  "status": "ok"
}
```

## Running with Docker

The repository also includes a Docker Compose configuration for running the frontend and backend together.

First, make sure `backend/.env` contains your Gemini API key:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Then from the project root:

```bash
docker compose up --build
```

The services will be available at:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
```

To stop the containers:

```bash
docker compose down
```
## Current Development

EaseTravel is an ongoing project. The current implementation focuses on establishing the application architecture and AI-powered travel assistant, with additional itinerary generation and travel-service integrations planned as the project evolves.

## Future Improvements

* Flight search and booking integrations
* Hotel search and booking
* Restaurant discovery and reservations
* More advanced itinerary generation
* Real-time itinerary editing through AI
* User accounts and saved trips
* Persistent trip storage
* Additional travel data integrations
