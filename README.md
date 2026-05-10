# Resumate – AI-Powered Resume Analysis & Recruitment Platform

An intelligent recruitment platform that streamlines hiring using AI-driven resume analysis, ATS scoring, candidate management, and recruiter automation.

---

# 📌 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-feures)
  - [Candidate Module](#candidate-module)
  - [Recruiter Module](#recruiter-module)
  - [Admin Module](#admin-module)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Installation & Setup](#-installation--setup)
- [Environment Variables](#-environment-variables)
- [API Workflow](#-api-workflow)
- [AI Resume Analysis Flow](#-ai-resume-analysis-flow)
- [Core Functionalities](#-core-functionalities)
- [Database Design](#-database-design)
- [Authentication & Security](#-authentication--security)
- [Screenshots](#-screenshots)
- [Future Enhancements](#-future-enhancements)

---

# 🚀 Overview

**Resumate** is a modern AI-powered recruitment and resume analysis platform built to simplify and automate the hiring process for candidates, recruiters, and administrators.

The platform combines:

- Artificial Intelligence
- Natural Language Processing (NLP)
- ATS-based resume evaluation
- Recruitment workflow automation

to help recruiters identify qualified candidates faster and assist job seekers in improving their resumes.

Resumate provides:

✅ Resume creation and optimization  
✅ ATS score analysis  
✅ Skill extraction from resumes  
✅ Job posting and application tracking  
✅ Recruiter and admin dashboards  
✅ AI-powered hiring insights

---

# ✨ Key Features

## 👨‍💼 Candidate Module

### 🔐 Authentication
- Secure Login & Registration
- JWT-based authentication
- Role-based authorization

### 📄 Resume Builder
- Create professional resumes
- Dynamic resume sections
- Export resumes as PDF/DOCX

### 📤 Resume Upload & Parsing
- Upload resumes in PDF/DOCX format
- Automatic resume parsing
- Extract:
  - Skills
  - Education
  - Experience
  - Contact Information

### 🤖 ATS Resume Analysis
- AI-powered ATS scoring system
- Resume quality analysis
- Keyword optimization suggestions
- Resume improvement recommendations

### 💼 Job Portal
- Browse available jobs
- Search and filter jobs
- Apply directly through platform
- Track application status

---

## 🧑‍💻 Recruiter Module

### 📝 Job Management
- Create job postings
- Edit/Delete jobs
- Manage recruitment workflow

### 👨‍💼 Applicant Tracking
- View applicants per job
- Resume screening
- Candidate shortlisting
- Application status management

### 📊 Analytics Dashboard
- Hiring statistics
- Applicant analytics
- Recruitment insights
- Job performance tracking

---

## 🛡 Admin Module

### ⚙️ User Management
- Manage candidates and recruiters
- Activate/Deactivate accounts
- Role management

### 📈 Platform Monitoring
- Monitor jobs and applications
- Access recruiter functionalities
- View overall system analytics

### 🔒 Administrative Controls
- Manage platform operations
- Track recruitment activity
- Maintain system integrity

---

# 🏗️ System Architecture

```text
                ┌────────────────────┐
                │   React Frontend   │
                │  (Vite + Tailwind) │
                └─────────┬──────────┘
                          │
                          ▼
                ┌────────────────────┐
                │  Node.js Backend   │
                │    Express API     │
                └─────────┬──────────┘
                          │
          ┌───────────────┴───────────────┐
          ▼                               ▼
┌──────────────────┐          ┌────────────────────┐
│    MongoDB       │          │   AI/NLP Service   │
│  Database Layer  │          │   Python + NLP     │
└──────────────────┘          └────────────────────┘
```

---

# 🛠 Tech Stack

## Frontend
| Technology | Purpose |
|------------|---------|
| React.js | UI Development |
| Vite | Fast Build Tool |
| Tailwind CSS | Styling & Responsive Design |
| Axios | API Requests |
| React Router | Navigation |

---

## Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime Environment |
| Express.js | REST API Framework |
| JWT | Authentication |
| Multer | File Upload Handling |

---

## Database
| Technology | Purpose |
|------------|---------|
| MongoDB | NoSQL Database |
| Mongoose | ODM for MongoDB |

---

## AI/NLP Services
| Technology | Purpose |
|------------|---------|
| Python | AI Processing |
| NLP | Resume Parsing |
| ATS Algorithm | Resume Scoring |
| Skill Extraction | Candidate Skill Analysis |

---

# 📂 Project Structure

```bash
resumate/
│
├── client/                     # Frontend Application
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/                     # Backend API
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── uploads/
│   └── server.js
│
├── ai-service/                 # AI/NLP Microservice
│   ├── models/
│   ├── services/
│   ├── utils/
│   └── app.py
│
├── database/                   # Database Configurations
│
├── README.md
└── package.json
```

---

# ⚙️ Installation & Setup

## 1️⃣ Clone the Repository

```bash
git clone <repository-url>
cd resumate
```

---

# 🖥 Frontend Setup

```bash
cd client

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on:

```bash
http://localhost:5173
```

---

# 🔧 Backend Setup

```bash
cd server

# Install dependencies
npm install

# Start backend server
npm start
```

Backend runs on:

```bash
http://localhost:4000
```

---

# 🤖 AI Service Setup

```bash
cd ai-service

# Create virtual environment
python -m venv venv
```

### Activate Virtual Environment

#### Windows
```bash
venv\Scripts\activate
```

#### Linux/Mac
```bash
source venv/bin/activate
```

### Install Dependencies

```bash
pip install -r requirements.txt
```

### Start AI Service

```bash
python app.py
```

AI service runs on:

```bash
http://127.0.0.1:8000
```

---

# 🔐 Environment Variables

Create a `.env` file inside the `server/` directory.

```env
PORT=4000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

AI_SERVICE_URL=http://127.0.0.1:8000
```

---

# 🔄 API Workflow

## Authentication APIs
- User Registration
- User Login
- JWT Token Verification

## Resume APIs
- Upload Resume
- Parse Resume
- Generate ATS Score
- Export Resume

## Job APIs
- Create Job
- Update/Delete Job
- Apply for Job
- Fetch Applicants

## Admin APIs
- Manage Users
- Monitor Jobs
- Analytics Reports

---

# 🧠 AI Resume Analysis Flow

```text
Resume Upload
      │
      ▼
Resume Parsing
      │
      ▼
Skill Extraction
      │
      ▼
Keyword Matching
      │
      ▼
ATS Score Calculation
      │
      ▼
Suggestions & Feedback
```

---

# 🎯 Core Functionalities

## ✅ Resume Parsing
Extracts:
- Skills
- Experience
- Education
- Contact Information

## ✅ ATS Score Generation
Analyzes:
- Keyword relevance
- Resume structure
- Formatting quality
- Skill matching

## ✅ Recruitment Automation
- Candidate tracking
- Job management
- Recruiter workflow optimization

## ✅ Role-Based Access
Different dashboards for:
- Candidates
- Recruiters
- Admins

---

# 🗄 Database Design

## Collections

### Users
```js
{
  name,
  email,
  password,
  role
}
```

### Jobs
```js
{
  title,
  company,
  description,
  skills,
  recruiterId
}
```

### Applications
```js
{
  candidateId,
  jobId,
  resume,
  status
}
```

---

# 🔒 Authentication & Security

- JWT Authentication
- Password Hashing
- Protected Routes
- Role-Based Authorization
- Secure File Upload Handling

---

# 📸 Screenshots

## Candidate Dashboard
_Add screenshot here_

## Recruiter Dashboard
_Add screenshot here_

## ATS Analysis Page
_Add screenshot here_

## Admin Dashboard
_Add screenshot here_

---

# 🚀 Future Enhancements

- Advanced AI/ML Resume Ranking
- Interview Scheduling System
- AI Chatbot Assistance
- Email Notifications
- Real-Time Messaging
- Video Interview Integration
- Third-Party Job Portal Integration
- Mobile Application
- Advanced Recruitment Analytics

---

