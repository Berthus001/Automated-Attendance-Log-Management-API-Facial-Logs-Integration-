# Risk Management Plan
## Automated Attendance Log Management System (Facial Logs Integration)

---

| ID | Risk | Category | Likelihood | Impact | Severity | Mitigation Strategy |
|---|---|---|---|---|---|---|
| R01 | MongoDB Atlas connection failure in production | Technical | Low | Critical | Critical | MongoDB Atlas with automatic failover; connection retries on startup |
| R02 | JWT secret key exposure | Security | Low | Critical | Critical | Store JWT_SECRET in .env; enforce .gitignore; use strong random secret |
| R03 | Face recognition accuracy issues (false positives/negatives) | Technical | Medium | High | High | Strict threshold 0.45; quality checks; server-side re-verification |
| R04 | Kiosk hardware or camera failure | Operational | Medium | High | High | Manual fallback via admin dashboard; test camera regularly; spare USB camera |
| R05 | Frontend-backend CORS misconfiguration in production | Technical | Medium | High | High | Set FRONTEND_URL env correctly; test CORS headers before deployment |
| R06 | Data loss due to missing database backups | Operational | Low | Critical | Critical | MongoDB Atlas automated daily backups; quarterly restore testing |
| R07 | Unauthorized access due to role bypass in kiosk or admin panel | Security | Low | Critical | Critical | protect & allowRoles middleware on all routes; test role boundaries; block admin from kiosk |
| R08 | Attendance duplicate records from multiple rapid scans | Data Integrity | Low | Medium | Medium | Unique compound index (userId, timestamp); validate scanCount |
| R09 | Face image storage failure or large storage costs | Operational | Medium | Medium | Medium | Compress images (70% quality, 300px); cleanup routine (90+ days) |
| R10 | Network connectivity loss on kiosk during attendance sync | Technical | Medium | High | High | Client-side queue for offline; retry with backoff; show status |
| R11 | Admin/Superadmin face descriptor corruption or loss | Data Integrity | Low | Medium | Medium | Validate descriptor array length; re-enrollment workflow for corrupted records |
| R12 | Webcam permission denial on browser or device | Technical | Medium | Low | Low | Prompt camera permission; provide instructions; manual fallback |
| R13 | Performance degradation with large user base (1000+ users) | Performance | Low | Medium | Low | Add indexes; implement pagination; defer aggregations |
| R14 | Face-api.js browser incompatibility or library issues | Technical | Low | Medium | Medium | Test on all browsers; use WASM backend; monitor for updates |
| R15 | Production environment differs from development (env variables, ports, URLs) | Technical | Medium | Medium | Medium | .env for all config; test build locally before deployment |
| R16 | Attendance records for deleted users cause orphaned references | Data Integrity | Low | Low | Low | Populate userId reference; cascade delete on user deletion |
| R17 | Session timeout or JWT expiration during long admin operations | Technical | Medium | Low | Low | JWT_EXPIRE 7 days; token refresh endpoint; expiration warning |
| R18 | Admin creates duplicate user accounts with same email | Data Integrity | Low | Medium | Medium | Unique email index; catch & display duplicate errors |
| R19 | False face match due to similar faces in system | Technical | Medium | Medium | Medium | Adjust threshold if needed; manual review for borderline matches |
| R20 | Deployment to Render or Vercel fails silently | Technical | Low | High | High | Test build locally; pre-deployment checks; monitor logs; rollback plan |

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
