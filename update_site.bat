@echo off
title SSVM Mandli - Auto Website Updater
echo ===================================================
echo   Shri Saraswati Vidhya Mandir Mandli Website Updater
echo ===================================================
echo.
echo Step 1: Converting Excel data to website format...
python convert_excel_to_js.py
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Excel conversion failed! Please check if python is installed or Excel is locked.
    goto end
)
echo.
echo Step 2: Staging files on Git...
git add data.js index.html style.css app.js
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Git add failed. Make sure Git is installed and initialized.
    goto end
)
echo.
echo Step 3: Committing updates...
git commit -m "Auto-update student database and website from Excel"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [NOTE] No changes detected in data or site files. Nothing to upload.
    goto end
)
echo.
echo Step 4: Uploading to GitHub Pages...
git push origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Upload failed. Please check internet connection or GitHub credentials.
    goto end
)
echo.
echo ===================================================
echo   SUCCESS: Website database updated successfully!
echo   Changes will be live in ~30 seconds.
echo ===================================================
:end
echo.
pause
