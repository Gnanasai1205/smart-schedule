# 🎓 Smart Curriculum 

![Project Status](https://img.shields.io/badge/Status-Active-brightgreen) ![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-blue) ![Node](https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green) ![MongoDB](https://img.shields.io/badge/Database-MongoDB-success)

**Smart Curriculum** is a next-generation SaaS platform designed to modernize classroom management and enhance student productivity. Using Artificial Intelligence and a robust real-time security model, the platform automates timetable generation, provides high-security attendance verification, and embeds an intelligent academic mentor right into the student dashboard.

---

## 🚀 Key Features

### 🛡️ Ironclad Anti-Cheat Attendance
Traditional static QR codes are obsolete. Smart Curriculum utilizes a 4-layer validation system:
- **Dynamic Rotating QR Codes:** The teacher's projection changes every few seconds, making screenshots useless.
- **Geofencing Verification:** Ensures the student's physical GPS coordinates perfectly match the classroom.
- **Network Proximity:** Validates IP addresses to prevent remote check-ins.
- **Real-Time Websockets:** Teachers watch their digital roster populate instantly as students successfully scan in via `socket.io`.

### 🧠 AI Smart Scheduling & OCR
- **Tesseract OCR:** Take a physical photo of a timetable, and the system intelligently extracts the text and maps the metadata automatically.
- **Groq LLaMA Integration:** AI-powered logic resolves scheduling conflicts, optimizes the day, and manages complex timetabling logic with zero manual data entry.

### 🎒 The Student Productivity Suite
- **Daily Routine Builder:** Seamlessly blends a student's mandatory classes with their personal goals (e.g., studying, gym) into one cohesive, timeline-driven daily view.
- **Integrated Focus Mode:** Productivity timers linked directly to their scheduled tasks.
- **AI Academic Mentor:** A deeply-integrated LLaMA chatbot available 24/7 to give scheduling advice, study tips, and intelligent curriculum planning.

---

## 🏗️ Architecture & Technology Stack

**Monorepo Structure** containing two primary modules:
1. `/smart-schedule` (Frontend)
2. `/smart-schedule-backend` (Backend API)

#### Frontend
- **Framework:** React.js powered by Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Shadcn UI, Radix Primitives
- **Data Visualization:** Recharts
- **Capabilities:** HTML5-QRCode scanning, responsive design

#### Backend
- **Environment:** Node.js & Express.js
- **Database:** MongoDB (via Mongoose)
- **Real-time:** Socket.io
- **AI & ML:** Groq SDK, Tesseract.js (OCR)
- **Security:** JWT Authentication, bcrypt, Helmet, Express Rate Limiting

---

## ⚙️ How to Run Locally

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/), [MongoDB](https://www.mongodb.com/), and `npm` installed.

### 1. Setup the Backend
```bash
cd smart-schedule-backend
npm install
```
Create a `.env` file in the backend directory based on the provided `.env.example` file (Add your MongoDB URI, JWT Secret, and Groq API Key).
```bash
npm run dev
```

### 2. Setup the Frontend
Open a new terminal window.
```bash
cd smart-schedule
npm install
```
Ensure your `./smart-schedule/.env` points to your active backend (e.g., `VITE_API_URL=http://localhost:5000`).
```bash
npm run dev
```

The app will now be running concurrently! Visit `http://localhost:8080` (or the Vite generated port) to view the application.

---

## 📊 Deployment
The project is optimized for cloud deployment:
- **Frontend:** Pre-configured for deployment on **Vercel** (`./vercel.json` included). Just link to the Vercel dashboard and set the root to `smart-schedule`.
- **Backend:** Easily deployable via **Render** or **Railway**. 

*Note: Ensure you update your backend's CORS settings to accept your dynamic Vercel deployment URLs!*

---

> Built intentionally to solve administrative burnout and bridge the gap between AI and modern classroom necessities. 🚀
