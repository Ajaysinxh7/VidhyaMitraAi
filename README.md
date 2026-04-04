# 🎓 VidyaMitra
> Your AI-powered Career and Interview Assistant

VidyaMitra is a comprehensive, end-to-end platform designed to help candidates prepare for their dream roles. It bridges the gap between learning and getting hired by providing personalized AI-driven roadmaps, resume parsing, and interactive mock interviews—all powered by modern AI models.

## 🚀 Key Features

- 📄 **Smart Resume Parsing** - Extract skills, experiences, and identify gaps directly from your uploaded resume.
- 🗺️ **Career Roadmaps** - Get personalized, actionable steps based on where your current skills are versus the role you want.
- 🎯 **Interactive AI Mock Interviews** - Practice against an AI interviewer tailored strictly to your skill set and target job.
- 📊 **Real-time Analytics** - Monitor progress and feedback immediately after an interview session.

## 🛠️ Technology Stack

VidyaMitra is split into two distinct applications to separate concerns perfectly between the client and server.

- **`vidyamitra-frontend`**: Built with **React** and **Vite** using TypeScript for lightning-fast HMR and solid type safety. Styled with TailwindCSS and Framer Motion.
- **`vidyamitra-backend`**: Built with **FastAPI** (Python 3.11+). Handles all AI integrations (Groq LLM) and database interactions securely.
- **Database & Auth**: Powered by **Supabase**.

## 📖 Documentation

- **[Local Setup Guide](SETUP.md)**: Detailed step-by-step instructions on running the project locally.
- **[Routing Sheet](vidyamitra-backend/app/ROUTING_SHEET.md)**: Backend API architecture layer setup.

---

## 🔒 Security Practices

- **Never** commit `.env` files to source control. They are protected by `.gitignore`.
- Your `SUPABASE_SERVICE_ROLE_KEY` and `GROQ_API_KEY` are incredibly sensitive and safely isolated in the **backend**.
- Only harmless, public keys like `VITE_SUPABASE_URL` are exposed on the **frontend**.
