# Selector grafico ARGO.
# 1) Tasks: Run Task -> "ARGO - Selector grafico (elegir modulos)"
# 2) Elija modulos -> Guardar
# 3) Ctrl+Shift+B  (o Tasks: Run Task -> "ARGO - Arrancar seleccionados")
#    -> abre UNA terminal de Cursor por modulo.
[CmdletBinding()]
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$Root = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $Root 'argo-backend'))) {
  $Root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
}
$TasksPath = Join-Path $Root '.vscode\tasks.json'
$SelPath = Join-Path $Root '.vscode\argo-selection.json'
$CompoundLabel = 'ARGO - Arrancar seleccionados'

$catalog = @(
  @{ Id = 'backend';  Label = 'Backend API';        Task = 'ARGO - Backend (API :3000)';          Dir = 'argo-backend';         Port = ':3000'; Default = $true }
  @{ Id = 'frontend'; Label = 'Frontend ERP';       Task = 'ARGO - Frontend ERP (:4200)';         Dir = 'argo-frontend';        Port = ':4200'; Default = $true }
  @{ Id = 'aula';     Label = 'Aula Virtual (web)'; Task = 'ARGO - Aula Virtual (:4202)';         Dir = 'argo-aula-virtual';    Port = ':4202'; Default = $true }
  @{ Id = 'sitio';    Label = 'Sitio publico';      Task = 'ARGO - Sitio publico';                Dir = 'argo-sitio';           Port = '';     Default = $false }
  @{ Id = 'jor';      Label = 'App movil Jornadas'; Task = 'ARGO - Mobile Jornadas (Expo :8081)'; Dir = 'argo-mobile-jornadas'; Port = ':8081'; Default = $true }
  @{ Id = 'maula';    Label = 'App movil Aula';     Task = 'ARGO - Mobile Aula (Expo :8082)';     Dir = 'argo-mobile-aula';     Port = ':8082'; Default = $true }
  @{ Id = 'cajero';   Label = 'App movil Cajero';   Task = 'ARGO - Mobile Cajero (Expo :8083)';   Dir = 'argo-mobile-cajero';   Port = ':8083'; Default = $false }
)

function Update-CompoundDependsOn([string[]]$taskLabels) {
  if (-not (Test-Path $TasksPath)) {
    throw "No existe $TasksPath"
  }

  $bytes = [System.IO.File]::ReadAllBytes($TasksPath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $raw = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
  } else {
    $raw = [System.Text.Encoding]::UTF8.GetString($bytes)
  }

  $lines = @($taskLabels | ForEach-Object { '        "' + ($_ -replace '"', '\"') + '"' })
  $block = ($lines -join ",`n")

  $pattern = '(?s)("label"\s*:\s*"ARGO - Arrancar seleccionados"\s*,\s*"dependsOrder"\s*:\s*"parallel"\s*,\s*"dependsOn"\s*:\s*)\[[^\]]*\]'
  if ($raw -notmatch $pattern) {
    $pattern = '(?s)("label"\s*:\s*"ARGO - Arrancar seleccionados"[\s\S]{0,400}?"dependsOn"\s*:\s*)\[[^\]]*\]'
  }
  if ($raw -notmatch $pattern) {
    throw "No se pudo localizar dependsOn de '$CompoundLabel' en tasks.json"
  }

  $newRaw = [regex]::Replace($raw, $pattern, ('${1}[' + "`n" + $block + "`n" + '      ]'), 1)
  [System.IO.File]::WriteAllText($TasksPath, $newRaw, (New-Object System.Text.UTF8Encoding $false))
}

function Save-Selection([string[]]$taskLabels) {
  $dir = Split-Path $SelPath
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
  $obj = @{ tasks = @($taskLabels); savedAt = (Get-Date).ToString('o') }
  $json = $obj | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText($SelPath, $json, (New-Object System.Text.UTF8Encoding $false))
}

$form = New-Object System.Windows.Forms.Form
$form.Text = 'ARGO - Arrancar desarrollo'
$form.Size = New-Object System.Drawing.Size(480, 560)
$form.StartPosition = 'CenterScreen'
$form.FormBorderStyle = 'FixedDialog'
$form.MaximizeBox = $false
$form.MinimizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(240, 253, 250)
$form.Font = New-Object System.Drawing.Font('Segoe UI', 10)

$title = New-Object System.Windows.Forms.Label
$title.Text = 'Seleccione modulos para Cursor'
$title.Location = New-Object System.Drawing.Point(20, 14)
$title.Size = New-Object System.Drawing.Size(420, 24)
$title.Font = New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)
$title.ForeColor = [System.Drawing.Color]::FromArgb(15, 78, 74)
$form.Controls.Add($title)

$hint = New-Object System.Windows.Forms.Label
$hint.Text = "1) Marque modulos y pulse Guardar`n2) Luego Ctrl+Shift+B  -> una terminal por modulo en Cursor"
$hint.Location = New-Object System.Drawing.Point(20, 42)
$hint.Size = New-Object System.Drawing.Size(420, 48)
$hint.ForeColor = [System.Drawing.Color]::FromArgb(71, 85, 105)
$form.Controls.Add($hint)

$panel = New-Object System.Windows.Forms.Panel
$panel.Location = New-Object System.Drawing.Point(20, 100)
$panel.Size = New-Object System.Drawing.Size(420, 300)
$panel.AutoScroll = $true
$panel.BorderStyle = 'FixedSingle'
$panel.BackColor = [System.Drawing.Color]::White
$form.Controls.Add($panel)

$checks = @{}
$y = 12
foreach ($item in $catalog) {
  $exists = Test-Path (Join-Path $Root $item.Dir)
  $cb = New-Object System.Windows.Forms.CheckBox
  $portTxt = if ($item.Port) { "  $($item.Port)" } else { '' }
  $cb.Text = "$($item.Label)$portTxt"
  $cb.Location = New-Object System.Drawing.Point(14, $y)
  $cb.Size = New-Object System.Drawing.Size(380, 28)
  $cb.Checked = [bool]($item.Default -and $exists)
  $cb.Enabled = $exists
  if (-not $exists) {
    $cb.Text = "$($item.Label)  (no encontrado)"
    $cb.ForeColor = [System.Drawing.Color]::Gray
  }
  $panel.Controls.Add($cb)
  $checks[$item.Id] = @{ Control = $cb; Meta = $item }
  $y += 34
}

$btnAll = New-Object System.Windows.Forms.Button
$btnAll.Text = 'Todos'
$btnAll.Location = New-Object System.Drawing.Point(20, 414)
$btnAll.Size = New-Object System.Drawing.Size(90, 32)
$btnAll.Add_Click({
  foreach ($k in $checks.Keys) {
    if ($checks[$k].Control.Enabled) { $checks[$k].Control.Checked = $true }
  }
})
$form.Controls.Add($btnAll)

$btnNone = New-Object System.Windows.Forms.Button
$btnNone.Text = 'Ninguno'
$btnNone.Location = New-Object System.Drawing.Point(120, 414)
$btnNone.Size = New-Object System.Drawing.Size(90, 32)
$btnNone.Add_Click({
  foreach ($k in $checks.Keys) { $checks[$k].Control.Checked = $false }
})
$form.Controls.Add($btnNone)

$btnWeb = New-Object System.Windows.Forms.Button
$btnWeb.Text = 'Solo web'
$btnWeb.Location = New-Object System.Drawing.Point(220, 414)
$btnWeb.Size = New-Object System.Drawing.Size(90, 32)
$btnWeb.Add_Click({
  foreach ($k in $checks.Keys) {
    $id = $checks[$k].Meta.Id
    $checks[$k].Control.Checked = ($checks[$k].Control.Enabled -and ($id -in @('backend', 'frontend', 'aula')))
  }
})
$form.Controls.Add($btnWeb)

$status = New-Object System.Windows.Forms.Label
$status.Text = 'Listo para elegir'
$status.Location = New-Object System.Drawing.Point(20, 460)
$status.Size = New-Object System.Drawing.Size(250, 40)
$status.ForeColor = [System.Drawing.Color]::FromArgb(4, 120, 87)
$form.Controls.Add($status)

$btnStart = New-Object System.Windows.Forms.Button
$btnStart.Text = 'Guardar seleccion'
$btnStart.Location = New-Object System.Drawing.Point(270, 456)
$btnStart.Size = New-Object System.Drawing.Size(170, 40)
$btnStart.BackColor = [System.Drawing.Color]::FromArgb(13, 148, 136)
$btnStart.ForeColor = [System.Drawing.Color]::White
$btnStart.FlatStyle = 'Flat'
$btnStart.Font = New-Object System.Drawing.Font('Segoe UI', 10, [System.Drawing.FontStyle]::Bold)
$form.AcceptButton = $btnStart
$form.Controls.Add($btnStart)

$btnStart.Add_Click({
  $selected = @()
  foreach ($k in $checks.Keys) {
    if ($checks[$k].Control.Checked) { $selected += $checks[$k].Meta.Task }
  }
  if ($selected.Count -eq 0) {
    [System.Windows.Forms.MessageBox]::Show('Seleccione al menos un modulo.', 'ARGO', 'OK', 'Information') | Out-Null
    return
  }
  try {
    $btnStart.Enabled = $false
    $status.Text = 'Guardando...'
    $form.Refresh()
    Update-CompoundDependsOn -taskLabels $selected
    Save-Selection -taskLabels $selected
    [System.Windows.Forms.MessageBox]::Show(
      ("Seleccion guardada ($($selected.Count) modulos).`n`nAhora en Cursor pulse:`n`n    Ctrl + Shift + B`n`nSe abrira una terminal por modulo."),
      'ARGO - Siguiente paso',
      'OK',
      'Information'
    ) | Out-Null
    $form.Close()
  } catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Error ARGO', 'OK', 'Error') | Out-Null
    $status.Text = 'Error'
    $btnStart.Enabled = $true
  }
})

[void]$form.ShowDialog()

Write-Host ''
Write-Host 'Seleccion guardada. Pulse Ctrl+Shift+B en Cursor para arrancar.' -ForegroundColor Green
Write-Host '(O Tasks: Run Task -> ARGO - Arrancar seleccionados)' -ForegroundColor DarkGray
Write-Host ''
