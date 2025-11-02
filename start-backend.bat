@echo off
echo Starting Optical Designer Backend...
echo.
echo Make sure you have set your OpenRouter API key:
echo $env:OPENROUTER_API_KEY="your-api-key-here"
echo.
cd backend
call venv\Scripts\activate.bat
python app.py
