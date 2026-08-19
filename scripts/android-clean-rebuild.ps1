param(
    [ValidateSet('development', 'preview', 'production')]
    [string]$AppEnv = 'development'
)

$ErrorActionPreference = 'Stop'

$ProjectRoot  = Split-Path -Parent $PSScriptRoot
$BuildGradle  = Join-Path $ProjectRoot 'android\app\build.gradle'
$KeystoreSrc  = Join-Path $ProjectRoot 'uran-release.jks'
$KeystoreDest = Join-Path $ProjectRoot 'android\app\uran-release.jks'

# Verify keystore exists before touching anything
if (-not (Test-Path $KeystoreSrc)) {
    Write-Host 'ERROR: uran-release.jks not found at project root' -ForegroundColor Red
    exit 1
}

# 1. Clean prebuild
Write-Host "[1/4] Running clean prebuild (env: $AppEnv)..." -ForegroundColor Cyan
Set-Location $ProjectRoot
$env:EXPO_PUBLIC_APP_ENV = $AppEnv
pnpm expo prebuild --clean
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Remove-Item Env:EXPO_PUBLIC_APP_ENV -ErrorAction SilentlyContinue

# 2. Clear stale CMake cache
$cxxDir = Join-Path $ProjectRoot 'android\app\.cxx'
if (Test-Path $cxxDir) {
    Write-Host '[2/4] Clearing stale CMake cache (.cxx)...' -ForegroundColor Cyan
    Remove-Item -Recurse -Force $cxxDir
}

# 3. Restore keystore
Write-Host '[3/4] Restoring keystore to android/app/...' -ForegroundColor Cyan
Copy-Item $KeystoreSrc $KeystoreDest -Force

# 4. Patch build.gradle line-by-line
Write-Host '[4/4] Patching build.gradle with release signingConfig...' -ForegroundColor Cyan

$lines      = Get-Content $BuildGradle -Encoding UTF8
$out        = [System.Collections.ArrayList]::new()
$state      = 'scanning'
$braceDepth = 0

foreach ($line in $lines) {

    # ── Insert release signingConfig block ────────────────────────────────────
    if ($state -eq 'scanning' -and $line -match '^\s{4}signingConfigs\s*\{') {
        $state = 'in_signing'
        [void]$out.Add($line)
        continue
    }

    if ($state -eq 'in_signing') {
        if ($line -match '\{') { $braceDepth++ }
        if ($line -match '\}') { $braceDepth-- }

        if ($braceDepth -lt 0) {
            # closing brace of signingConfigs — insert release block before it
            [void]$out.Add('        release {')
            [void]$out.Add("            storeFile file('uran-release.jks')")
            [void]$out.Add('            storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""')
            [void]$out.Add('            keyAlias System.getenv("KEY_ALIAS") ?: "uran-key"')
            [void]$out.Add('            keyPassword System.getenv("KEY_PASSWORD") ?: ""')
            [void]$out.Add('        }')
            [void]$out.Add($line)
            $state      = 'find_release_buildtype'
            $braceDepth = 0
            continue
        }

        [void]$out.Add($line)
        continue
    }

    # ── Find the release buildType (skip past debug buildType first) ──────────
    if ($state -eq 'find_release_buildtype') {
        if ($line -match '^\s{8}release\s*\{') {
            $state = 'in_release_buildtype'
        }
        [void]$out.Add($line)
        continue
    }

    # ── Fix signingConfig inside release buildType only ───────────────────────
    if ($state -eq 'in_release_buildtype') {
        if ($line -match '// Caution! In production') { continue }
        if ($line -match '// see https://reactnative\.dev') { continue }
        if ($line -match 'signingConfig signingConfigs\.debug') {
            [void]$out.Add('            signingConfig signingConfigs.release')
            $state = 'done'
            continue
        }
    }

    [void]$out.Add($line)
}

$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
[System.IO.File]::WriteAllLines($BuildGradle, $out, $utf8NoBom)

Write-Host ''
if ($AppEnv -eq 'production') {
    Write-Host 'Done. Set keystore env vars then build release:' -ForegroundColor Green
    Write-Host '  $env:KEYSTORE_PASSWORD = "..."' -ForegroundColor Yellow
    Write-Host '  $env:KEY_ALIAS         = "uran-key"' -ForegroundColor Yellow
    Write-Host '  $env:KEY_PASSWORD      = "..."' -ForegroundColor Yellow
    Write-Host '  cd android && ./gradlew bundleRelease' -ForegroundColor Yellow
} else {
    Write-Host 'Done. Run: pnpm android' -ForegroundColor Green
}
