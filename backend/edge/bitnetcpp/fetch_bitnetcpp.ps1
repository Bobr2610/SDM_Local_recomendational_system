$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $root 'src'

if (Test-Path $src) {
  Write-Host "bitnet.cpp source already exists: $src"
  exit 0
}

Write-Host 'Cloning bitnet.cpp...'
& git clone https://github.com/microsoft/BitNet.git $src

if (-not (Test-Path $src)) {
  throw 'Clone failed.'
}

Write-Host "Done: $src"
