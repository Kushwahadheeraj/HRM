# Traxale HRM Platform

Traxale HRM is a modern, comprehensive Human Resource Management platform designed to streamline HR operations, employee management, attendance tracking, leave management, payroll processing, and more. Built with React, TypeScript, Node.js, Express, and MongoDB, it provides a robust, scalable solution for organizations of all sizes.

## Features

### Core Features
- **Employee Management**: Complete employee directory with detailed profiles, roles, departments, and reporting hierarchies.
- **Attendance Tracking**: Real-time attendance monitoring with clock-in/out functionality, QR code support, and location tracking.
- **Leave Management**: Employee leave requests, approval workflows, and leave balance management.
- **Payroll Processing**: Automated payroll calculation, payslip generation (PDF), and payroll history.
- **Performance Management**: Performance reviews, goal tracking, and performance analytics.
- **Recruitment**: Candidate management, job postings, and recruitment pipeline tracking.
- **Team Chat**: Real-time team and direct messaging with file attachments.
- **AI Assistant**: AI-powered insights and assistance for HR operations.
- **Analytics & Reports**: Comprehensive dashboards with attendance, leave, and performance analytics.
- **Organization Settings**: Department management, shift management, and holiday configuration.
- **User Roles & Permissions**: Role-based access control (Super Admin, HR Manager, Team Manager, Employee).

### Key Modules
1. **Dashboard**: Personalized dashboards for each user role with key metrics and quick actions.
2. **My Profile**: Employee self-service for profile management, attendance, leave, and payslips.
3. **Team Directory**: Complete employee directory with team management.
4. **Settings**: User preferences, theme settings, and integration configurations.
5. **AI Assistant**: AI-powered HR assistant for quick insights.
6. **Trial Mode**: 30-day free trial with premium features.

## Tech Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **PDF Generation**: @react-pdf/renderer
- **Real-time Communication**: Socket.IO Client
- **Animations**: Framer Motion
- **QR Code**: html5-qrcode
- **Routing**: React Router DOM
- **TypeScript**: Type-safe development

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens) with bcrypt for password hashing
- **File Upload**: express-fileupload
- **Email**: Nodemailer
- **SMS/Payments**: Razorpay (optional)
- **Slack Integration**: @slack/web-api, @slack/events-api (optional)
- **Excel**: xlsx for data import/export
- **TypeScript**: Type-safe development

## Project Structure

```
traxale-hrm/
├── client/               # Frontend React application
│   ├── public/          # Static assets
│   ├── src/             # Source code
│   │   ├── components/  # Reusable React components
│   │   ├── lib/         # API, types, utilities
│   │   ├── pages/       # Page components
│   │   ├── App.tsx      # Main app component
│   │   └── main.tsx     # Entry point
│   └── package.json     # Frontend dependencies
│
└── server/              # Backend Node.js application
    ├── src/             # Source code
    │   ├── config/      # Database and environment config
    │   ├── controllers/ # Route handlers
    │   ├── middleware/  # Express middleware
    │   ├── models/      # Mongoose data models
    │   ├── routes/      # API routes
    │   ├── socket/      # Socket.IO server
    │   ├── types/       # TypeScript types
    │   └── utils/       # Utility functions
    └── package.json     # Backend dependencies
```

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation & Setup

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd traxale-hrm
```

#### 2. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your MongoDB connection string, JWT secret, and other configurations
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   The backend will run on `http://localhost:5000`

#### 3. Frontend Setup
1. Navigate to the client directory in a new terminal:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

### Environment Variables

#### Server (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/traxale-hrm
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRE=30d
# Optional: For email, Slack, Razorpay integrations
EMAIL_USER=your-email
EMAIL_PASS=your-email-password
SLACK_BOT_TOKEN=xoxb-...
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

## Usage

1. **Sign Up / Register**: First, register as an HR Manager/Organization Admin to create your organization.
2. **Add Employees**: Add employees, assign roles, and define department structures.
3. **Configure Shifts & Holidays**: Set up work shifts and company holidays.
4. **Manage Attendance**: Monitor employee attendance, approve requests, and generate reports.
5. **Process Payroll**: Run payroll cycles and generate payslips.
6. **Use Team Chat**: Collaborate with team members through real-time messaging.

## Default Roles

- **Super Admin**: Full system access (platform management, organization creation).
- **HR Manager**: Organization-level management (employees, payroll, settings).
- **Team Manager**: Team-level management (attendance, leave approvals, reviews).
- **Employee**: Self-service access (profile, attendance, leave, payroll).

## Development

### Backend Development
- `npm run dev`: Start development server with nodemon
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run production build
- `npm run seed`: Seed initial data (if configured)

### Frontend Development
- `npm run dev`: Start Vite dev server
- `npm run build`: Build for production
- `npm run lint`: Run ESLint for code quality

## Contributing

We welcome contributions to Traxale HRM! Please follow these steps:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support or inquiries, please contact the Traxale team or open an issue on GitHub.
