# M.C. Dental Clinic - Appointment Management System

A modern, full-stack dental clinic appointment management system built with React (Vite) frontend and Next.js API backend, powered by Supabase.

## 🏗️ Architecture

```
Projects_1/
├── frontend/          # React + Vite frontend application
├── backend-next/      # Next.js API backend
├── common/            # Shared utilities (legacy)
└── assets/            # Static assets
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend)
- Resend account (for email)

### Local Development

#### 1. Backend Setup

```bash
cd backend-next
npm install

# Create .env.local with required variables (see ENV_SETUP.md)
npm run dev
```

The API will be available at `http://localhost:3000/api`

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

## 📦 Deployment

### Backend Deployment (Vercel)

1. Push your code to GitHub
2. Import the `backend-next` directory in Vercel
3. Configure environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_DB_PASSWORD`
   - `JWT_SECRET`
   - `RESEND_API_KEY`
   - `EMAIL_FROM_ADDRESS`
   - `CLIENT_BASE_URL`

4. Deploy!

See `backend-next/ENV_SETUP.md` for detailed environment variable documentation.

### Frontend Deployment (Vercel)

1. Import the `frontend` directory in Vercel
2. Set the `VITE_API_BASE_URL` environment variable to your backend URL
3. Deploy!

## 🔐 Default Accounts

For testing purposes, the following accounts are available:

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Staff | staff | staff123 |
| Patient | patient | patient123 |

> ⚠️ **Important**: Change these credentials in production!

## 📋 Features

### Patient Features
- Book appointments online
- Health screening before booking
- View appointment history
- Request reschedule/cancellation
- Receive notifications

### Staff Features
- Manage appointments
- View patient records
- Handle reschedule/cancellation requests
- Access reports

### Admin Features
- All staff features
- Manage doctors and services
- Manage staff accounts
- Configure clinic schedule
- View audit logs
- Access analytics and reports

## 🛠️ Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Zustand for state management
- React Router for navigation

### Backend
- Next.js 16 API Routes
- Supabase (PostgreSQL database)
- JWT authentication
- Resend for email

## 📁 Project Structure

### Frontend (`/frontend`)
```
src/
├── app/           # App configuration
├── components/    # Reusable UI components
├── features/      # Feature-based modules
├── hooks/         # Custom React hooks
├── lib/           # Utilities and services
├── store/         # State management
├── styles/        # Global styles
└── types/         # TypeScript types
```

### Backend (`/backend-next`)
```
src/
├── app/
│   └── api/       # API route handlers
└── lib/           # Shared utilities
```

## 🔧 API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/auth/login` | POST | User authentication |
| `/api/auth/register` | POST | User registration |
| `/api/auth/recover` | POST | Password recovery |
| `/api/appointments` | GET, POST, PUT, DELETE | Appointment management |
| `/api/patients` | GET, POST, PUT, DELETE | Patient management |
| `/api/doctors` | GET, POST, PUT, DELETE | Doctor management |
| `/api/services` | GET, POST, PUT, DELETE | Service management |
| `/api/schedules` | GET, POST, PUT, DELETE | Schedule management |
| `/api/promotions` | GET, POST, PUT, DELETE | Promotion management |
| `/api/medical-history` | GET, POST, PUT, DELETE | Medical history |
| `/api/clinic-schedule` | GET, PUT | Clinic hours |

## 📝 License

This project is proprietary software for M.C. Dental Clinic.

## 👥 Support

For questions or issues, please contact the development team.
