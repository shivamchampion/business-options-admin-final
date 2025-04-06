@echo off
REM Script to configure CORS for Firebase Storage on Windows

echo Configuring CORS for Firebase Storage
echo ====================================
echo.

REM Create cors.json file
echo Creating cors.json configuration file...
echo [> cors.json
echo   {>> cors.json
echo     "origin": ["http://localhost:5173", "http://127.0.0.1:5173"],>> cors.json
echo     "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],>> cors.json
echo     "maxAgeSeconds": 3600,>> cors.json
echo     "responseHeader": ["Content-Type", "Content-Length", "Content-Disposition"]>> cors.json
echo   }>> cors.json
echo ]>> cors.json

echo Created cors.json with development settings.
echo.

REM Check if Firebase CLI is installed
where firebase >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Firebase CLI not found. Please install it with:
  echo npm install -g firebase-tools
  echo.
  echo After installing, run:
  echo firebase login
  echo firebase storage:cors update --config=cors.json
  goto :end
)

REM Ask user if they want to proceed
set /p choice=Do you want to update Firebase Storage CORS settings now? (y/n): 

if /i "%choice%"=="y" (
  echo.
  echo Updating Firebase Storage CORS settings...
  firebase storage:cors update --config=cors.json
  
  echo.
  echo CORS configuration complete!
  echo If you need to add more domains (like your production URL),
  echo edit the cors.json file and run this script again.
) else (
  echo.
  echo CORS update skipped.
  echo You can manually update later with:
  echo firebase storage:cors update --config=cors.json
)

:end
pause 