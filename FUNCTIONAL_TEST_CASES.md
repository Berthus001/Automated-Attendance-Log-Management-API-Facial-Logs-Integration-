# Functional Test Cases
## Automated Attendance Log Management System (Facial Logs Integration)
**Group 4 | Date:** May 5, 2026

---

## Table of Contents

1. [Authentication – Admin Login (Email + Password)](#1-authentication--admin-login-email--password)
2. [Authentication – Face 2FA (Admin / SuperAdmin)](#2-authentication--face-2fa-admin--superadmin)
3. [Kiosk Face Attendance – Student / Teacher](#3-kiosk-face-attendance--student--teacher)
4. [Attendance Log – Time In](#4-attendance-log--time-in)
5. [Attendance Log – Time Out](#5-attendance-log--time-out)
6. [Attendance Log – Duplicate Prevention](#6-attendance-log--duplicate-prevention)
7. [Attendance Table Display – Dashboard](#7-attendance-table-display--dashboard)
8. [User Management (SuperAdmin)](#8-user-management-superadmin)
9. [Face Enrollment](#9-face-enrollment)
10. [Role-Based Access Control (RBAC)](#10-role-based-access-control-rbac)
11. [Route Guards / Navigation](#11-route-guards--navigation)
12. [API Endpoints](#12-api-endpoints)

---

## 1. Authentication – Admin Login (Email + Password)

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-01 | Valid admin login | 1. Navigate to `/admin-login` 2. Enter valid email and password 3. Click Login | `pendingFace2FA` flag is set; redirected to face 2FA step | ☐ |
| TC-02 | Invalid email format | 1. Enter malformed email (e.g., `notanemail`) 2. Click Login | Error: "Please enter a valid email" | ☐ |
| TC-03 | Wrong password | 1. Enter valid email with incorrect password 2. Click Login | Error: "Invalid credentials" | ☐ |
| TC-04 | Empty fields | 1. Leave email and/or password blank 2. Click Login | Validation error; form not submitted | ☐ |
| TC-05 | Student/teacher account login attempt | 1. Enter credentials of a student account | Error: access denied; only admin/superadmin allowed | ☐ |
| TC-06 | Non-existent account | 1. Enter email that does not exist in the system | Error: "Invalid credentials" | ☐ |

---

## 2. Authentication – Face 2FA (Admin / SuperAdmin)

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-07 | Successful face 2FA | 1. Complete email/password login 2. Position face in front of webcam 3. Wait for auto-capture | Face matched; `pendingFace2FA` removed; redirected to `/dashboard` | ☐ |
| TC-08 | Face not recognized | 1. Complete email/password login 2. Present wrong/unknown face to camera | Error shown; webcam resets for retry | ☐ |
| TC-09 | No face detected | 1. Complete email/password login 2. Cover webcam or remove face | No capture triggered; system waits | ☐ |
| TC-10 | Back button bypass attempt | 1. Complete email/password login (pendingFace2FA = true) 2. Click browser back button | Redirected back to `/admin-login`; cannot access `/dashboard` without completing face 2FA | ☐ |
| TC-11 | Direct URL bypass attempt | 1. Complete email/password login 2. Manually navigate to `/dashboard` via URL bar | Blocked by `AdminRoute` guard; redirected to `/admin-login` | ☐ |
| TC-12 | Face enrollment during first-time login | 1. Admin account with no enrolled face 2. Complete email/password login 3. Face scanned | System enrolls face automatically; proceeds to dashboard | ☐ |

---

## 3. Kiosk Face Attendance – Student / Teacher

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-13 | Known student face detected | 1. Open kiosk (`/`) 2. Student stands in front of webcam | Face matched within 0.55 threshold; attendance recorded | ☐ |
| TC-14 | Known teacher face detected | 1. Open kiosk 2. Teacher stands in front of webcam | Face matched; attendance recorded | ☐ |
| TC-15 | Unknown face | 1. Open kiosk 2. Person with no enrolled face stands in front of webcam | "Face not recognized" message; no attendance recorded | ☐ |
| TC-16 | No face in frame | 1. Open kiosk with empty webcam view | No detection triggered; UI idle | ☐ |
| TC-17 | Multiple faces in frame | 1. Two people stand in front of webcam simultaneously | System handles gracefully (matches best / ignores extra faces) | ☐ |
| TC-18 | Cooldown period enforced | 1. Student scanned successfully 2. Immediately scan again within 5 seconds | Second scan blocked; cooldown message shown | ☐ |
| TC-19 | Kiosk auto-detection loop | 1. Open kiosk 2. Observe detection running every 500ms | Face detected and highlighted with bounding box overlay | ☐ |

---

## 4. Attendance Log – Time In

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-20 | First scan of the day records Time In | 1. Student scans for first time today | New attendance record created with `timeIn = now`, `scanCount = 1` | ☐ |
| TC-21 | Time In result displayed on kiosk | 1. Student completes first scan | Green card shown: "Time In" badge + student name + time | ☐ |
| TC-22 | Time In timestamp is in local time | 1. Student in UTC+8 timezone scans at 3:31 PM | Kiosk displays `3:31 PM`, not `7:31 AM` | ☐ |
| TC-23 | Time In stored correctly in DB | 1. Student scans (first time today) 2. Check MongoDB record | `timeIn` field populated with current UTC timestamp | ☐ |

---

## 5. Attendance Log – Time Out

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-24 | Second scan of the day records Time Out | 1. Student already has `timeIn` today 2. Student scans again | `timeOut` updated; `scanCount = 2`; response `scanType: 'time-out'` | ☐ |
| TC-25 | Time Out result displayed on kiosk | 1. Student completes second scan | Indigo card shown: "Time Out" badge + both times displayed | ☐ |
| TC-26 | Time Out timestamp is in local time | 1. Student scans out at 5:00 PM (UTC+8) | Kiosk displays `5:00 PM`, not `9:00 AM` | ☐ |
| TC-27 | Both Time In and Time Out visible after second scan | 1. Student completes second scan | Kiosk result card shows: Time In + Time Out in side-by-side layout | ☐ |

---

## 6. Attendance Log – Duplicate Prevention

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-28 | Third scan blocked | 1. Student already has `scanCount = 2` today 2. Student scans again | HTTP 400 returned; amber "Already Completed" card shown on kiosk | ☐ |
| TC-29 | Only one record per user per day | 1. Student scans multiple times in one day | Only one attendance document exists for that student for that date | ☐ |
| TC-30 | New day resets attendance | 1. Student scanned in/out yesterday 2. Student scans today | New attendance record created with fresh `timeIn`; no conflict with prior day | ☐ |

---

## 7. Attendance Table Display – Dashboard

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-31 | Table columns correct | 1. Admin logs in 2. Opens Attendance tab | Columns displayed: `Name | Role | Date | Time In | Time Out` | ☐ |
| TC-32 | Time In shows local time | 1. View attendance record for a student | Time In column shows local time (e.g., `3:31 PM`), not UTC | ☐ |
| TC-33 | Time Out shows local time | 1. View attendance record where student has timed out | Time Out column shows local time correctly | ☐ |
| TC-34 | Time Out is `—` when not yet timed out | 1. View record where student only timed in | Time Out column shows `—` (greyed out) | ☐ |
| TC-35 | Date shows local date | 1. View attendance record at midnight boundary (UTC vs local) | Date column matches user's local date, not UTC date | ☐ |
| TC-36 | Pagination works | 1. Navigate to next/previous pages of attendance logs | Correct records loaded; page indicator updates | ☐ |
| TC-37 | Admin sees only own records | 1. Log in as admin 2. View attendance tab | Only attendance records created by that admin are shown | ☐ |
| TC-38 | SuperAdmin sees all records | 1. Log in as superadmin 2. View attendance tab | All attendance records from all admins are shown | ☐ |
| TC-39 | Total record count accurate | 1. Check "Total records" indicator below table | Matches actual count of records in database | ☐ |

---

## 8. User Management (SuperAdmin)

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-40 | Create new user | 1. SuperAdmin opens Users tab 2. Fills in new user form 3. Submits | New user created and listed in table | ☐ |
| TC-41 | Create user with duplicate email | 1. Attempt to create user with existing email | Error: "Email already in use" | ☐ |
| TC-42 | Edit existing user | 1. Click edit on a user 2. Change name/role 3. Save | User record updated in table and database | ☐ |
| TC-43 | Delete user | 1. Click delete on a user 2. Confirm deletion | User removed from list | ☐ |
| TC-44 | Role assignment | 1. Create/edit user with role: student, teacher, admin, or superadmin | Role saved correctly; RBAC enforced accordingly | ☐ |
| TC-45 | Admin cannot manage superadmin accounts | 1. Log in as admin 2. Attempt to edit/delete a superadmin user | Action blocked; permission denied | ☐ |

---

## 9. Face Enrollment

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-46 | Enroll new face for user | 1. Navigate to enrollment page 2. Select user 3. Capture face | Face descriptor stored; user marked as enrolled | ☐ |
| TC-47 | Enroll with no face detected | 1. Start enrollment 2. No face in webcam frame | Enrollment not triggered; system waits for face | ☐ |
| TC-48 | Re-enroll existing user | 1. Enroll face for already-enrolled user | Previous descriptor replaced with new one | ☐ |
| TC-49 | Enrolled face matches on kiosk | 1. Enroll student face 2. Go to kiosk 3. Student scans | Face matched successfully; attendance recorded | ☐ |
| TC-50 | Kiosk only fetches student/teacher descriptors | 1. Enroll admin face 2. Admin tries to scan on kiosk | Admin face not in kiosk descriptor pool; no match | ☐ |

---

## 10. Role-Based Access Control (RBAC)

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-51 | Student cannot access dashboard | 1. Log in as student (if applicable) | Redirected to `/`; cannot access `/dashboard` | ☐ |
| TC-52 | Admin can access dashboard | 1. Log in as admin with face 2FA complete | `/dashboard` accessible | ☐ |
| TC-53 | SuperAdmin can access all features | 1. Log in as superadmin | Full access to users, attendance, settings | ☐ |
| TC-54 | Unauthenticated user cannot access dashboard | 1. Clear localStorage 2. Navigate to `/dashboard` | Redirected to `/admin-login` | ☐ |
| TC-55 | Token expiry redirects to login | 1. Let JWT expire 2. Try to access a protected API route | HTTP 401; frontend redirects to login | ☐ |
| TC-56 | Admin cannot access superadmin-only routes | 1. Log in as admin 2. Call superadmin-only API | HTTP 403 Forbidden | ☐ |

---

## 11. Route Guards / Navigation

| TC# | Test Case | Steps | Expected Result | Status |
|-----|-----------|-------|-----------------|--------|
| TC-57 | Fully-logged-in admin redirected from kiosk | 1. Admin completes full login 2. Navigate to `/` | Redirected to `/dashboard` automatically | ☐ |
| TC-58 | Fully-logged-in admin redirected from `/admin-login` | 1. Admin already authenticated 2. Navigate to `/admin-login` | Redirected to `/dashboard` | ☐ |
| TC-59 | Admin mid-2FA cannot bypass to dashboard | 1. Admin passes email/password (`pendingFace2FA = true`) 2. Navigate to `/dashboard` | `AdminRoute` guard blocks; redirected to `/admin-login` | ☐ |
| TC-60 | Logout clears session | 1. Admin clicks Logout | Token, user, and `pendingFace2FA` removed from localStorage; redirected to `/admin-login` | ☐ |

---

## 12. API Endpoints

| TC# | Endpoint | Method | Test Case | Expected Result | Status |
|-----|----------|--------|-----------|-----------------|--------|
| TC-61 | `/api/auth/login` | POST | Valid credentials | 200 + JWT token returned | ☐ |
| TC-62 | `/api/auth/login` | POST | Invalid credentials | 401 Unauthorized | ☐ |
| TC-63 | `/api/kiosk/descriptors` | GET | No auth required | 200 + array of user face descriptors (students/teachers only) | ☐ |
| TC-64 | `/api/kiosk/attendance` | POST | Valid userId, first scan today | 201; `scanType: 'time-in'`; record created | ☐ |
| TC-65 | `/api/kiosk/attendance` | POST | Valid userId, second scan today | 200; `scanType: 'time-out'`; record updated | ☐ |
| TC-66 | `/api/kiosk/attendance` | POST | Valid userId, third scan today | 400; `scanType: 'completed'`; error message | ☐ |
| TC-67 | `/api/attendance` | GET | Admin token | 200 + paginated attendance logs (only own records) | ☐ |
| TC-68 | `/api/attendance` | GET | SuperAdmin token | 200 + paginated attendance logs (all records) | ☐ |
| TC-69 | `/api/attendance` | GET | No token | 401 Unauthorized | ☐ |
| TC-70 | `/api/attendance` | GET | Student token | 403 Forbidden | ☐ |
| TC-71 | `/api/users` | GET | SuperAdmin token | 200 + list of all users | ☐ |
| TC-72 | `/api/users` | POST | SuperAdmin creates new user | 201 + user object | ☐ |
| TC-73 | `/api/enroll` | POST | Valid face image + userId | 200; face descriptor stored | ☐ |
| TC-74 | `/api/face-login` | POST | Valid face image for admin | 200 + match result | ☐ |

---

## Test Summary Sheet

| Category | Total TCs | Pass | Fail | Not Tested |
|----------|-----------|------|------|------------|
| Admin Login | 6 | | | |
| Face 2FA | 6 | | | |
| Kiosk Attendance | 7 | | | |
| Time In | 4 | | | |
| Time Out | 4 | | | |
| Duplicate Prevention | 3 | | | |
| Dashboard Display | 9 | | | |
| User Management | 6 | | | |
| Face Enrollment | 5 | | | |
| RBAC | 6 | | | |
| Route Guards | 4 | | | |
| API Endpoints | 14 | | | |
| **TOTAL** | **74** | | | |

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ☐ | Not yet tested |
| ✅ | Pass |
| ❌ | Fail |
| ⚠️ | Partial / Issue found |

---

## Notes

- **Timezone**: All timestamps are stored in UTC. The frontend converts to the user's local timezone using `toLocaleTimeString()` / `toLocaleDateString()` (browser-side). Verify with testers in different timezones if possible.
- **Face Match Threshold**: `0.55` — lower value = stricter matching. Adjust in `KioskScanner.js` if needed.
- **Cooldown**: 5-second cooldown between kiosk scans per user.
- **JWT**: Token expiry should be tested with expired tokens to confirm redirect behavior.
- **Browser tested on**: Chrome (recommended), Edge, Firefox.
