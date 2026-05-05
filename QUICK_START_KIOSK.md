# Quick Start — Kiosk

Get the attendance kiosk running quickly.

---

## Prerequisites

- Backend running (see [QUICK_START_DEPLOYMENT.md](QUICK_START_DEPLOYMENT.md))
- At least one student or teacher enrolled with a face
- Webcam connected to the kiosk device
- Browser: Chrome or Firefox (HTTPS or localhost required for webcam)

---

## Step 1: Enroll Users

Admin creates users with face images via `POST /api/users`:

```bash
curl -X POST http://localhost:5000/api/users \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Santos",
    "email": "alice@school.edu",
    "role": "student",
    "password": "Student@123",
    "faceImage": "<base64-jpeg>"
  }'
```

Or use the dashboard at `http://localhost:3001/dashboard` to create users through the UI.

---

## Step 2: Open the Kiosk Page

Navigate to: `http://localhost:3001/` (or your production Vercel URL)

The kiosk page loads automatically:
- Starts the webcam
- Loads face-api.js models
- Fetches all enrolled face descriptors from `GET /api/kiosk/descriptors`

---

## Step 3: Scan a Face

1. A user stands in front of the webcam
2. A green bounding box appears when a face is detected
3. Within 1–2 seconds, the system matches the face
4. The user's name and role are displayed
5. An attendance log is created automatically

---

## Step 4: Verify Attendance Logged

Admin can verify via the dashboard or API:

```bash
curl http://localhost:5000/api/logs \
  -H "Authorization: Bearer <admin-token>"
```

---

## Kiosk Deployment Tips

| Scenario | Solution |
|---|---|
| Kiosk is a dedicated browser tab | Use fullscreen mode (F11) |
| Network is unreliable | Use device sync (`/api/device-sync/bulk`) to batch upload |
| Multiple kiosk stations | Each runs independently; descriptors fetched from central API |
| Kiosk must work offline | Client-side mode caches descriptors; only sync requires network |

---

## Auto-Refresh

The kiosk page re-fetches descriptors from the API every 5 minutes to pick up newly enrolled users without requiring a page reload.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Webcam not starting | Ensure HTTPS or localhost; check browser camera permissions |
| Face not detected | Ensure good lighting; face must be within webcam frame |
| Wrong person matched | Re-enroll the user with a clearer face image |
| "No descriptors loaded" | Backend is unreachable or no users are enrolled |
| Attendance not saving | Check `POST /api/kiosk/attendance` returns 201 |

See [KIOSK_SYSTEM_IMPLEMENTATION.md](KIOSK_SYSTEM_IMPLEMENTATION.md) for full implementation details.
