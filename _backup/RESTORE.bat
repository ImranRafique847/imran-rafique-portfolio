@echo off
echo Restoring original portfolio files...
copy /Y "_backup\index.html" "index.html"
copy /Y "_backup\about.html" "about.html"
copy /Y "_backup\services.html" "services.html"
copy /Y "_backup\projects.html" "projects.html"
copy /Y "_backup\skills.html" "skills.html"
copy /Y "_backup\contact.html" "contact.html"
echo.
echo All files restored to original state!
pause
