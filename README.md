# Health Report System

A secure digital health record management system built with Java, Spring Boot, React.js, MySQL, Spring Security, and JWT.

## 📌 Project Overview

The Health Report System allows patients, doctors, and lab technicians to securely manage and access medical reports and health test results.

The system uses JWT authentication and role-based authorization to protect medical data and control access based on the user's role.

## 🚀 Features

- User registration and login
- JWT-based authentication
- Role-based authorization
- Separate dashboards for:
    - Patient
    - Doctor
    - Lab Technician
- Medical report management
- PDF report upload and access
- Health test result management
- Patient health-test analytics
- Test-result trend visualization
- Backend validation
- Secure patient-data access
- REST APIs
- MySQL database integration

## 👥 User Roles

### Patient

Patients can:

- Log in securely
- View their own medical reports
- View their test results
- View health-test analytics

### Doctor

Doctors can:

- Log in securely
- View patient information
- Access authorized patient reports
- View patient test results

### Lab Technician

Lab technicians can:

- Log in securely
- Upload medical reports
- Add test results
- Manage reports they uploaded

## 🛠️ Tech Stack

### Backend

- Java
- Spring Boot
- Spring Security
- JWT
- Spring Data JPA
- Hibernate
- Maven
- REST APIs

### Frontend

- React.js
- JavaScript
- HTML
- CSS
- React Router
- Recharts

### Database

- MySQL

### Development Tools

- IntelliJ IDEA
- VS Code
- Postman
- Git
- GitHub

## 🏗️ System Architecture

```text
                    ┌──────────────────┐
                    │      React       │
                    │    Frontend      │
                    └────────┬─────────┘
                             │
                        REST APIs
                             │
                             ▼
                    ┌──────────────────┐
                    │   Spring Boot    │
                    │     Backend      │
                    └────────┬─────────┘
                             │
             ┌───────────────┼───────────────┐
             │               │               │
             ▼               ▼               ▼
       Spring Security     Services       REST APIs
             │               │
             ▼               ▼
            JWT             JPA
                             │
                             ▼
                    ┌──────────────────┐
                    │      MySQL       │
                    │     Database     │
                    └──────────────────┘



Health Analytics

The patient dashboard provides visual analytics for health-test results.

The frontend uses Recharts to display test-result trends and make health data easier to understand.

🔌 Main API Areas
Authentication
POST /api/users/signup
POST /api/users/login
Users
GET /api/users/patients
GET /api/users/{id}
Reports
POST /api/reports
GET /api/reports
GET /api/reports/{id}
GET /api/reports/{id}/pdf
DELETE /api/reports/{id}
Test Results
POST /api/test-results
GET /api/test-results
DELETE /api/test-results/{id}

Exact API behavior and authorization depend on the authenticated user's role.