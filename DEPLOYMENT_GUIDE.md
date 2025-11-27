# 🚀 M.C. Dental Clinic - Complete Deployment Guide

## 📋 Overview

| Component | Platform | Cost |
|-----------|----------|------|
| Backend (Next.js) | Vercel | Free ✅ |
| Frontend (Vite/React) | Netlify | Free ✅ |
| Database | Supabase | Free ✅ |

---

## 📦 Part 1: Database Setup (Supabase)

### Step 1.1: Create Supabase Account
1. Go to **[supabase.com](https://supabase.com)**
2. Click **"Start your project"**
3. Sign in with GitHub (recommended) or create an account

### Step 1.2: Create New Project
1. Click **"New Project"**
2. Fill in the details:
   - **Name**: `mc-dental-clinic`
   - **Database Password**: Create a strong password (⚠️ **SAVE THIS** - you'll need it later!)
   - **Region**: Choose closest to your users (e.g., `Southeast Asia (Singapore)`)
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be provisioned

### Step 1.3: Get Your API Credentials
1. Once project is ready, go to **Project Settings** (gear icon in sidebar)
2. Click **"API"** in the left menu
3. Copy and save these values:
   ```
   Project URL:        https://xxxxxxxxx.supabase.co
   anon (public) key:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   ⚠️ **Keep `service_role` key SECRET** - never expose it to the frontend!

### Step 1.4: Run Database Migrations
1. In Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Run each migration file from `backend-next/supabase/migrations/` in order:

   **Order of migrations:**
   ```
   1. 20251124_add_appointment_workflow_fields.sql
   2. 20251126_add_active_column_to_services_promotions.sql
   3. 20251126_add_cancellation_requested_status.sql
   4. 20251126_add_images_to_medical_history.sql
   5. 20251126_add_payment_columns_to_appointments.sql
   6. 20251126_add_service_name_to_appointments.sql
   7. 20251126_add_profile_image_columns.sql
   8. 20251126_create_appointment_services_table.sql
   9. 20251126_create_audit_logs_table.sql
   10. 20251126_seed_schedules_promotions.sql
   11. 20251127_add_new_notification_types.sql
   ```

4. For each file:
   - Copy the SQL content
   - Paste into the SQL Editor
   - Click **"Run"**
   - Verify it says "Success"

### Step 1.5: Create Storage Bucket
1. Go to **Storage** (left sidebar)
2. Click **"New bucket"**
3. Create a bucket named: `patient-images`
4. Make it **Public** (toggle on)
5. Click **"Create bucket"**

### Step 1.6: Set Storage Policy
1. Click on `patient-images` bucket
2. Go to **Policies** tab
3. Click **"New Policy"** → **"For full customization"**
4. Add these policies:

   **Policy 1 - Allow uploads (INSERT):**
   ```sql
   CREATE POLICY "Allow authenticated uploads"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'patient-images');
   ```

   **Policy 2 - Allow public read (SELECT):**
   ```sql
   CREATE POLICY "Allow public read"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'patient-images');
   ```

---

## 🖥️ Part 2: Backend Deployment (Vercel)

### Step 2.1: Prepare Your Repository
1. Make sure your code is pushed to GitHub
2. Your repo should have the `backend-next` folder

### Step 2.2: Create Vercel Account
1. Go to **[vercel.com](https://vercel.com)**
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"**
4. Authorize Vercel to access your GitHub

### Step 2.3: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find your repository and click **"Import"**
3. ⚠️ **IMPORTANT**: Configure the project:
   
   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `backend-next` |
   | **Framework Preset** | Next.js |
   | **Build Command** | `npm run build` (default) |
   | **Output Directory** | `.next` (default) |

### Step 2.4: Add Environment Variables
1. Before deploying, expand **"Environment Variables"**
2. Add each variable (click "Add" after each):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project-id.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
   | `SUPABASE_DB_PASSWORD` | `your-database-password` |
   | `JWT_SECRET` | Generate: `openssl rand -base64 32` |
   | `RESEND_API_KEY` | `re_placeholder` (or your actual key) |
   | `EMAIL_FROM_ADDRESS` | `noreply@yourdomain.com` |
   | `CLIENT_BASE_URL` | `https://your-frontend.netlify.app` (update after frontend deploy) |

### Step 2.5: Deploy
1. Click **"Deploy"**
2. Wait 2-5 minutes for build to complete
3. Once done, you'll get a URL like: `https://mc-dental-api.vercel.app`
4. **Save this URL** - you'll need it for the frontend!

### Step 2.6: Test Backend
1. Visit: `https://your-backend-url.vercel.app/api/doctors`
2. You should see JSON data (or empty array if no data yet)
3. If you see an error, check the Vercel logs under **"Deployments"**

---

## 🌐 Part 3: Frontend Deployment (Netlify)

### Step 3.1: Create Netlify Account
1. Go to **[netlify.com](https://netlify.com)**
2. Click **"Sign up"**
3. Choose **"GitHub"** to sign up with GitHub
4. Authorize Netlify

### Step 3.2: Import Project
1. Click **"Add new site"** → **"Import an existing project"**
2. Choose **"Deploy with GitHub"**
3. Select your repository

### Step 3.3: Configure Build Settings
1. Configure the following:

   | Setting | Value |
   |---------|-------|
   | **Base directory** | `frontend` |
   | **Build command** | `npm run build` |
   | **Publish directory** | `frontend/dist` |

### Step 3.4: Add Environment Variable
1. Click **"Add environment variables"** → **"New variable"**
2. Add:

   | Key | Value |
   |-----|-------|
   | `VITE_API_BASE_URL` | `https://your-backend.vercel.app/api` |

   ⚠️ Replace with your actual Vercel backend URL from Part 2!

### Step 3.5: Deploy
1. Click **"Deploy site"**
2. Wait 2-5 minutes
3. Once done, you'll get a URL like: `https://random-name-123.netlify.app`

### Step 3.6: (Optional) Custom Domain on Netlify
1. Go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Follow the DNS configuration instructions

---

## 🔄 Part 4: Update Backend with Frontend URL

### Step 4.1: Update CLIENT_BASE_URL
1. Go back to **Vercel Dashboard**
2. Select your backend project
3. Go to **Settings** → **Environment Variables**
4. Find `CLIENT_BASE_URL`
5. Click **Edit** and update to your Netlify URL:
   ```
   https://your-site-name.netlify.app
   ```
6. Click **Save**

### Step 4.2: Redeploy Backend
1. Go to **Deployments** tab
2. Click on the latest deployment
3. Click **"..."** menu → **"Redeploy"**
4. Wait for deployment to complete

---

## ✅ Part 5: Final Testing Checklist

### Test the Live Application

- [ ] **Homepage loads**: Visit your Netlify URL
- [ ] **Login works**: Try logging in with test credentials
- [ ] **API connection**: Check browser console for errors
- [ ] **Registration**: Create a new account
- [ ] **Appointments**: Book an appointment
- [ ] **Dark mode**: Toggle between light/dark themes

### Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| CORS errors | Check `CLIENT_BASE_URL` matches your frontend URL exactly |
| 500 errors | Check Vercel logs; usually missing env variables |
| Blank page | Check browser console; usually API URL mismatch |
| Login fails | Verify `JWT_SECRET` is set correctly |
| Images don't load | Check Supabase storage bucket policies |

---

## 📝 Quick Reference - All URLs

After deployment, you should have:

```
🗄️  Database:  https://your-project.supabase.co
🖥️  Backend:   https://mc-dental-api.vercel.app
🌐  Frontend:  https://mc-dental.netlify.app
```

---

## 🔐 Security Checklist

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is only in backend env vars (never in frontend!)
- [ ] `JWT_SECRET` is a strong random string (32+ characters)
- [ ] Database password is secure and stored safely
- [ ] Frontend only has `VITE_API_BASE_URL` (no secrets!)

---

## 🆘 Need Help?

1. **Vercel Logs**: Dashboard → Project → Deployments → Click deployment → Logs
2. **Netlify Logs**: Dashboard → Site → Deploys → Click deploy → Deploy log
3. **Supabase Logs**: Dashboard → Project → Database → Logs
4. **Browser Console**: Press F12 → Console tab

---

## 🎉 Congratulations!

Your M.C. Dental Clinic application is now live and accessible worldwide!

**Total Cost: $0/month** (within free tier limits)

### Free Tier Limits:
- **Vercel**: 100GB bandwidth/month, unlimited deployments
- **Netlify**: 100GB bandwidth/month, 300 build minutes/month
- **Supabase**: 500MB database, 1GB file storage, 2GB bandwidth


