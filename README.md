# Expense Tracker

A full-stack expense tracker using React (Vite), Node.js/Express, and MongoDB.

## Project Structure

- `frontend/` - React app
- `backend/` - Express API and MongoDB models

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB (local or Atlas)

## Environment Setup

1. Backend env:
   - Copy `backend/.env.example` to `backend/.env`
   - Set `MONGO_URI` for your database
2. Frontend env (optional):
   - Copy `frontend/.env.example` to `frontend/.env`
   - Set `VITE_API_URL` if you do not want to use Vite proxy

## Install Dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

## Run in Development

Terminal 1:
```bash
cd backend
npm run dev
```

Terminal 2:
```bash
cd frontend
npm run dev
```

Frontend default URL: `http://localhost:5173`
Backend default URL: `http://localhost:5000`

## Common Issues

- `vite is not recognized`:
  - Run `npm install` inside `frontend/`
- `MongoServerSelectionError`:
  - Check `backend/.env` and your `MONGO_URI`
- CORS/API errors:
  - Ensure backend is running on port `5000`
  - Ensure frontend uses `VITE_API_URL` or Vite proxy
# Expense-Tracker
