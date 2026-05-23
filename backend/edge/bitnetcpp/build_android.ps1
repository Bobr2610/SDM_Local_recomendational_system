$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $root 'src'
$build = Join-Path $root 'build-android'

if (-not (Test-Path $src)) {
  throw 'bitnet.cpp source not found. Run fetch_bitnetcpp.ps1 first.'
}

$ndk = $env:ANDROID_NDK_ROOT
if (-not $ndk) {
  throw 'ANDROID_NDK_ROOT is not set.'
}

$abi = $env:ANDROID_ABI
if (-not $abi) { $abi = 'arm64-v8a' }

$platform = $env:ANDROID_PLATFORM
if (-not $platform) { $platform = 'android-26' }

$toolchain = Join-Path $ndk 'build\cmake\android.toolchain.cmake'
if (-not (Test-Path $toolchain)) {
  throw "Android toolchain not found at $toolchain"
}

New-Item -ItemType Directory -Force -Path $build | Out-Null

Push-Location $build

cmake $src `
  -DCMAKE_TOOLCHAIN_FILE=$toolchain `
  -DANDROID_ABI=$abi `
  -DANDROID_PLATFORM=$platform `
  -DCMAKE_BUILD_TYPE=Release

cmake --build . --config Release

Pop-Location

Write-Host "Build complete: $build"
