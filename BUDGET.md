# Budget Plan
## Automated Attendance Log Management System (Facial Logs Integration)

---

## Budget Overview

The following budget plan is structured for a small development team of 4–5 members building and deploying the Automated Attendance Log Management System within the April 18 – May 28, 2026 timeframe. Costs are presented in Philippine Peso (PHP) as the primary currency.

---

## 4.1 Human Resource Costs

| Role | Daily Rate (PHP) | Days Engaged | Total Cost (PHP) |
|---|---|---|---|
| Lead Developer / Scrum Master | ₱2,500 | 30 | ₱75,000 |
| Backend Developer (Face Recognition & API) | ₱2,000 | 25 | ₱50,000 |
| Frontend Developer (Dashboard & Kiosk UI) | ₱2,000 | 25 | ₱50,000 |
| QA / Tester (Face Matching & Attendance) | ₱1,500 | 18 | ₱27,000 |
| Product Owner / Project Manager | ₱2,000 | 30 | ₱60,000 |
| **Subtotal — Human Resources** | | | **₱262,000** |

---

## 4.2 Infrastructure and Hosting Costs

| Item | Provider | Plan | Monthly Cost (PHP) | Duration | Total (PHP) |
|---|---|---|---|---|---|
| Cloud Database | MongoDB Atlas | M0 Free Tier (dev) / M10 Shared (prod) | ₱0 – ₱1,400 | 1 month | ₱0 – ₱1,400 |
| Backend Hosting | Render | Free Tier or Starter | ₱0 – ₱1,000 | 1 month | ₱0 – ₱1,000 |
| Frontend Hosting | Vercel | Free Tier | ₱0 | 1 month | ₱0 |
| Webcam/Kiosk Device (Hardware) | Generic USB Camera | HD 1080p | ₱2,000 | 1 unit | ₱2,000 |
| Custom Domain (optional) | Namecheap | .com domain | ₱700 | 1 year | ₱700 |
| SSL Certificate | Let's Encrypt | Free | ₱0 | — | ₱0 |
| **Subtotal — Infrastructure** | | | | | **₱2,000 – ₱5,100** |

---

## 4.3 Software and Tools Costs

| Tool | Purpose | Cost |
|---|---|---|
| Node.js | Backend runtime | Free (Open Source) |
| Express.js | Web framework | Free (Open Source) |
| React + Create React App | Frontend framework | Free (Open Source) |
| CRACO | CRA configuration | Free (Open Source) |
| MongoDB | Database | Free (Open Source) |
| Mongoose | ODM | Free (Open Source) |
| @vladmandic/face-api | Face recognition library | Free (Open Source) |
| TensorFlow.js | ML framework | Free (Open Source) |
| Sharp | Image processing | Free (Open Source) |
| Axios | HTTP client | Free (Open Source) |
| React Router | Navigation | Free (Open Source) |
| react-select | Dropdown component | Free (Open Source) |
| react-webcam | Webcam component | Free (Open Source) |
| JWT / bcrypt | Authentication | Free (Open Source) |
| Tailwind CSS | UI styling | Free (Open Source) |
| VS Code | Code editor | Free |
| Postman | API testing | Free (Basic Plan) |
| GitHub | Version control and collaboration | Free |
| Figma | UI/UX wireframing | Free (Starter Plan) |
| Notion / Trello | Sprint and task management | Free (Basic Plan) |
| **Subtotal — Software and Tools** | | **₱0** |

---

## 4.4 Miscellaneous Costs

| Item | Estimated Cost (PHP) |
|---|---|
| Internet connectivity (team, 1 month) | ₱3,500 |
| Printing (documentation, user manuals, deployment guides) | ₱800 |
| Contingency buffer (10% of total) | ₱26,830 |
| **Subtotal — Miscellaneous** | **₱31,130** |

---

## 4.5 Total Project Budget Summary

| Category | Estimated Cost (PHP) |
|---|---|
| Human Resources | ₱262,000 |
| Infrastructure and Hosting | ₱3,550 (midpoint estimate) |
| Software and Tools | ₱0 |
| Miscellaneous | ₱31,130 |
| **TOTAL PROJECT BUDGET** | **₱296,680** |

---

## 4.6 Cost Optimization Notes

### Open-Source Stack
The entire technology stack (React, Node.js, Express.js, MongoDB, Mongoose, Tailwind CSS, face-api.js, TensorFlow.js) is free and open-source, eliminating licensing costs entirely.

### Free Hosting Tiers
For demonstration and academic purposes, the system can be fully deployed at zero infrastructure cost using:
- **MongoDB Atlas M0** (free tier for development)
- **Render free tier** (backend hosting)
- **Vercel free tier** (frontend hosting)

### Scalability Path
If the system is adopted for production use beyond the academic context, upgrading to paid hosting tiers provides significantly improved performance and uptime guarantees:
- **MongoDB Atlas M10** ~₱1,400/month
- **Render Starter** ~₱1,000/month

### Kiosk Hardware
The one-time hardware cost of ₱2,000 for a USB 1080p HD camera is a one-time investment. The camera can be reused across multiple kiosks or transferred to production deployment.

### Academic Capstone Context
If this project is submitted as an academic capstone, the human resource line items represent **opportunity cost** rather than actual expenditure. The realistic **out-of-pocket cost** is limited to infrastructure and miscellaneous items, totaling approximately ₱4,400 – ₱6,100 PHP.

This means:
- Team development effort is valued at ₱262,000 but may not require actual payment in an academic setting
- Only hardware, hosting, and materials need to be funded
- The system is production-ready with minimal cash investment

### Cost Breakdown for Different Scenarios

**Scenario 1: Pure Academic Development (Free Hosting)**
- Out-of-pocket: ₱3,500 (internet) + ₱500 (printing) = **₱4,000**

**Scenario 2: Academic with Hardware (1 Kiosk)**
- Out-of-pocket: ₱2,000 (camera) + ₱4,000 = **₱6,000**

**Scenario 3: Production Deployment (Paid Hosting)**
- Monthly infrastructure: ₱1,400 + ₱1,000 = ₱2,400
- Annual cost (excluding team): ₱28,800
- Hardware amortized: ₱2,000 one-time

---

## 4.7 Budget Breakdown by Phase

| Phase | Timeline | Primary Costs | Total (PHP) |
|---|---|---|---|
| Planning & Setup (Week 1) | Apr 18–21 | Team (50%), Setup (10%) | ₱41,380 |
| Backend Development (Week 2–3) | Apr 22–May 5 | Team Backend (50%), Hosting setup (50%) | ₱97,550 |
| Frontend Development (Week 2–3) | Apr 22–May 5 | Team Frontend (50%) | ₱75,000 |
| Testing & QA (Week 4) | May 6–12 | Team QA (80%), Miscellaneous (50%) | ₱28,950 |
| Deployment & Documentation (Week 4–5) | May 13–28 | Team PM (100%), Hosting (50%), Contingency (100%) | ₱53,800 |
| **Total** | | | **₱296,680** |

---

*Budget Plan for Group 4 — Automated Attendance Log Management System (Facial Logs Integration)*  
*Created: May 5, 2026*
