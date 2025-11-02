# Start Optical Designer Backend
Write-Host "Starting Optical Designer Backend..." -ForegroundColor Green
Write-Host ""

if (-not $env:OPENROUTER_API_KEY) {
    Write-Host "WARNING: OPENROUTER_API_KEY not set!" -ForegroundColor Yellow
    Write-Host "Set it with: `$env:OPENROUTER_API_KEY='your-api-key-here'" -ForegroundColor Yellow
    Write-Host ""
}

Set-Location backend
& .\venv\Scripts\Activate.ps1
python app.py
