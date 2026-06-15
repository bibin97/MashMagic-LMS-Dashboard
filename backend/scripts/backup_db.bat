@echo off
echo ====================================================
echo MashMagic ERP Database Backup Utility
echo ====================================================

set DB_HOST=127.0.0.1
set DB_USER=root
set DB_NAME=mashmagic
set BACKUP_DIR=.\backups

if not exist %BACKUP_DIR% mkdir %BACKUP_DIR%

set DATETIME=%DATE:~10,4%%DATE:~4,2%%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%
set DATETIME=%DATETIME: =0%
set BACKUP_FILE=%BACKUP_DIR%\%DB_NAME%_backup_%DATETIME%.sql

echo Backing up %DB_NAME% to %BACKUP_FILE%...
mysqldump -h %DB_HOST% -u %DB_USER% -p %DB_NAME% > "%BACKUP_FILE%"

if %ERRORLEVEL% equ 0 (
    echo Backup successful!
) else (
    echo Backup failed. Please check your MySQL credentials and ensure mysqldump is installed.
)
pause
