# Smart Curriculum: Project Presentation Notes

This document contains a structured breakdown of the "Smart Curriculum" project. It is organized into clear sections that you can copy and paste directly into PowerPoint slides.

## Slide 1: Title Slide
- **Project Name:** Smart Curriculum (Smart Schedule & Attendance System)
- **Tagline:** An AI-powered SaaS platform for intelligent class scheduling, secure attendance tracking, and student productivity.
- **Core Vision:** To eliminate manual administrative work in education through AI-driven automation, secure real-time verification, and intelligent student mentoring.

## Slide 2: The Problem Identified
- **Proxy Attendance (Buddy Punching):** Traditional static QR codes or roll calls are easily abused by students sharing codes remotely.
- **Manual Timetabling:** Creating and managing schedules is tedious and difficult to optimize.
- **Fragmented Tools:** Students juggle multiple apps for their schedules, personal goals, and productivity tracking.
- **Lack of Real-Time Analytics:** Teachers lack immediate insights into class attendance and student engagement.

## Slide 3: Technology Stack (What We Used)
### Frontend (User Interface)
- **Framework:** React.js powered by Vite (for highly optimized, fast performance)
- **Language:** TypeScript (for type safety and scalable code)
- **Styling:** Tailwind CSS & Shadcn UI / Radix UI (for modern, premium, responsive aesthetics)
- **Libraries:** `html5-qrcode` (QR scanning), `recharts` (Analytics charts), `socket.io-client` (Real-time data)

### Backend (Server & API)
- **Environment:** Node.js with Express.js
- **Database:** MongoDB via Mongoose (NoSQL for flexible data structures)
- **Authentication:** JSON Web Tokens (JWT) & bcrypt for secure, role-based access control.
- **Real-Time Engine:** Socket.io (WebSockets for instant dashboard updates)
- **AI Integrations:** Groq AI SDK (LLaMA integration) and Tesseract.js (Optical Character Recognition)

## Slide 4: Key Features - Secure Attendance System
*The highlight of the teacher and student experience.*
- **Dynamic Rotating QR Codes:** The teacher dashboard generates QR codes that change every few seconds, making screenshots useless.
- **Four-Layer Anti-Cheat System:**
  1. **Geofencing:** Validates the student's physical GPS location against the classroom's coordinates.
  2. **IP Proximity Checks:** Ensures the student is connected from the campus network.
  3. **Device Binding:** Prevents multiple students from scanning in using the same phone.
  4. **Time Limits:** QR codes expire instantly.
- **Real-Time Dashboard:** Teachers watch their screen populate with student names instantly as they scan via WebSockets.

## Slide 5: Key Features - AI Smart Scheduling & OCR
*Automating the administrative burden.*
- **Tesseract.js OCR Detection:** Teachers and admins can take a photo of a physical timetable, and the system extracts the text automatically.
- **Groq AI Integration:** Uses powerful LLMs (like LLaMA) to intelligently parse uploaded schedules and generate optimal daily routines.
- **Automated Conflict Resolution:** Prevents double-booking classes or resource overlap.

## Slide 6: Key Features - The Student Dashboard
*Empowering the student experience.*
- **Daily Routine Generator:** Merges the student’s class schedule with their personal goals (e.g., "gym," "studying") to create a seamless timeline.
- **Focus Mode Sessions:** Built-in productivity timers tailored directly to their upcoming tasks.
- **AI Mentor Chat:** An integrated chatbot powered by Groq AI that provides academic advice, schedule optimizations, and instant help.

## Slide 7: Key Features - Teacher Analytics & Workflow
- **Live Class Roster:** CSV roster uploads allow the system to compare "Expected Students" vs "Attended Students".
- **Absentee Identification:** A dedicated reporting tab instantaneously cross-references expected rosters with scanned attendance to flag missing students.
- **Detailed Reporting:** Visual charts mapping attendance trends over the semester.

## Slide 8: How the Architecture Works (System Flow)
1. **Teacher Initialization:** Teacher starts a class session on the frontend. The backend creates a Socket.io room and begins streaming rotating QR codes.
2. **Student Check-In:** Student scans the QR. The frontend requests the student's GPS location and device info and sends it to the backend.
3. **Backend Validation:** Node.js verifies the JWT token, calculates the geofence radius, and validates the IP.
4. **Real-Time Broadcast:** If valid, MongoDB saves the attendance record, and Socket.io broadcasts a success event back to the Teacher's screen instantly.

## Slide 9: Future Scope & Scalability
- **Deployment & Hosting:** The Frontend is orchestrated on Vercel, and the Backend is hosted on Render, ensuring scalable cloud infrastructure.
- **Expansion Plans:** Native mobile application deployment, biometric integrations, and campus-wide hardware scanner integration.
