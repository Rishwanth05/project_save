# Project SAVE (Safety Alert & Visibility Engine)

Project SAVE is a full-stack public safety hazard reporting web app. Users can sign up/login, report hazards with photos + map location, and view/filter nearby hazards. Built with a vanilla HTML/CSS/JS frontend and a Node.js/Express backend with MySQL.

## Features

-  User Authentication (Signup / Login)
-  Report a Hazard (details + image upload)
-  View Hazards (results + filtering workflow)
-  Location pin support (Leaflet/OpenStreetMap on frontend)
-  Contact page (email sending via API route)
-  File upload support ('/uploads' served by backend)

## Tech Stack

**Frontend**
- HTML, CSS, JavaScript (Vanilla)
- Pages: `login`, `signup`, `dashboard`, `report`, `filter`, `results`, `contact`, success pages
- Assets folder for logo/images

**Backend**
- Node.js + Express
- REST APIs (JSON)
- CORS enabled
- Static hosting for uploaded files (`/uploads`)

**Database**
- MySQL (XAMPP / localhost)
- DB: `project_save`
- Tables: `users`, `reports`.


# project strcuture at current stage of devlopement 
project-save/
├─ backend/
│ ├─ node_modules/
│ ├─ src/
│ │ ├─ routes/
│ │ │ ├─ authRoutes.js
│ │ │ ├─ contactRoutes.js
│ │ │ └─ reportRoutes.js
│ │ ├─ uploads/ # (may exist inside src depending on setup)
│ │ ├─ app.js
│ │ ├─ db.js
│ │ └─ server.js
│ ├─ uploads/ # uploaded images (served publicly)
│ ├─ .env
│ ├─ package.json
│ └─ package-lock.json
│
└─ frontend/
├─ assets/
│ └─ logo.svg.svg
├─ auth-login.css
├─ auth-modern.css
├─ contact.css
├─ contact.html
├─ contact.js
├─ dashboard.css
├─ dashboard.html
├─ dashboard.js
├─ filter.html
├─ filter.js
├─ login.html
├─ login.js
├─ report-modern.css
├─ report.html
├─ report.js
├─ results.html
├─ results.js
├─ signup.html
├─ signup.js
├─ resolved-success.html
├─ success.html
└─ style.css

## Requirements

- Node.js (LTS recommended)
- MySQL (XAMPP or local MySQL server)
- VS Code + nodemon for development

## Environment Variables (`backend/.env`)

Create a file: `backend/.env`

Example:
`env
# Server
PORT=5000

# MySQL
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=project_save

# SendGrid (if enabled in contact route)
SENDGRID_API_KEY=your_key_here
SENDGRID_FROM=your_verified_sender@example.com
SENDGRID_TO=your_destination@example.com

# Database Setup (MySQL)
Start XAMPP
Enable Apache + MySQL
Open phpMyAdmin and create database:
project_save
# Create tables:
users
reports

Exact endpoint names depend on your route definitions, but your structure includes:

authRoutes.js - signup/login APIs

reportRoutes.js - create/list/filter report APIs

contactRoutes.js - send email/message API


POST /api/auth/signup
POST /api/auth/login
POST /api/reports 
GET /api/reports 
POST /api/contact (send message)
Uploads are served from:
GET /uploads/<filename>

# Future Cloud Upgrade (currently working on)

Planned Cloud/DevOps version:
RDS MySQL (move DB to AWS)
S3 (store hazard images)
Docker (containerize backend)
ECS Fargate + ALB (deploy backend)
S3 + CloudFront (host frontend)
Route 53 + ACM (domain + HTTPS)
CloudWatch (logs/metrics/alarms)
GitHub Actions CI/CD (auto deploy)

# Author
Rishwanth Reddy Adamala
MS Computer Science — University of Central Missouri