# Optical Designer Backend

Python Flask backend for the Optical Designer application.

## Setup

1. Create a virtual environment:
```powershell
python -m venv venv
```

2. Activate the virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

3. Install dependencies:
```powershell
pip install -r requirements.txt
```

4. Set your OpenRouter API key:
```powershell
$env:OPENROUTER_API_KEY="your-api-key-here"
```

5. Run the server:
```powershell
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### POST /api/generate
Accepts a JSON body with a `prompt` field and returns an optical setup configuration.

Request:
```json
{
  "prompt": "Create a simple Michelson interferometer setup"
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

### GET /api/health
Health check endpoint to verify the server is running.

## Getting an OpenRouter API Key

1. Sign up at https://openrouter.ai/
2. Go to your account settings
3. Create a new API key
4. Set it as an environment variable as shown above
