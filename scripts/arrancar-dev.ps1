<#
.SYNOPSIS
  Arranca en desarrollo: backend, frontend ERP, aula virtual y las dos apps móviles.

.DESCRIPTION
  Abre una ventana por servicio (Windows Terminal si está instalado; si no, PowerShell).
  Por defecto:
    - argo-backend          → http://localhost:3000
    - argo-frontend         → http://localhost:4200
    - argo-aula-virtual     → http://localhost:4202
    - argo-mobile-jornadas  → Expo :8081
    - argo-mobile-aula      → Expo :8082

.PARAMETER SinMoviles
  No arranca Expo (solo backend + front + aula).

.PARAMETER SoloBackend
  Solo API.

.PARAMETER Cajero
  También arranca argo-mobile-cajero en Expo :8083.

.PARAMETER Tunnel
  Expo jornadas/aula con --tunnel (útil fuera de LAN).

.EXAMPLE
  .\scripts\arrancar-dev.ps1

.EXAMPLE
  .\scripts\arrancar-dev.ps1 -SinMoviles

.EXAMPLE
  .\scripts\arrancar-dev.ps1 -Cajero
#>
[CmdletBinding()]
param(
  [switch]$SinMoviles,
  [switch]$SoloBackend,
  [switch]$Cajero,
  [switch]$Tunnel
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root 'argo-backend'))) {
  $Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}

function Test-Cmd($Name) {
  return [bool](Get-Command $Name -ErrorAction SilentlyContinue)
}

if (-not (Test-Cmd 'pnpm')) {
  Write-Host 'ERROR: pnpm no está en el PATH. Instálelo o abra una terminal donde funcione.' -ForegroundColor Red
  exit 1
}

$hasWt = Test-Cmd 'wt'

$services = @()

$services += @{
  Id    = 'backend'
  Title = 'ARGO Backend :3000'
  Dir   = Join-Path $Root 'argo-backend'
  Cmd   = 'pnpm run dev'
}

if (-not $SoloBackend) {
  $services += @{
    Id    = 'frontend'
    Title = 'ARGO Frontend :4200'
    Dir   = Join-Path $Root 'argo-frontend'
    Cmd   = 'pnpm start'
  }
  $services += @{
    Id    = 'aula'
    Title = 'ARGO Aula Virtual :4202'
    Dir   = Join-Path $Root 'argo-aula-virtual'
    Cmd   = 'pnpm start'
  }
}

if (-not $SoloBackend -and -not $SinMoviles) {
  $expoJor = if ($Tunnel) { 'pnpm start:tunnel' } else { 'pnpm start:lan' }
  $expoAula = if ($Tunnel) {
    'pnpm exec expo start --tunnel --port 8082'
  } else {
    'pnpm exec expo start --lan --port 8082'
  }

  $services += @{
    Id    = 'mobile-jornadas'
    Title = 'ARGO Mobile Jornadas Expo :8081'
    Dir   = Join-Path $Root 'argo-mobile-jornadas'
    Cmd   = $expoJor
  }
  $services += @{
    Id    = 'mobile-aula'
    Title = 'ARGO Mobile Aula Expo :8082'
    Dir   = Join-Path $Root 'argo-mobile-aula'
    Cmd   = $expoAula
  }

  if ($Cajero) {
    $expoCajero = if ($Tunnel) {
      'pnpm exec expo start --tunnel --port 8083'
    } else {
      'pnpm exec expo start --lan --port 8083'
    }
    $services += @{
      Id    = 'mobile-cajero'
      Title = 'ARGO Mobile Cajero Expo :8083'
      Dir   = Join-Path $Root 'argo-mobile-cajero'
      Cmd   = $expoCajero
    }
  }
}

foreach ($s in $services) {
  if (-not (Test-Path $s.Dir)) {
    Write-Host "AVISO: no existe $($s.Dir) — se omite $($s.Id)" -ForegroundColor Yellow
  }
}

$services = @($services | Where-Object { Test-Path $_.Dir })
if ($services.Count -eq 0) {
  Write-Host 'Nada que arrancar.' -ForegroundColor Red
  exit 1
}

Write-Host ''
Write-Host '=== ARGO arrancar-dev ===' -ForegroundColor Cyan
Write-Host "Raíz: $Root"
Write-Host "Servicios: $($services.Count)  |  Terminal: $(if ($hasWt) { 'Windows Terminal (1 ventana)' } else { 'PowerShell (1 ventana c/u)' })"
Write-Host ''

if ($hasWt) {
  # Una sola ventana WT con una pestaña por servicio
  $wtArgs = [System.Collections.Generic.List[string]]::new()
  $wtArgs.Add('-w')
  $wtArgs.Add('0')
  $first = $true
  foreach ($s in $services) {
    if (-not $first) { $wtArgs.Add(';') }
    $first = $false
    $wtArgs.Add('new-tab')
    $wtArgs.Add('--title')
    $wtArgs.Add($s.Title)
    $wtArgs.Add('-d')
    $wtArgs.Add($s.Dir)
    $wtArgs.Add('powershell')
    $wtArgs.Add('-NoExit')
    $wtArgs.Add('-NoProfile')
    $wtArgs.Add('-Command')
    $wtArgs.Add($s.Cmd)
    Write-Host "  ✓ $($s.Id)  →  $($s.Title)" -ForegroundColor Green
  }
  Start-Process wt -ArgumentList $wtArgs.ToArray() | Out-Null
} else {
  foreach ($s in $services) {
    $dir = $s.Dir
    $title = $s.Title
    $cmd = $s.Cmd
    $inner = @"
`$Host.UI.RawUI.WindowTitle = '$title'
Set-Location -LiteralPath '$dir'
Write-Host ''
Write-Host '>>> $title' -ForegroundColor Green
Write-Host '    $dir' -ForegroundColor DarkGray
Write-Host '    $cmd' -ForegroundColor DarkGray
Write-Host ''
$cmd
Write-Host ''
Write-Host 'Proceso terminó. Enter para cerrar...' -ForegroundColor Yellow
Read-Host
"@
    Start-Process powershell -ArgumentList @('-NoExit', '-NoProfile', '-Command', $inner) | Out-Null
    Start-Sleep -Milliseconds 300
    Write-Host "  ✓ $($s.Id)  →  $title" -ForegroundColor Green
  }
}

Write-Host ''
Write-Host 'Enlaces útiles:' -ForegroundColor Cyan
Write-Host '  API:           http://localhost:3000'
if (-not $SoloBackend) {
  Write-Host '  ERP:           http://localhost:4200'
  Write-Host '  Aula virtual:  http://localhost:4202'
}
if (-not $SoloBackend -and -not $SinMoviles) {
  Write-Host '  Expo jornadas: http://localhost:8081  (o QR en la ventana)'
  Write-Host '  Expo aula:     http://localhost:8082'
  if ($Cajero) {
    Write-Host '  Expo cajero:   http://localhost:8083'
  }
}
Write-Host ''
Write-Host 'IP LAN (móviles):  .\scripts\ver-ip.ps1' -ForegroundColor DarkGray
Write-Host 'Listo. Cierre cada ventana para detener ese servicio.' -ForegroundColor DarkGray
Write-Host ''
