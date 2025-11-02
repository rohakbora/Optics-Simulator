# Quick Deployment Checklist

## Before You Deploy

- [ ] Get OpenRouter API key from https://openrouter.ai
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Test locally to ensure everything works

## Backend Deployment

1. Deploy backend:
   ```bash
   cd backend
   vercel --prod
   ```

2. Add environment variable in Vercel dashboard:
   - `OPENROUTER_API_KEY` = your-api-key

3. Copy backend URL (e.g., `https://your-backend.vercel.app`)

## Frontend Deployment

1. Update `.env.production` with your backend URL:
   ```
   VITE_API_URL=https://your-backend.vercel.app
   ```

2. Deploy frontend:
   ```bash
   cd ..
   vercel --prod
   ```

3. Add environment variable in Vercel dashboard:
   - `VITE_API_URL` = your-backend-url

## Verify Deployment

- [ ] Visit frontend URL
- [ ] Test AI Assistant with a prompt
- [ ] Check components render correctly
- [ ] Verify ray tracing works
- [ ] Test all component types

## URLs to Save

- Frontend: ___________________________
- Backend: ___________________________
- OpenRouter Dashboard: https://openrouter.ai/keys

Done! 🎉
