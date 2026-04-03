#!/usr/bin/env pwsh
# Smart Curriculum — ngrok tunnel launcher
# Usage: .\start-ngrok.ps1

Write-Host "`n🚀 Smart Curriculum — Starting ngrok Tunnels`n" -ForegroundColor Cyan

# ── 1. Start ngrok with the two tunnels in background ──
Write-Host "Starting ngrok tunnels for port 5000 (backend) and 5173 (frontend)..." -ForegroundColor Yellow
$ngrokJob = Start-Process -FilePath "ngrok" -ArgumentList "start --all --config .\ngrok.yml" -NoNewWindow -PassThru

# Wait for ngrok to initialize
Start-Sleep -Seconds 4

# ── 2. Fetch tunnel URLs from ngrok's local API ──
try {
    $tunnels = (Invoke-RestMethod -Uri "http://127.0.0.1:4040/api/tunnels").tunnels
    $backendTunnel = ($tunnels | Where-Object { $_.config.addr -like "*5000*" -and $_.proto -eq "https" }).public_url
    $frontendTunnel = ($tunnels | Where-Object { $_.config.addr -like "*5173*" -and $_.proto -eq "https" }).public_url

    if (-not $backendTunnel) {
        $backendTunnel = ($tunnels | Where-Object { $_.config.addr -like "*5000*" })[0].public_url
    }
    if (-not $frontendTunnel) {
        $frontendTunnel = ($tunnels | Where-Object { $_.config.addr -like "*5173*" })[0].public_url
    }

    Write-Host "`n✅ Tunnels Active:" -ForegroundColor Green
    Write-Host "   🔵 Frontend : $frontendTunnel" -ForegroundColor Cyan
    Write-Host "   🟢 Backend  : $backendTunnel" -ForegroundColor Green

    # ── 3. Update frontend .env to use the ngrok backend URL ──
    $envContent = "VITE_API_URL=$backendTunnel"
    $envPath = Join-Path $PSScriptRoot "smart-schedule\.env"
    Set-Content -Path $envPath -Value $envContent
    Write-Host "`n✏️  Updated smart-schedule\.env with backend URL" -ForegroundColor Yellow

    Write-Host "`n📋 Share these URLs with students/testers:" -ForegroundColor Magenta
    Write-Host "   App URL: $frontendTunnel" -ForegroundColor White
    Write-Host "   API URL: $backendTunnel" -ForegroundColor White
    Write-Host "`n⚠️  Note: Free ngrok sessions expire in ~2 hours. Add --authtoken for persistent URLs.`n" -ForegroundColor DarkYellow
} catch {
    Write-Host "`n⚠️  Could not auto-fetch tunnel URLs. Visit http://127.0.0.1:4040 to see them." -ForegroundColor Red
    Write-Host "   Make sure ngrok is running and ports 5000 + 5173 are active." -ForegroundColor DarkYellow
}

Write-Host "Press Ctrl+C to stop ngrok tunnels.`n" -ForegroundColor DarkGray
Wait-Process -Id $ngrokJob.Id
