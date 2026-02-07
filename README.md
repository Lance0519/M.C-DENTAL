# M.C Dental Clinic - Appointment Management System

A modern dental clinic management system with patient booking, appointment management, and smile gallery features.

![M.C Dental Clinic](frontend/public/assets/images/logo.png)

---

## 🚀 Quick Start

### Prerequisites

Make sure you have the following installed:
- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional) - [Download](https://git-scm.com/)

### Verify Installation

Open Command Prompt (CMD) and run:

```cmd
node --version
npm --version
```

---

## 📦 Project Structure

```
Projects_1/
├── frontend/          # React + Vite frontend
├── backend-next/      # Next.js API backend
└── README.md
```

---

## 🔧 Setup Instructions

### Step 1: Clone or Navigate to Project

```cmd
cd "C:\Users\justi\Desktop\Backup for codes\ETO NA IMMIGRATE SA SUPABASE\With dark mode latest\Projects_1" (EXAMPLE LANG TO DEPENDE KUNG NASAAN NAKALAY YUNG FOLDER)
```

---

### Step 2: Backend Setup

#### 2.1 Navigate to Backend Directory

```cmd
cd backend-next
```

#### 2.2 Install Dependencies

```cmd
npm install
```

#### 2.3 Create Environment File

Create a file named `.env.local` in the `backend-next` folder with the following content:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Secret (generate a random string)
JWT_SECRET=your_jwt_secret_key_here

# Optional: Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

++++++++++++++++++++++++++++++++++++++++++
ETO YON 
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://picpieblvlmrpxgfcjmq.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpY3BpZWJsdmxtcnB4Z2Zjam1xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzk3MDgzMiwiZXhwIjoyMDc5NTQ2ODMyfQ.4N6jV27rA80Tj_lxfGXmdyYbGuH741R9GD9iqsiytCY
SUPABASE_DB_PASSWORD=DentalClini123

# Authentication
JWT_SECRET=32a30fc5-3f33-4147-9557-74e148b23019


# Email (Resend) - optional for now
RESEND_API_KEY=re_Ksrr7LYP_HrhtFoZBbEQdzdbu8xmz1HYa
EMAIL_FROM_ADDRESS=M.C. Dental <onboarding@resend.dev>

# Frontend URL
CLIENT_BASE_URL=http://localhost:5173

____________________________________________________________
> **Note:** Get your Supabase credentials from [Supabase Dashboard](https://supabase.com/dashboard) → Project Settings → API

#### 2.4 Start Backend Server

```cmd
npm run dev
```

The backend will start on **http://localhost:3000**

> Keep this terminal window open!

---

### Step 3: Frontend Setup

#### 3.1 Open a New Command Prompt Window

Press `Win + R`, type `cmd`, and press Enter.

#### 3.2 Navigate to Frontend Directory

```cmd
cd "C:\Users\justi\Desktop\Backup for codes\ETO NA IMMIGRATE SA SUPABASE\With dark mode latest\Projects_1\frontend"
```

#### 3.3 Install Dependencies

```cmd
npm install
```

#### 3.4 Start Frontend Server

```cmd
npm run dev
```

The frontend will start on **http://localhost:5173**

---

## 🌐 Access the Application

| Service | URL |
|---------|-----|
| **Frontend** | http://localhost:5173 |
| **Backend API** | http://localhost:3000/api |

### Default Admin Account

```
Username: admin
Password: Admin@123
```

---

## 📋 Running Both Servers (Quick Method)

### Option 1: Two Terminal Windows

**Terminal 1 (Backend):**
```cmd
cd "C:\Users\justi\Desktop\Backup for codes\ETO NA IMMIGRATE SA SUPABASE\With dark mode latest\Projects_1\backend-next"
npm run dev
```

**Terminal 2 (Frontend):**
```cmd
cd "C:\Users\justi\Desktop\Backup for codes\ETO NA IMMIGRATE SA SUPABASE\With dark mode latest\Projects_1\frontend"
npm run dev
```

### Option 2: Using Windows Terminal (Split Panes)

If you have Windows Terminal installed, you can run both in split panes.

---

## 🛑 Stopping the Servers

Press `Ctrl + C` in each terminal window to stop the servers.

---

## 🔄 Common Commands

### Backend Commands

```cmd
cd backend-next

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Frontend Commands

```cmd
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## 🗄️ Database Setup (Supabase)

### Run Migrations

In your Supabase SQL Editor, run the migration files in order:

1. `backend-next/supabase/migrations/00_clean_install.sql`
2. `backend-next/supabase/migrations/01_seed_data.sql`
3. `backend-next/supabase/migrations/20251127_update_services_and_promotions.sql`
4. `backend-next/supabase/migrations/20251127_create_gallery_cases.sql`

---

## 🐛 Troubleshooting

### Port Already in Use

If you see "Port 3000 is already in use":

```cmd
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace PID with the actual number)
taskkill /PID <PID> /F
```

### Node Modules Issues

Delete and reinstall:

```cmd
# Backend
cd backend-next
rmdir /s /q node_modules
del package-lock.json
npm install

# Frontend
cd frontend
rmdir /s /q node_modules
del package-lock.json
npm install
```

### Clear npm Cache

```cmd
npm cache clean --force
```

### Backend Not Connecting

1. Verify `.env.local` exists in `backend-next` folder
2. Check Supabase credentials are correct
3. Ensure backend is running on port 3000

### Frontend Not Loading Data

1. Make sure backend is running first
2. Check browser console for errors (F12 → Console)
3. Verify backend URL is `http://localhost:3000`

---

## 📱 Features

- ✅ Patient appointment booking
- ✅ Admin/Staff dashboard
- ✅ Doctor management
- ✅ Service management
- ✅ Promotions management
- ✅ **Smile Gallery** (Before/After photos)
- ✅ Clinic schedule management
- ✅ Dark mode support
- ✅ Responsive design

---

## 🔐 User Roles

| Role | Access |
|------|--------|
| **Admin** | Full system access |
| **Staff** | Patient & appointment management |
| **Patient** | View appointments, book new ones |

---

## 📞 Support

For issues or questions, please contact the development team.

---

## 📄 License

This project is proprietary software for M.C Dental Clinic.

---

*Last updated: November 2024*
