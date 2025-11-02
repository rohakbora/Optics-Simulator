# Vercel Deployment Guide

This guide will help you deploy both the frontend and backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm install -g vercel`
3. An OpenRouter API key (from https://openrouter.ai)

## Option 1: Deploy via Vercel Dashboard (Recommended)

### Step 1: Deploy Backend

1. Go to https://vercel.com/new
2. Import your Git repository
3. Configure the project:
   - **Framework Preset**: Other
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty
   - **Output Directory**: Leave empty
4. Add Environment Variable:
   - Key: `OPENROUTER_API_KEY`
   - Value: Your OpenRouter API key
5. Click "Deploy"
6. Copy your backend URL (e.g., `https://your-backend.vercel.app`)

### Step 2: Deploy Frontend

1. Go to https://vercel.com/new again
2. Import the same repository (or create a new project)
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `.` (leave as root)
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - Key: `VITE_API_URL`
   - Value: Your backend URL from Step 1 (e.g., `https://your-backend.vercel.app`)
5. Click "Deploy"

### Step 3: Update CORS

1. Go to your backend deployment settings
2. Add your frontend URL to the CORS configuration
3. Edit `.env.production` locally and replace with your actual backend URL
4. Push changes and redeploy

## Option 2: Deploy via CLI

### Deploy Backend

```bash
cd backend
vercel --prod
```

When prompted:
- Set up and deploy: Yes
- Scope: Select your account
- Link to existing project: No
- Project name: `optical-designer-backend` (or your choice)
- Directory: `./`
- Override settings: No

After deployment, set the environment variable:
```bash
vercel env add OPENROUTER_API_KEY
```
Enter your OpenRouter API key when prompted.

Copy the deployment URL.

### Deploy Frontend

```bash
cd ..
vercel --prod
```

When prompted:
- Set up and deploy: Yes
- Scope: Select your account
- Link to existing project: No
- Project name: `optical-designer` (or your choice)
- Directory: `./`
- Override settings: No

Set the backend URL:
```bash
vercel env add VITE_API_URL
```
Enter your backend URL when prompted (e.g., `https://your-backend.vercel.app`)

## Environment Variables Summary

### Backend (.env)
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `FRONTEND_URL` (optional): Your frontend URL for CORS

### Frontend (.env.production)
- `VITE_API_URL`: Your backend API URL

## Testing Your Deployment

1. Visit your frontend URL
2. Click "AI Assistant"
3. Enter a prompt like "Create a simple laser setup"
4. Click "Generate Setup"
5. Components should appear automatically

## Troubleshooting

### CORS Errors
- Make sure your frontend URL is added to the CORS configuration in `backend/app.py`
- Check that `FRONTEND_URL` environment variable is set in backend

### API Key Errors
- Verify `OPENROUTER_API_KEY` is set in backend environment variables
- Check your OpenRouter account has credits

### Backend Not Responding
- Check backend logs in Vercel dashboard
- Verify the API URL in frontend matches your backend deployment URL
- Test backend directly: `https://your-backend.vercel.app/api/health`

### Frontend Not Connecting
- Verify `VITE_API_URL` is set correctly
- Check browser console for errors
- Ensure backend is deployed and responding

## Updating Deployments

### Update Backend
```bash
cd backend
git add .
git commit -m "Update backend"
git push
```
Vercel will auto-deploy if connected to Git, or run `vercel --prod`

### Update Frontend
```bash
git add .
git commit -m "Update frontend"
git push
```
Vercel will auto-deploy if connected to Git, or run `vercel --prod`

## Custom Domains (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Update DNS records as instructed
5. Update environment variables to use custom domain

## Production Checklist

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] `OPENROUTER_API_KEY` set in backend
- [ ] `VITE_API_URL` set in frontend
- [ ] CORS configured correctly
- [ ] Backend health endpoint working: `/api/health`
- [ ] AI Assistant generates components successfully
- [ ] All optical components render correctly
- [ ] Ray tracing works properly

## Cost Considerations

- **Vercel**: Free tier includes 100GB bandwidth and serverless functions
- **OpenRouter**: Pay per API call (varies by model)
- Monitor usage in both dashboards

## Support

For issues:
1. Check Vercel logs in dashboard
2. Test API endpoints directly
3. Verify all environment variables
4. Check CORS configuration
