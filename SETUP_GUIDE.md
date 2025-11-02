# Complete Setup Guide

## Overview
This guide will help you set up both the frontend and backend of the Optical Designer application.

## Prerequisites
- Node.js (v16 or higher)
- Python (v3.8 or higher)
- An OpenRouter account and API key

## Step 1: Frontend Setup

1. Open a terminal in the project root directory

2. Install frontend dependencies:
```powershell
npm install
```

3. Start the frontend development server:
```powershell
npm run dev
```

4. The frontend will be available at: `http://localhost:5173`

## Step 2: Backend Setup

1. Open a **new terminal** (keep the frontend running)

2. Navigate to the backend directory:
```powershell
cd backend
```

3. Create a Python virtual environment:
```powershell
python -m venv venv
```

4. Activate the virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

Note: If you get an execution policy error, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

5. Install Python dependencies:
```powershell
pip install -r requirements.txt
```

6. Get your OpenRouter API key:
   - Go to https://openrouter.ai/
   - Sign up or log in
   - Navigate to your account settings
   - Create a new API key
   - Copy the API key

7. Set the API key as an environment variable:
```powershell
$env:OPENROUTER_API_KEY="your-actual-api-key-here"
```

**Important**: Replace `your-actual-api-key-here` with your actual API key!

8. Start the backend server:
```powershell
python app.py
```

9. The backend will be available at: `http://localhost:5000`

## Step 3: Using the Application

### Manual Component Placement
1. Click on a component type in the left sidebar (it will be highlighted in blue)
2. Click anywhere on the grid canvas to place the component
3. Components will automatically snap to the grid
4. Drag components to reposition them
5. Click on a component to select it and adjust properties in the right panel

### AI-Powered Setup Generation
1. Click the "AI Assistant" button in the left sidebar
2. Type a description of the optical setup you want, for example:
   - "Create a simple laser pointing at a mirror and detector"
   - "Build a Michelson interferometer"
   - "Set up a beam splitter with two mirrors and two detectors"
3. Click "Generate Setup"
4. Wait for the AI to generate the configuration (may take 5-10 seconds)
5. The components will appear on the canvas automatically

### Export Your Setup
1. Click "Export JSON" to save your configuration
2. The file will be downloaded with all component positions and properties

## Troubleshooting

### Frontend Issues
- **Port already in use**: Stop any other Vite/React apps or change the port in `vite.config.js`
- **Dependencies not installing**: Delete `node_modules` and `package-lock.json`, then run `npm install` again

### Backend Issues
- **Virtual environment not activating**: 
  - Make sure you're in PowerShell (not CMD)
  - Run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`
  
- **Module not found errors**: 
  - Make sure the virtual environment is activated (you should see `(venv)` in your terminal)
  - Reinstall dependencies: `pip install -r requirements.txt`

- **API key not working**:
  - Verify you set the environment variable correctly
  - Check that your OpenRouter account has credits
  - The API key must be set in the same terminal session where you run `python app.py`

- **Connection refused when using AI Assistant**:
  - Make sure the backend server is running (`python app.py`)
  - Check that it's running on port 5000
  - Look for any error messages in the backend terminal

### AI Assistant Issues
- **"Failed to connect to backend"**: The backend server is not running or not accessible
- **"OpenRouter API key not configured"**: Set the environment variable before starting the server
- **Long wait times**: OpenRouter API calls can take 5-15 seconds depending on the model and load

## Quick Start Scripts

For convenience, you can use these scripts:

**Windows PowerShell:**
```powershell
.\start-backend.ps1
```

This script will:
- Navigate to the backend directory
- Activate the virtual environment
- Start the Flask server
- Warn you if the API key is not set

## Environment Variables

The backend uses the following environment variables:

- `OPENROUTER_API_KEY`: Your OpenRouter API key (required for AI features)

You can also create a `.env` file in the backend directory (copy from `.env.example`), though setting it in the terminal is recommended for security.

## API Endpoints

The backend provides these endpoints:

### `POST /api/generate`
Generates an optical setup from a text prompt.

Request body:
```json
{
  "prompt": "Create a Michelson interferometer"
}
```

Response:
```json
{
  "version": "1.0",
  "timestamp": "2025-11-02T21:36:00.000Z",
  "components": [...]
}
```

### `GET /api/health`
Health check endpoint to verify the server is running.

Response:
```json
{
  "status": "ok",
  "api_key_set": true
}
```

## Development Tips

1. Keep both terminals open (frontend and backend)
2. The frontend has hot reload - changes appear instantly
3. The backend needs to be restarted for code changes
4. Check browser console (F12) for frontend errors
5. Check backend terminal for API errors
6. Use the health endpoint to verify backend status: `http://localhost:5000/api/health`

## Production Deployment

For production deployment:

1. Build the frontend:
```powershell
npm run build
```

2. Serve the `dist` folder with a web server

3. For the backend:
   - Set `debug=False` in `app.py`
   - Use a production WSGI server like Gunicorn
   - Set up proper environment variables
   - Use a reverse proxy like Nginx

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Make sure both servers are running
4. Check terminal output for error messages
5. Try clearing browser cache and restarting servers
