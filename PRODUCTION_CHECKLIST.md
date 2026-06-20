# 🚀 Production Readiness Checklist

## ✅ Completed

- [x] **TypeScript Configuration**
  - Updated target to ES2018 (regex `s` flag support)
  - Type checking enabled for production builds

- [x] **Security**
  - `.env.local` added to `.gitignore`
  - Debug/test files excluded from git
  - Environment variables template created (`.env.example`)
  - Security headers configured in `next.config.ts`

- [x] **Build Configuration**
  - Enhanced `next.config.ts` with:
    - Image optimization
    - Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
    - Cache control for API routes
    - Webpack optimization
  - Production build scripts added to `package.json`

- [x] **Vercel Setup**
  - `vercel.json` configuration file created
  - Region configured for US East (iad1)
  - API function memory/timeout settings configured

- [x] **Documentation**
  - `DEPLOYMENT.md` created (step-by-step guide)
  - `.env.production.example` template created

## ⚠️ To Do Before Deployment

### 1. **Environment Variables** (CRITICAL)
```bash
# In Vercel Dashboard (Settings → Environment Variables)
NEXT_PUBLIC_SUPABASE_URL = your_production_url
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_production_service_role_key
GROQ_API_KEY = your_groq_key
APIFY_API_KEY = your_apify_key
SERPAPI_KEY = your_serpapi_key
RESEND_API_KEY = your_resend_key
FIRECRAWL_API_KEY = your_firecrawl_key
ADMIN_EMAILS = admin@yourdomain.com
NEXT_PUBLIC_SITE_URL = https://yourdomain.com
```

### 2. **Database Setup**
- [ ] Connect production Supabase project
- [ ] Run migration scripts in Supabase SQL Editor:
  1. `supabase/admin-dashboard-schema.sql`
  2. `supabase/admin-policies.sql`
  3. `supabase/rls-policies.sql`
  4. `supabase/seed-admin-dashboard.sql`
- [ ] Test RLS policies
- [ ] Enable automated backups

### 3. **Pre-Deployment Testing**
```bash
npm run build           # Should complete without errors
npm start               # Test production build locally
npm run type-check      # Verify all types are correct
npm run lint            # Check for linting errors
```

### 4. **Vercel Deployment**
1. Push latest changes to main branch
2. Go to https://vercel.com/dashboard
3. Import repository (if not already imported)
4. Add environment variables
5. Click "Deploy"
6. Monitor deployment in dashboard
7. Run smoke tests on production URL

### 5. **Post-Deployment**
- [ ] Test sign-up flow
- [ ] Test dashboard access
- [ ] Test report generation
- [ ] Test admin panel
- [ ] Verify all API endpoints
- [ ] Check logs for errors
- [ ] Monitor performance metrics

### 6. **Security Verification**
- [ ] HTTPS working
- [ ] Security headers present (check with browser DevTools)
- [ ] Rate limiting active
- [ ] API keys properly restricted
- [ ] Database backups active

### 7. **Domain Setup**
- [ ] Add custom domain in Vercel
- [ ] Update DNS records
- [ ] SSL certificate active
- [ ] Redirect www → non-www (or vice versa)

## 📋 Files Ready for Deployment

✅ Configuration Files:
- `tsconfig.json` - ES2018 target
- `next.config.ts` - Production optimizations
- `vercel.json` - Vercel platform config
- `package.json` - Build scripts
- `.gitignore` - Security (env files excluded)
- `.env.example` - Environment template
- `.env.production.example` - Production template

✅ Documentation:
- `DEPLOYMENT.md` - Full deployment guide
- `PRODUCTION_CHECKLIST.md` - This file

## 🔥 Critical Reminders

⚠️ **NEVER commit these files to Git:**
- `.env.local`
- `.env.production.local`
- `.env.*.local`
- Any file with API keys or secrets

⚠️ **When setting Vercel environment variables:**
- Use Vercel Dashboard (Settings → Environment Variables)
- DO NOT use `.env.local` for production
- DO NOT hardcode secrets in code

⚠️ **API Keys should be rotated:**
- Before first production deployment
- Quarterly for security
- Immediately if compromised

## 📞 Useful Links

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Next.js Production Checklist](https://nextjs.org/docs/going-to-production)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/self-hosting/security)
- [Environment Variables in Vercel](https://vercel.com/docs/projects/environment-variables)

## 🚀 Quick Deploy Commands

```bash
# 1. Update .gitignore and configs
git add .gitignore next.config.ts tsconfig.json package.json vercel.json .env.example .env.production.example DEPLOYMENT.md PRODUCTION_CHECKLIST.md

# 2. Remove debug files from tracking
git rm --cached DEBUG_RUN.md verify-admin-setup.js verify-env.js src/app/dashboard/test.txt 2>/dev/null || true

# 3. Commit everything
git commit -m \"chore: production-ready setup

- Updated TypeScript ES2018 target
- Enhanced security headers and optimization
- Removed debug files from tracking
- Added deployment documentation
- Created environment templates\"

# 4. Push to main
git push origin main

# 5. Deploy on Vercel
# (Click Deploy in Vercel Dashboard after pushing)
```

---

**Last Updated:** June 20, 2026
**Next Review:** Before major changes to deployment configuration
