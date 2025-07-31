# Lead Tracker - Full-Stack CRM Application

A comprehensive lead management system built with Next.js, featuring authentication, lead tracking, notes, follow-ups, bulk import, and analytics.

## 🚀 Features

- **User Authentication**: Secure signup/login with JWT-based authentication
- **Lead Management**: Complete CRUD operations for leads with status tracking
- **Notes System**: Add, view, and delete notes for each lead
- **Follow-ups**: Schedule and track follow-up tasks with due dates
- **Bulk Import**: Import leads from CSV/Excel files with validation
- **Dashboard Analytics**: Visual charts and metrics using Recharts
- **Responsive Design**: Mobile-friendly UI with Tailwind CSS
- **State Management**: Efficient data fetching with TanStack Query

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with bcrypt password hashing
- **State Management**: TanStack Query
- **Charts**: Recharts
- **File Processing**: PapaParse (CSV) and XLSX (Excel)
- **UI Components**: Custom components with Tailwind CSS

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL database (Supabase/Neon recommended)
- npm/yarn/pnpm

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd leads
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@host:port/database"

   # JWT Secret
   JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

   # Next.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-change-this-in-production"
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open the application**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The application uses the following main models:

- **User**: Authentication and user management
- **Lead**: Lead information with status tracking
- **Note**: Notes associated with leads
- **FollowUp**: Scheduled follow-up tasks

## 🎯 Usage

1. **Sign Up/Sign In**: Create an account or log in
2. **Dashboard**: View analytics and lead metrics
3. **Leads**: Add, edit, delete, and filter leads
4. **Notes**: Add notes to leads for better tracking
5. **Follow-ups**: Schedule and manage follow-up tasks
6. **Import**: Bulk import leads from CSV/Excel files

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── dashboard/         # Dashboard pages
├── components/            # Reusable UI components
├── hooks/                 # Custom React hooks with TanStack Query
├── lib/                   # Utility functions and configurations
└── middleware.ts          # Route protection middleware
```

## 🔐 API Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET/POST /api/leads` - Lead management
- `GET/PUT/DELETE /api/leads/[id]` - Individual lead operations
- `POST /api/leads/bulk-import` - Bulk lead import
- `GET/POST /api/notes` - Notes management
- `GET/POST /api/follow-ups` - Follow-ups management
- `GET /api/dashboard/stats` - Dashboard analytics

## 🚀 Deployment

The application can be deployed on platforms like Vercel, Netlify, or any Node.js hosting service.

1. **Environment Variables**: Set up all required environment variables
2. **Database**: Ensure your production database is accessible
3. **Build**: Run `npm run build` to create a production build
4. **Deploy**: Follow your hosting platform's deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please open an issue in the GitHub repository or contact the development team.
