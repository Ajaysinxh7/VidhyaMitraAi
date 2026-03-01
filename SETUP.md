# VidyaMitra Setup Guide 🛠️

Follow these step-by-step instructions to set up and run the VidyaMitra project on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed on your computer:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Python](https://www.python.org/) (v3.10 or higher recommended)
- [Git](https://git-scm.com/)

---

## 1. Clone the Repository

First, clone the project to your local machine:

```bash
git clone https://github.com/your-username/vidyamitra.git
cd vidyamitra
```

---

## 2. Frontend Setup

The frontend is built with React, Vite, and TypeScript.

### Install Dependencies
Navigate to the root directory (if you aren't already there) and install the necessary npm packages:

```bash
npm install
```

### Environment Variables
Create a `.env` file in the root directory and add your Supabase credentials. **Do not use real production keys if you are just testing.**

```env
# /vidyamitra/.env
VITE_SUPABASE_URL="your-supabase-url"
VITE_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### Run the Development Server
Start the Vite development server:

```bash
npm run dev
```

The frontend should now be running locally, typically at `http://localhost:5173`.

---

## 3. Backend Setup

The backend is a Python FastAPI application.

### Navigate to Backend Directory
Open a new terminal window/tab and navigate to the backend folder:

```bash
cd backend
```

### Create a Virtual Environment
It is highly recommended to use a virtual environment to manage Python dependencies.

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**On macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

### Install Dependencies
With the virtual environment activated, install the required Python packages:

```bash
pip install -r requirements.txt
```

### Environment Variables
Create a `.env` file inside the `backend` directory. You will need API keys for the AI services and Supabase.

```env
# /vidyamitra/backend/.env

# External Services (API Keys)
GOOGLE_API_KEY="your-google-api-key"
YOUTUBE_API_KEY="your-youtube-api-key"
OPENAI_API_KEY="your-openai-api-key"
GROQ_API_KEY="your-groq-api-key"

# Supabase
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key"

# Other Services
PEXELS_API_KEY="your-pexels-api-key"
NEWS_API_KEY="your-news-api-key"
EXCHANGE_API_KEY="your-exchange-api-key"
```
*(Contact the repository owner or generate your own keys for these services if you are contributing).*

### Run the Backend Server
Start the FastAPI server using Uvicorn:

```bash
uvicorn app.main:app --reload
```

The backend API should now be running at `http://localhost:8000`. You can access the automatic interactive API documentation (Swagger UI) at `http://localhost:8000/docs`.

---

## 4. Usage

Once both the frontend and backend servers are running, you can open your browser to the frontend URL (`http://localhost:5173`). The React application will automatically communicate with the FastAPI backend to deliver the AI features!
