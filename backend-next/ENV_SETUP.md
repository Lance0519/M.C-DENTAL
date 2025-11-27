# Environment Variables Setup

This document describes all required environment variables for the M.C. Dental Clinic backend.

## Required Environment Variables

### Supabase Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://your-project-id.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key (admin access) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `SUPABASE_DB_PASSWORD` | Database password set during project creation | `your-database-password` |

> ⚠️ **Warning**: The `SUPABASE_SERVICE_ROLE_KEY` has admin privileges. Never expose it to the client!

### Authentication

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing (min 32 characters) | `your-super-secret-jwt-key-min-32-characters` |

Generate a secure JWT secret using:
```bash
openssl rand -base64 32
```

### Email Configuration (Resend)

| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_API_KEY` | Resend API Key | `re_xxxxxxxxxxxxxxxxxxxxxxxxx` |
| `EMAIL_FROM_ADDRESS` | Verified email address for sending | `noreply@yourdomain.com` |

Get your Resend API key from: https://resend.com/api-keys

### Client Configuration

| Variable | Description | Example |
|----------|-------------|---------|
| `CLIENT_BASE_URL` | Frontend application URL | `http://localhost:5173` (dev) or `https://your-frontend.vercel.app` (prod) |

## Setting Up Environment Variables

### Local Development

1. Create a `.env.local` file in the `backend-next` directory
2. Add all required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-database-password
JWT_SECRET=your-jwt-secret-min-32-characters
RESEND_API_KEY=re_your-resend-api-key
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
CLIENT_BASE_URL=http://localhost:5173
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to **Settings** > **Environment Variables**
3. Add each variable with appropriate values for production
4. Make sure to use production values (e.g., production Supabase URL, verified email domain)

## Supabase Setup

1. Create a new project at https://supabase.com
2. Run the database migrations in `supabase/migrations/`
3. Copy your project URL and service role key from **Project Settings** > **API**
4. Note your database password (set during project creation)

## Email Setup (Resend)

1. Create an account at https://resend.com
2. Verify your domain for sending emails
3. Generate an API key
4. Use a verified email address as `EMAIL_FROM_ADDRESS`

