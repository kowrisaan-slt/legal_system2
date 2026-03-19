# Legal Management System

A comprehensive web application for managing legal cases and agreement approvals, built with React, Node.js, Express, and PostgreSQL (Prisma).

## Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (installed and running)
- Git

## Project Structure
- `client/`: React Frontend (Vite)
- `server/`: Node.js/Express Backend

## Installation & Setup Guide

Follow these steps to set up the system from scratch.

### 1. unzipping files

### 2. Backend Setup (`server/`)
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

#### Database Configuration
1.  Create a `.env` file in the `server/` directory.
2.  Add your PostgreSQL database connection string and a secret key:

    ```env
    DATABASE_URL="postgresql://postgres:password@localhost:5432/agreement_db?schema=public"
    JWT_SECRET="your_secret_key_here"
    PORT=5000
    ```
    *(Replace `password` with your actual Postgres password)*

#### Database Migration & Seeding
Run the following commands inside `server/` to create tables and seed default data:
```bash
# Generate Prisma Client
npx prisma generate

# Run Migrations (Create Tables)
npx prisma migrate dev --name init

# Seed Database (Create Admin User)
node prisma/seed.js
```
*(Note: If you need to reset the database entirely, you can run `node reset_db.js` followed by the migration and seed commands above.)*

#### Run the Backend
Start the backend server:
```bash
npm start
# Server runs on http://backend-service:5000
```
> Keep this terminal open.

### 3. Frontend Setup (`client/`)
Open a **new terminal**, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

#### Run the Frontend
Start the React application:
```bash
npm run dev
# Client runs on http://localhost:5173
```

## System Access

Once both servers are running, open your browser and go to `http://localhost:5173`.

### Admin Credentials (Default)
Use this account to log in and create other users (Legal Officers, Reviewers, etc.).

- **Email/USER name:** `admin@localhost`
- **Password:** `12345`

## Modules Overview

### 1. Agreement Management
- **Drafting**: Create and upload initial agreement drafts.
- **Workflow**: Reviewer -> Approver -> CLO (Chief Legal Officer).
- **Notifications**: Role-based real-time notifications for actions.

### 2. Legal Case Handling
- **Case Tracking**: Manage cases, court dates, and assignments.
- **Assignment**: Assign cases to Legal Officers (LO) or allow user self-pickup.

## Technologies
- **Frontend**: React, Tailwind CSS, Vite
- **Backend**: Node.js, Express.js
- **Database**: PostgreSQL, Prisma ORM
