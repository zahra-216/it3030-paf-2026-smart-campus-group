# UniDesk - Smart Campus Operations Hub

A full-stack web application built for the IT3030 Programming Applications and Frameworks module at SLIIT. UniDesk centralises campus facility bookings, maintenance ticketing, and resource management into a single role-based platform for administrators, staff, and technicians.

## Live Demo

- **Frontend:** https://uni-desk.vercel.app
- **Backend:** Hosted on Microsoft Azure
- **Database:** MySQL hosted on Railway Cloud

Log in using any Google or GitHub account. New users are automatically registered with the USER role. To access admin features, an existing admin must update your role from the Users and Roles page.

---

## Features

- Google and GitHub OAuth2 login — no passwords stored
- Role-based dashboards for Admin, User, and Technician
- Resource catalogue with search and filter
- Facility booking system with conflict detection and approval workflow
- Maintenance ticketing with assignment and resolution workflow
- Automated notifications for booking and ticket events
- Admin analytics dashboard with booking and ticket visualisations
- Notification preferences page with per-category toggles

---

## Tech Stack

| Layer      | Technology                                              |
|------------|---------------------------------------------------------|
| Frontend   | React 18 + Vite — deployed on Vercel                    |
| Backend    | Spring Boot 4.x (Java 21) — deployed on Microsoft Azure |
| Database   | MySQL 9.4 — hosted on Railway Cloud                     |
| Auth       | OAuth2 (Google + GitHub) + JWT                          |

---

## Local Setup

### Backend

1. Navigate to the backend folder: `cd backend`
2. Create `src/main/resources/application-local.properties` and add:
  spring.datasource.url=jdbc:mysql://localhost:3306/unidesk
  spring.datasource.username=your_username
  spring.datasource.password=your_password
  jwt.secret=your_jwt_secret
  spring.security.oauth2.client.registration.google.client-id=YOUR_ID
  spring.security.oauth2.client.registration.google.client-secret=YOUR_SECRET
  spring.security.oauth2.client.registration.github.client-id=YOUR_ID
  spring.security.oauth2.client.registration.github.client-secret=YOUR_SECRET

3. Run: `./mvnw spring-boot:run`
4. API runs at `http://localhost:8081`

### Frontend

1. Navigate to the frontend folder: `cd frontend`
2. Install dependencies: `npm install`
3. Create a `.env` file: `VITE_API_URL=http://localhost:8081`
4. Run: `npm run dev`
5. Open `http://localhost:5173`

---

## Team

| Name                    | Module                                   |
|-------------------------|------------------------------------------|
| Zahra Hasan             | Auth + Notifications (D + E) — Team Lead |
| Kauminee Gunasekara     | Resource Management (A)                  |
| Nuhaz Ahameth M.R       | Booking Management (B)                   |
| Kulani Sandamila        | Maintenance Ticketing (C)                |

---

## Module

IT3030 - Programming Applications and Frameworks  
Year 3 Semester 1 - SLIIT
