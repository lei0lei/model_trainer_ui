$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$env:Path = "$env:USERPROFILE\.local\bin;" + $env:Path

if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Error "未找到 uv。请先执行: irm https://astral.sh/uv/install.ps1 | iex"
}

if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Error "未找到 npm，请先安装 Node.js"
}

Write-Host "同步后端依赖..."
uv --directory backend sync

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "安装前端依赖..."
    npm --prefix frontend install
}

if (-not (Test-Path "node_modules\concurrently")) {
    Write-Host "安装根目录启动依赖..."
    npm install
}

Write-Host "启动前后端: API http://127.0.0.1:8000  前端 http://localhost:5173"
npm run dev
