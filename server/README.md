# Traxale HRM Server

A professional, production-ready backend for the Traxale HRM platform built with Node.js, Express, TypeScript, and MongoDB.

## 📁 Project Structure

```
server/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.ts       # Environment variables
│   │   └── db.ts        # MongoDB connection
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── employee.controller.ts
│   │   ├── attendance.controller.ts
│   │   ├── leave.controller.ts
│   │   └── payroll.controller.ts
│   ├── middleware/      # Custom middleware
│   │   ├── logger.middleware.ts
│   │   ├── errorHandler.middleware.ts
│   │   └── notFound.middleware.ts
│   ├── models/          # MongoDB models
│   │   ├── User.model.ts
│   │   ├── Employee.model.ts
│   │   ├── Attendance.model.ts
│   │   ├── Leave.model.ts
│   │   └── Payroll.model.ts
│   ├── routes/          # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── employee.routes.ts
│   │   ├── attendance.routes.ts
│   │   ├── leave.routes.ts
│   │   └── payroll.routes.ts
│   ├── types/           # TypeScript interfaces
│   │   └── index.ts
│   ├── utils/           # Helper functions
│   │   └── seedData.ts  # Data seeding script
│   └── index.ts         # Server entry point
├── .env                 # Environment variables
├── .gitignore
├── package.json
└── tsconfig.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or later)
- MongoDB (local installation or MongoDB Atlas)

### Installation

```bash
cd server
npm install
```

### Configuration

Create a `.env` file in the server directory with the following variables:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/traxale-hrm
```

### Seed Initial Data

To populate the database with sample data:

```bash
npm run seed
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints

### Auth
- `POST /api/auth/login` - Login with role

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `GET /api/employees/:id` - Get employee by ID
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee
- `GET /api/employees/manager/:managerName` - Get employees by manager

### Attendance
- `GET /api/attendance` - Get all attendance records
- `POST /api/attendance` - Create attendance record
- `GET /api/attendance/employee/:employeeId` - Get attendance by employee ID
- `PUT /api/attendance/:id` - Update attendance

### Leaves
- `GET /api/leaves` - Get all leave requests
- `POST /api/leaves` - Create leave request
- `GET /api/leaves/employee/:employeeId` - Get leaves by employee ID
- `PATCH /api/leaves/:id/status` - Update leave status
- `DELETE /api/leaves/:id` - Delete leave request

### Payroll
- `GET /api/payroll` - Get all payroll records
- `POST /api/payroll` - Create payroll record
- `GET /api/payroll/employee/:employeeId` - Get payroll by employee ID
- `PUT /api/payroll/:id` - Update payroll
- `DELETE /api/payroll/:id` - Delete payroll record

### Health Check
- `GET /api/health` - Check server status

## 🛠️ Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## 🏗️ Architecture

This project follows a clean, modular architecture with clear separation of concerns:

1. **Routes** - Define API endpoints
2. **Controllers** - Handle request/response logic
3. **Models** - MongoDB schemas and data access
4. **Middleware** - Cross-cutting concerns (logging, errors)
5. **Config** - Environment and app configuration
6. **Utils** - Helper functions and utilities