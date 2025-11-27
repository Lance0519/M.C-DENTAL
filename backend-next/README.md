# M.C. Dental Clinic - Backend API

Next.js API backend for the M.C. Dental Clinic appointment management system.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project
- Resend account (for email)

### Installation

```bash
npm install
```

### Environment Setup

1. Copy the environment template:
```bash
cp ENV_SETUP.md .env.local
```

2. Fill in your environment variables (see `ENV_SETUP.md` for details)

### Development

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api`

### Production Build

```bash
npm run build
npm start
```

## 📦 Deployment to Vercel

### Option 1: Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: Git Integration

1. Push to GitHub
2. Import project in Vercel dashboard
3. Set root directory to `backend-next`
4. Configure environment variables
5. Deploy

### Environment Variables

Configure these in Vercel dashboard under **Settings** > **Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `SUPABASE_DB_PASSWORD` | ✅ | Database password |
| `JWT_SECRET` | ✅ | JWT signing secret (32+ chars) |
| `RESEND_API_KEY` | ✅ | Resend API key |
| `EMAIL_FROM_ADDRESS` | ✅ | Verified sender email |
| `CLIENT_BASE_URL` | ✅ | Frontend URL |

See `ENV_SETUP.md` for detailed setup instructions.

## 🔧 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/recover` | Password recovery |
| POST | `/api/auth/reset` | Password reset |
| GET | `/api/auth/verify-reset-token` | Verify reset token |

### Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Create appointment |
| PUT | `/api/appointments?id=` | Update appointment |
| DELETE | `/api/appointments?id=` | Delete appointment |

### Patients

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/patients` | List patients |
| POST | `/api/patients` | Create patient |
| PUT | `/api/patients?id=` | Update patient |
| DELETE | `/api/patients?id=` | Delete patient |

### Doctors

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctors |
| POST | `/api/doctors` | Create doctor |
| PUT | `/api/doctors?id=` | Update doctor |
| DELETE | `/api/doctors?id=` | Delete doctor |

### Services

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/services` | List services |
| POST | `/api/services` | Create service |
| PUT | `/api/services?id=` | Update service |
| DELETE | `/api/services?id=` | Delete service |

### Schedules

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/schedules` | List schedules |
| POST | `/api/schedules` | Create schedule |
| PUT | `/api/schedules?id=` | Update schedule |
| DELETE | `/api/schedules?id=` | Delete schedule |

### Promotions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/promotions` | List promotions |
| POST | `/api/promotions` | Create promotion |
| PUT | `/api/promotions?id=` | Update promotion |
| DELETE | `/api/promotions?id=` | Delete promotion |

### Medical History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/medical-history` | List records |
| POST | `/api/medical-history` | Create record |
| PUT | `/api/medical-history?id=` | Update record |
| DELETE | `/api/medical-history?id=` | Delete record |

### Clinic Schedule

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/clinic-schedule` | Get clinic hours |
| PUT | `/api/clinic-schedule` | Update clinic hours |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | API health check |

## 🗄️ Database

This project uses Supabase (PostgreSQL). Database migrations are located in `supabase/migrations/`.

### Running Migrations

Migrations should be run through the Supabase dashboard or CLI:

```bash
supabase db push
```

## 🔐 Authentication

The API uses JWT-based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <token>
```

## 📝 License

Proprietary - M.C. Dental Clinic
