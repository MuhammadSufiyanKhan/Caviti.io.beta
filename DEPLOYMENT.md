# Production Deployment Guide for Vercel

## 🚀 Pre-Deployment Checklist

### 1. **Environment Variables Setup**
- [ ] Copy `.env.example` to `.env.production.local`
- [ ] Fill in ALL required variables from your Supabase, API services
- [ ] **DO NOT** commit any `.env*` files to Git
- [ ] Verify all Vercel environment variables are set in dashboard

### 2. **Security**
- [ ] Rotate all API keys (Supabase, GROQ, OpenAI, etc.)
- [ ] Ensure `.env.local` is in `.gitignore` ✅ (DONE)
- [ ] Review SUPABASE_SERVICE_ROLE_KEY permissions (use least privilege)
- [ ] Enable CORS only for your production domain
- [ ] Set up rate limiting for API routes

### 3. **Database**
- [ ] Run migrations on production Supabase:
  ```bash
  # In Supabase dashboard: SQL Editor → Run scripts
  # 1. supabase/admin-dashboard-schema.sql
  # 2. supabase/admin-policies.sql
  # 3. supabase/rls-policies.sql
  # 4. supabase/seed-admin-dashboard.sql
  ```
- [ ] Test RLS policies (Row Level Security)
- [ ] Verify backups are enabled in Supabase

### 4. **Build & Performance**
- [ ] TypeScript target updated to ES2018 ✅ (DONE)
- [ ] Run `npm run build` locally and verify no errors
- [ ] Test production build: `npm run build && npm start`
- [ ] Verify Next.js security headers are set ✅ (DONE)

### 5. **Vercel Configuration**
- [ ] vercel.json created ✅ (DONE)
- [ ] Region set to nearest to users (currently iad1 - US East)

## 📋 Deployment Steps

### Step 1: Clean Up Repository
```bash
# Verify .env.local is NOT tracked
git status
# Should show: modified: .gitignore

# If .env.local was already committed:
git rm --cached .env.local
git commit -m "Remove .env.local from tracking"
```

### Step 2: Commit Production Files
```bash
git add .gitignore .env.example next.config.ts package.json vercel.json tsconfig.json
git commit -m "chore: production-ready setup for Vercel

- Updated TypeScript target to ES2018
- Added comprehensive next.config.ts
- Created .env.example template
- Added vercel.json configuration
- Enhanced .gitignore for security
- Updated build scripts"

git push origin main
```

### Step 3: Set Up Vercel Project
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Select Next.js framework
4. In "Environment Variables" section, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GROQ_API_KEY`
   - `APIFY_API_KEY`
   - `SERPAPI_KEY`
   - `RESEND_API_KEY`
   - `FIRECRAWL_API_KEY`
   - `ADMIN_EMAILS`
   - `NEXT_PUBLIC_SITE_URL=https://yourdomain.com`

5. Click "Deploy"

### Step 4: Post-Deployment Verification
```bash
# After deployment succeeds:
# 1. Check deployment URL in Vercel dashboard
# 2. Test critical user flows:
#    - Sign up flow
#    - Dashboard access
#    - Report generation
#    - Admin panel access

# 3. Monitor logs:
#    - Vercel Function Logs
#    - Browser Console (Dev Tools)
#    - Supabase Database Logs
```

### Step 5: Enable Custom Domain
1. In Vercel dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records (varies by provider)
4. Enable SSL certificate (automatic with Vercel)

## 🔍 Troubleshooting

### Build Error: "TypeScript compilation failed"
- Verify ES2018 target in tsconfig.json ✅ (DONE)
- Check all imports are valid
- Run `npm run type-check` locally

### Deployment Error: "Missing environment variables"
- Verify all vars are set in Vercel dashboard
- Check `NEXT_PUBLIC_` prefix for client-side vars
- Redeploy after adding vars

### API Routes Failing (500 errors)
- Check Function Logs in Vercel dashboard
- Verify Supabase credentials in env vars
- Ensure API key permissions are correct

### Database Connection Issues
- Test connection in Supabase dashboard first
- Verify RLS policies allow your app
- Check CORS settings in Supabase

## 📊 Monitoring & Maintenance

### Daily
- Monitor Vercel deployment health
- Check error logs in Vercel Functions

### Weekly
- Review API usage (GROQ, Serpapi, etc.)
- Monitor Supabase performance

### Monthly
- Update deprecated dependencies
- Review and rotate API keys
- Check security advisories

## 🔐 Production Security Checklist

- [ ] All API keys rotated
- [ ] Environment variables secured in Vercel
- [ ] `.env.local` never committed
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Admin panel protected with authentication
- [ ] Database backups enabled
- [ ] Monitoring/alerting configured

## 🆘 Rollback Procedure

If deployment fails:
1. Vercel → Deployments → Click previous successful deployment
2. Click "Redeploy" for instant rollback
3. Or revert commit: `git revert <commit-hash>` and push

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Supabase Docs: https://supabase.com/docs
