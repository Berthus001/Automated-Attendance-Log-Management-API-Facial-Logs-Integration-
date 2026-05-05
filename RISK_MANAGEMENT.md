# Risk Management Plan
## Automated Attendance Log Management System (Facial Logs Integration)

---

| ID | Risk | Category | Likelihood | Impact | Severity | Mitigation Strategy |
|---|---|---|---|---|---|---|
| R01 | MongoDB Atlas connection failure in production | Technical | Low | Critical | Critical | Use MongoDB Atlas cluster with automatic failover; configure connection retries with exponential backoff; validate MONGODB_URI on startup and exit with clear error if missing |
| R02 | JWT secret key exposure | Security | Low | Critical | Critical | Store JWT_SECRET in .env only; never commit to GitHub; enforce .gitignore rules; use strong random secret (32+ characters) |
| R03 | Face recognition accuracy issues (false positives/negatives) | Technical | Medium | High | High | Set strict matching threshold (0.45) on both frontend and backend; conduct face enrollment quality checks; re-verify face on server before recording attendance |
| R04 | Kiosk hardware or camera failure | Operational | Medium | High | High | Provide fallback manual check-in option via admin dashboard; regularly test camera on kiosk; have spare USB camera available; log all kiosk errors for diagnosis |
| R05 | Frontend-backend CORS misconfiguration in production | Technical | Medium | High | High | Set FRONTEND_URL env variable correctly; test CORS headers before deployment; validate preflight OPTIONS requests work; allow all necessary headers and methods |
| R06 | Data loss due to missing database backups | Operational | Low | Critical | Critical | Enable automated backups on MongoDB Atlas (daily snapshots); document manual backup procedure; test restore process quarterly; store backups in multiple regions |
| R07 | Unauthorized access due to role bypass in kiosk or admin panel | Security | Low | Critical | Critical | Enforce protect middleware for JWT validation on all protected routes; implement allowRoles middleware for role-based access; test each role's boundary access; prevent admin/superadmin from kiosk attendance endpoint |
| R08 | Attendance duplicate records from multiple rapid scans | Data Integrity | Low | Medium | Medium | Implement unique compound index on (userId, timestamp date); validate scanCount on server before recording; reject duplicate time-in requests same day |
| R09 | Face image storage failure or large storage costs | Operational | Medium | Medium | Medium | Compress attendance images to 70% quality and max 300px width using Sharp; store in organized folder structure; implement cleanup routine for old images (90+ days) |
| R10 | Network connectivity loss on kiosk during attendance sync | Technical | Medium | High | High | Implement client-side queue for offline attendance attempts; retry failed requests with exponential backoff when connection restored; display clear offline/online status to user |
| R11 | Admin/Superadmin face descriptor corruption or loss | Data Integrity | Low | Medium | Medium | Validate face descriptor array length before storage; implement face re-enrollment workflow for corrupted records; backup face descriptor separately from attendance logs |
| R12 | Webcam permission denial on browser or device | Technical | Medium | Low | Low | Prompt user to enable camera permission on first load; provide clear browser-specific instructions; fallback to manual admin creation without self-enrollment |
| R13 | Performance degradation with large user base (1000+ users) | Performance | Low | Medium | Low | Add indexes on frequently queried fields (role, isActive, createdBy); implement pagination for user lists and attendance logs; defer complex aggregations to off-peak hours |
| R14 | Face-api.js browser incompatibility or library issues | Technical | Low | Medium | Medium | Test face-api on Chrome, Firefox, Edge, and Safari before deployment; use WebAssembly WASM backend for better performance; monitor GitHub for security updates; have fallback library identified |
| R15 | Production environment differs from development (env variables, ports, URLs) | Technical | Medium | Medium | Medium | Use .env files for all configuration; document all required env variables in deployment guide; test production build locally before deploying; validate all URLs at startup |
| R16 | Attendance records for deleted users cause orphaned references | Data Integrity | Low | Low | Low | Populate userId reference in attendance logs; delete cascades attendance logs when user deleted; document retention policy for deleted user records |
| R17 | Session timeout or JWT expiration during long admin operations | Technical | Medium | Low | Low | Set JWT_EXPIRE to 7 days for extended access; implement token refresh endpoint; display expiration warning 10 minutes before logout; gracefully redirect to login on 401 |
| R18 | Admin creates duplicate user accounts with same email | Data Integrity | Low | Medium | Medium | Enforce unique email index on User model; catch duplicate key error and display clear message; prevent rapid successive user creation without validation |
| R19 | False face match due to similar faces in system | Technical | Medium | Medium | Medium | Increase matching threshold if false matches occur; implement manual review process for borderline matches (0.40–0.50); train on diverse face datasets |
| R20 | Deployment to Render or Vercel fails silently | Technical | Low | High | High | Test deployment build locally; configure CI/CD pre-deployment checks; monitor Render backend and Vercel frontend logs post-deployment; have manual rollback plan |

---

## Risk Severity Legend

| Severity | Description |
|---|---|
| Critical | Could cause project failure, serious data breach, or complete loss of attendance records |
| High | Significant impact on system availability, security, or attendance tracking functionality |
| Medium | Moderate impact; manageable with mitigation; workarounds available |
| Low | Minor impact; acceptable risk; can be addressed post-deployment |

---

## Top Risks and Contingency Plans

### R03 — Face Recognition Accuracy Issues

**Risk:** The face-api.js library may produce false positives (recognizing wrong person) or false negatives (rejecting enrolled person) due to lighting, angles, or similar facial features.

**Contingency:**
- Strict matching threshold of 0.45 set on both frontend and backend prevents overly aggressive matching
- Server-side re-verification on every attendance ensures a second layer of validation
- If accuracy issues persist, increase threshold incrementally (0.48, 0.50) and retrain or re-enroll users with better quality photos
- Provide manual admin override to record attendance if system fails for legitimate users
- Document face enrollment best practices in user manual (lighting, angle, distance)

---

### R02 / R07 — Security Risks (JWT Exposure & Role Bypass)

**Risk:** Exposed JWT secret or bypassed role checks could grant unauthorized access to admin/superadmin functions or allow non-students to use the kiosk.

**Contingency:**
- All sensitive routes protected by both `protect` middleware (JWT validation) and `allowRoles` middleware (role check)
- The .env file is listed in .gitignore and must never be committed to GitHub
- Pre-deployment security checklist:
  - [ ] JWT_SECRET is 32+ characters and unique
  - [ ] JWT_SECRET is NOT in package.json or any config file
  - [ ] .gitignore includes .env
  - [ ] All admin-only routes have `allowRoles('superadmin', 'admin')`
  - [ ] Kiosk attendance endpoint explicitly rejects admin/superadmin with 403
  - [ ] Test each role boundary: try accessing admin endpoints as student/teacher
- Rotate JWT_SECRET annually and on any suspected exposure

---

### R01 / R06 — Database Risks (Connection Failure & Data Loss)

**Risk:** MongoDB Atlas connection failure or data loss would halt all attendance tracking and prevent user management.

**Contingency:**
- MongoDB Atlas is required for production (not local MongoDB):
  - Automatic failover across multiple nodes
  - Automated daily snapshots retained for 35 days
  - Geographically distributed data centers
- Application validates MongoDB connection on startup and exits with a clear error message if connection fails
- Enable point-in-time recovery on MongoDB Atlas for 7-day restore window
- Document quarterly backup restoration testing
- Keep emergency admin contact list for MongoDB Atlas support escalation

---

### R04 — Kiosk Hardware or Network Failure

**Risk:** Camera failure, USB disconnection, or network outage on the kiosk device would prevent attendance recording during that period.

**Contingency:**
- Client-side queue stores failed attendance attempts with timestamp
- Automatic retry with exponential backoff when connection restores
- Kiosk displays clear "Offline" or "Camera Unavailable" status
- Admin can manually record attendance for affected users via Superadmin Dashboard
- Have spare USB camera available and documented replacement procedure
- Test camera functionality on kiosk startup every morning

---

### R05 — CORS Misconfiguration in Production

**Risk:** Incorrect CORS headers could allow frontend requests to be blocked by backend, preventing all API calls.

**Contingency:**
- FRONTEND_URL must be set correctly in production .env:
  - Local: `http://localhost:3001`
  - Vercel: `https://your-project.vercel.app`
- Test CORS headers before deployment:
  - Verify OPTIONS preflight requests return 200
  - Confirm Access-Control-Allow-Origin matches FRONTEND_URL
  - Check Access-Control-Allow-Methods includes GET, POST, PUT, DELETE
- If CORS fails post-deployment, immediately rollback to previous .env or redeploy with corrected FRONTEND_URL

---

### R13 — Performance Under Load (1000+ Users)

**Risk:** Slow API response times if the system scales to many simultaneous kiosk users or large attendance log queries.

**Contingency:**
- Database indexes already implemented:
  - User model: `role`, `role+isActive` compound
  - AttendanceLog model: `userId+timestamp`, `userRole+timestamp`, `createdBy+timestamp`
- Pagination implemented on all list endpoints (attendance logs, login logs, user lists)
- If response times exceed 500ms:
  - Add Redis caching layer for kiosk descriptors (refresh every 5 minutes)
  - Defer heavy aggregation queries to off-peak hours
  - Implement batch attendance imports from kiosk queue
- Monitor response times via Render backend metrics

---

## Risk Monitoring & Review Schedule

- **Weekly:** Monitor Render backend logs for connection errors and performance alerts
- **Monthly:** Review attendance logs for duplicate records or data integrity issues
- **Quarterly:** Test MongoDB backup restoration; rotate JWT_SECRET if recommended by audit
- **On Every Deployment:** Run pre-deployment security checklist and CORS validation

---

*Risk Management Plan for Group 4 — Automated Attendance Log Management System*
*Last Updated: May 5, 2026*
