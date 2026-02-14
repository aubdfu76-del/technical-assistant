# Start Backend and Frontend concurrently
Write-Host "Starting Intelligent Technical Assistant Development Environment..." -ForegroundColor Green

# Start Backend in a new process
Write-Host "Launching Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

# Wait a bit for backend to initialize
Start-Sleep -Seconds 5

# Start Frontend in a new process
Write-Host "Launching Frontend Server..." -ForegroundColor Cyan
Set-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"

Write-Host "✅ Environment Started!" -ForegroundColor Green
Write-Host "Backend running on http://localhost:3000"
Write-Host "Frontend running on http://localhost:5173"
