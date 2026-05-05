# User Flow Diagram - Kiosk Attendance System

## 🎯 Student/Teacher Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     HOMEPAGE (/)                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   🎓 Attendance System                    [Admin ➜]  │  │
│  │   Face Recognition Kiosk                             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   📸 Scan Your Face to Log Attendance                │  │
│  │   Position your face in the camera frame             │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                        │  │
│  │              [Live Webcam Feed]                       │  │
│  │         [Green Box if Face Detected]                  │  │
│  │                                                        │  │
│  │              [📸 Capture Photo]                       │  │
│  │                (enabled when face detected)           │  │
│  │                                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Instructions:                                               │
│  ✓ Look directly at the camera                              │
│  ✓ Ensure good lighting                                     │
│  ✓ Remove glasses if needed                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ User clicks "Capture Photo"
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  AUTO-LOGIN TRIGGERED                        │
│                                                              │
│            ⏳ Recognizing face...                            │
│                                                              │
│  API Call: POST /api/auth/face-login                        │
│  - Sends captured image                                     │
│  - Backend matches face                                     │
│  - Creates attendance record                                │
│  - Returns user data + attendance info                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                    ┌───────┴────────┐
                    │                │
              SUCCESS            FAILURE
                    │                │
                    ▼                ▼
    ┌─────────────────────┐  ┌──────────────────┐
    │   SUCCESS CARD      │  │   ERROR CARD     │
    │                     │  │                  │
    │  ✓ Welcome!         │  │  ✗ Recognition   │
    │                     │  │     Failed       │
    │  Name: John Doe     │  │                  │
    │  Role: Student      │  │  Face not        │
    │  Status: Attendance │  │  recognized.     │
    │          recorded   │  │  Please try      │
    │  Date: May 5, 2026  │  │  again.          │
    │  Time: 10:32 AM     │  │                  │
    │                     │  │  Resetting...    │
    │  Resetting in       │  │  (4 seconds)     │
    │  a moment...        │  │                  │
    │  (5 seconds)        │  │                  │
    └─────────────────────┘  └──────────────────┘
                    │                │
                    │                │
                    └───────┬────────┘
                            │
                    AUTO-RESET
                            │
                            ▼
              ┌──────────────────────────┐
              │  Back to Webcam Screen   │
              │  Ready for Next User     │
              └──────────────────────────┘
```

---

## 🛡️ Admin Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     HOMEPAGE (/)                             │
│                                                              │
│  User clicks "Admin Login" button                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  ADMIN LOGIN PAGE                            │
│                  (/admin-login)                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   🎓 Attendance System            [← Back to Home]   │  │
│  │   Administrator Portal                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   🛡️ Administrator Login                             │  │
│  │   Secure access for administrators only              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │   Email Address:                                      │  │
│  │   [admin@example.com                         ]       │  │
│  │                                                        │  │
│  │   Password:                                           │  │
│  │   [••••••••••••••••••••••••••••••••••••]             │  │
│  │                                                        │  │
│  │              [🔐 Login]                               │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Submit credentials
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  AUTHENTICATION CHECK                        │
│                                                              │
│  API Call: POST /api/auth/login                             │
│  - Validates email + password                               │
│  - Checks role (admin/superadmin)                           │
│  - Returns token if successful                              │
└─────────────────────────────────────────────────────────────┘
                            │
                            │
                    ┌───────┴────────┐
                    │                │
              SUCCESS            FAILURE
                    │                │
                    ▼                ▼
    ┌─────────────────────┐  ┌──────────────────┐
    │  FACE 2FA STEP      │  │  ERROR MESSAGE   │
    │  (Optional)         │  │                  │
    │                     │  │  Invalid         │
    │  [Webcam Feed]      │  │  credentials.    │
    │                     │  │  Please try      │
    │  [Capture Face]     │  │  again.          │
    │                     │  │                  │
    │  - If enrolled:     │  └──────────────────┘
    │    Verify face      │
    │  - If not:          │
    │    Enroll face      │
    │  - Or skip          │
    │    (Do This Later)  │
    └─────────────────────┘
                    │
                    │ Verification complete
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                     DASHBOARD                                │
│                   (/dashboard)                               │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  SuperAdmin Dashboard                    [Logout]    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  - User Management                                           │
│  - Attendance Reports                                        │
│  - System Settings                                           │
│  - Full Admin Access                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Protected Route Logic

```
┌─────────────────────────────────────────┐
│  User tries to access /dashboard       │
└─────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  Check localStorage:  │
        │  - token exists?      │
        │  - user data exists?  │
        └───────────────────────┘
                    │
            ┌───────┴────────┐
            │                │
           YES               NO
            │                │
            ▼                ▼
    ┌──────────────┐  ┌──────────────────┐
    │ Check Role   │  │ Redirect to      │
    │ admin/super? │  │ /admin-login     │
    └──────────────┘  └──────────────────┘
            │
    ┌───────┴────────┐
    │                │
   YES               NO
    │                │
    ▼                ▼
┌─────────┐  ┌──────────────┐
│ Allow   │  │ Redirect to  │
│ Access  │  │ / (homepage) │
└─────────┘  └──────────────┘
```

---

## 📊 API Flow - Face Login

```
┌──────────────────────────────────────────┐
│  Client: POST /api/auth/face-login       │
│  Body: { image: "base64..." }            │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│  Backend: Extract Face Descriptor        │
│  - Process base64 image                  │
│  - Detect face in image                  │
│  - Extract 128-dim descriptor            │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│  Backend: Find Matching User             │
│  - Query active students/teachers        │
│  - Compare descriptors                   │
│  - Find best match                       │
│  - Check threshold (0.6)                 │
└──────────────────────────────────────────┘
                    │
            ┌───────┴────────┐
            │                │
          MATCH           NO MATCH
            │                │
            ▼                ▼
┌──────────────────┐  ┌────────────────┐
│ Check Today's    │  │ Return Error:  │
│ Attendance       │  │ Face not       │
└──────────────────┘  │ recognized     │
            │          └────────────────┘
    ┌───────┴────────┐
    │                │
  EXISTS        DOESN'T EXIST
    │                │
    ▼                ▼
┌────────────┐  ┌──────────────────┐
│ Return:    │  │ Create:          │
│ Already    │  │ New Attendance   │
│ Logged     │  │ Record           │
│ Today      │  └──────────────────┘
└────────────┘            │
            └─────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│  Backend: Return Success Response        │
│  - Generate JWT token                    │
│  - Return user data                      │
│  - Return attendance info                │
│  - Return confidence score               │
└──────────────────────────────────────────┘
                    │
                    ▼
┌──────────────────────────────────────────┐
│  Client: Display Success Message         │
│  - Show user details                     │
│  - Show attendance status                │
│  - Auto-reset after 5 seconds            │
└──────────────────────────────────────────┘
```

---

## 🎨 UI State Machine

```
HOMEPAGE STATES:
┌─────────────────────────────────────────────────────┐
│                                                     │
│  1. INITIAL                                         │
│     - Show webcam                                   │
│     - Show capture button (disabled)                │
│     - Loading face detection models                 │
│                                                     │
│  2. READY                                           │
│     - Webcam active                                 │
│     - Face detection running                        │
│     - Capture button (enabled if face detected)     │
│                                                     │
│  3. CAPTURED                                        │
│     - Image captured                                │
│     - Auto-trigger login                            │
│                                                     │
│  4. PROCESSING                                      │
│     - Show loading spinner                          │
│     - "Recognizing face..." message                 │
│     - Disable interactions                          │
│                                                     │
│  5. SUCCESS                                         │
│     - Hide webcam                                   │
│     - Show success card with user details           │
│     - Start 5-second countdown                      │
│                                                     │
│  6. ERROR                                           │
│     - Hide webcam                                   │
│     - Show error card with message                  │
│     - Start 4-second countdown                      │
│                                                     │
│  7. RESET                                           │
│     - Clear all states                              │
│     - Return to READY state                         │
│     - Ready for next user                           │
│                                                     │
└─────────────────────────────────────────────────────┘

State Transitions:
INITIAL → READY (when models loaded)
READY → CAPTURED (when user clicks capture)
CAPTURED → PROCESSING (API call initiated)
PROCESSING → SUCCESS (face recognized)
PROCESSING → ERROR (face not recognized)
SUCCESS → RESET (after 5 seconds)
ERROR → RESET (after 4 seconds)
RESET → READY (immediate)
```

---

## 📱 Responsive Behavior

```
DESKTOP (>768px):
┌────────────────────────────────────────┐
│  Navbar (full width)                   │
│  [Logo]  [Subtitle]     [Admin Login]  │
├────────────────────────────────────────┤
│                                        │
│   ┌──────────────────────────────┐    │
│   │                              │    │
│   │    [Large Webcam View]       │    │
│   │    [Clear Instructions]      │    │
│   │    [Big Capture Button]      │    │
│   │                              │    │
│   └──────────────────────────────┘    │
│                                        │
├────────────────────────────────────────┤
│  Footer (copyright)                    │
└────────────────────────────────────────┘

MOBILE (<768px):
┌──────────────────┐
│  Navbar (stack)  │
│  [Logo]          │
│  [Subtitle]      │
│  [Admin Login]   │
├──────────────────┤
│                  │
│  ┌────────────┐  │
│  │            │  │
│  │  [Webcam]  │  │
│  │            │  │
│  │ [Capture]  │  │
│  │            │  │
│  └────────────┘  │
│                  │
├──────────────────┤
│  Footer          │
└──────────────────┘
```

---

**Visual flow complete!** ✅
Use these diagrams to understand the system architecture.
