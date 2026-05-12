#!/bin/bash
# Git push script for Semaphore SMS integration

cd "c:\Users\Admin\Documents\GROUP 4 - Automated Attendance Log Management API (Facial Logs Integration)" || exit 1

echo "===== STAGING CHANGES ====="
git add -A

echo ""
echo "===== GIT STATUS ====="
git status

echo ""
echo "===== COMMITTING CHANGES ====="
git commit -m "feat: integrate Semaphore SMS for attendance notifications

- Replace Twilio with Semaphore API integration
- Add SMS notifications on face recognition attendance
- Send formatted SMS: 'FacePass: [Name] successfully timed in at [TIME] on [DATE].'
- Implement non-blocking SMS (attendance always recorded)
- Add Philippines phone number support (09xx format auto-converts to +63)
- Update dependencies: add axios, remove twilio
- Add comprehensive SMS integration guide
- Update environment configuration template

CHANGES:
- backend/utils/smsService.js: Rewritten for Semaphore API
- backend/controllers/faceLoginController.js: Added SMS trigger
- backend/package.json: Updated dependencies
- backend/.env.example: Added SEMAPHORE_API_KEY config
- backend/SMS_INTEGRATION_GUIDE.md: New setup guide

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo ""
echo "===== PUSHING TO GITHUB ====="
git push

echo ""
echo "===== PUSH COMPLETE ====="
