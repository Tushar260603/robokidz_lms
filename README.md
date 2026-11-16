# RoboKidz LMS

A full-stack Learning Management System built with **React + Vite** (frontend) and **FastAPI + MySQL** (backend).

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Axios |
| Backend | Python 3.11+, FastAPI, SQLAlchemy 2.0 |
| Database | MySQL 8 |
| Auth | JWT (python-jose + passlib/bcrypt) |

## Quick Start

### 1. Database
```sql
CREATE DATABASE robokidz_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env   # then fill in your values
uvicorn app.main:app --reload
```
API docs: http://localhost:8000/docs  
Health check: http://localhost:8000/health

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
App: http://localhost:5173

## Environment Variables
See [`.env.example`](.env.example) for all required variables.

## Project Structure
```
├── backend/
│   ├── app/
│   │   ├── core/        # config, security, database
│   │   ├── models/      # SQLAlchemy ORM models
│   │   ├── schemas/     # Pydantic request/response schemas
│   │   ├── routers/     # FastAPI route handlers
│   │   ├── services/    # business logic
│   │   └── deps/        # shared FastAPI dependencies
│   └── uploads/         # uploaded files (gitignored)
└── frontend/            # React + Vite SPA
```
