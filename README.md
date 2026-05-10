# Resumate – AI-Based Resume Analysis & Recruitment Platform

## Overview

Resumate is an AI-powered recruitment and resume analysis platform designed to simplify the hiring process for candidates, recruiters, and administrators. The platform provides resume building, ATS-based resume analysis, job management, and candidate tracking features in a modern web application.

The project improves recruitment efficiency using AI, NLP, and automation techniques.

---

## Features

### Candidate Module
- User Authentication (Login/Register)
- Resume Builder
- Resume Upload & Parsing
- ATS Score Analysis
- Skill Extraction
- Job Listings
- Apply for Jobs
- Resume Export (PDF/DOCX)

### Recruiter Module
- Create and Manage Job Posts
- View Applicants
- Track Job Status
- Recruitment Analytics Dashboard
- Candidate Shortlisting

### Admin Module
- Manage Users
- Monitor Jobs and Applications
- Access Recruiter Features
- System Analytics Dashboard

---

## Technologies Used

### Frontend
- React.js
- Vite
- Tailwind CSS

### Backend
- Node.js
- Express.js

### Database
- MongoDB

### AI/NLP
- Python
- NLP-Based Resume Analysis
- ATS Scoring System

---

## Project Structure

```bash
resumate/
│
├── client/        # Frontend
├── server/        # Backend API
├── ai-service/    # AI/NLP Services
├── database/      # Database Configurations
└── README.md
```

---

## Installation & Setup

### Clone Repository

```bash
git clone <repository-url>
cd resumate
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

### Backend Setup

```bash
cd server
npm install
npm start
```

### AI Service Setup

```bash
cd ai-service
pip install -r requirements.txt
python app.py
```

---

## Environment Variables

Create a `.env` file in the backend folder.

```env
PORT=4000
MONGODB_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
AI_SERVICE_URL=http://127.0.0.1:8000
```

---

## Core Functionalities

- AI Resume Analysis
- ATS Score Generation
- Resume Parsing
- Job Posting and Application Tracking
- Role-Based Authentication
- Resume Builder
- Recruiter Dashboard
- Admin Management System

---

## Future Enhancements

- Advanced AI/ML Models
- Interview Scheduling
- AI Chatbot Support
- Job Portal Integration
- Mobile Application
- Advanced Analytics

---

## Screenshots


---

