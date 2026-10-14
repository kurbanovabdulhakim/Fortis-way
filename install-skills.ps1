# FortisWay - Multi-Device Skills Installer for Windows
# Copies all 4 web design & UI skills to your global user profile

$ErrorActionPreference = "SilentlyContinue"

$sourceSkills = Join-Path $PSScriptRoot ".agents\skills"
$targetDirs = @(
    "$env:USERPROFILE\.gemini\config\skills",
    "$env:USERPROFILE\.agents\skills",
    "$env:USERPROFILE\.claude\skills"
)

Write-Host "======================================================" -ForegroundColor Cyan
Write-Host " FORTISWAY: Installing 4 Web Design Skills for AI     " -ForegroundColor Cyan
Write-Host "======================================================" -ForegroundColor Cyan

foreach ($target in $targetDirs) {
    if (-not (Test-Path $target)) {
        New-Item -ItemType Directory -Path $target -Force | Out-Null
    }
    
    Get-ChildItem -Path $sourceSkills -Directory | ForEach-Object {
        $skillName = $_.Name
        $destPath = Join-Path $target $skillName
        if (-not (Test-Path $destPath)) {
            New-Item -ItemType Directory -Path $destPath -Force | Out-Null
        }
        Copy-Item -Path "$($_.FullName)\*" -Destination $destPath -Recurse -Force
        Write-Host " [OK] Installed '$skillName' -> $destPath" -ForegroundColor Green
    }
}

Write-Host "`nAll 4 design skills successfully installed on this computer!" -ForegroundColor Cyan
Write-Host "Available skills: frontend-design, frontend-ui-engineering, web-performance-optimization, ui-ux-pro-max" -ForegroundColor White
