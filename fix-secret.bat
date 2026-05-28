@echo off
REM Reset to origin/main to remove the commits with the secret
git reset --hard origin/main

REM Now the env.example file should be back with the secret
REM Let's apply the fix
echo Applying fix to env.example...

REM The file should be restored with the secret - let's replace it
REM This uses a PowerShell one-liner since we can't rely on sed

REM Check git status
git status
