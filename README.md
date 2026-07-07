# Anor Learning Platform

A modern learning platform built with Next.js (Frontend) and NestJS (Backend).

## Features

- 📚 Tariff & Lesson Management (Darslik)
- 📹 Video Streaming (Google Drive integration)
- 👥 User Management
- 🔐 Authentication & Authorization
- 📱 Responsive Design
- 🎨 Modern UI with Tailwind CSS

## Tech Stack

### Frontend
- Next.js 15
- React 18
- TypeScript
- Tailwind CSS
- Zustand (State Management)
- Radix UI Components

### Backend
- NestJS
- TypeORM
- PostgreSQL (Production) / SQLite (Development)
- JWT Authentication
- Passport.js

## Quick Start

### Local Development

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd anor-client-master
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Start development servers**
   ```bash
   npm run dev:full
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

### Production Deployment

#### Vercel Deployment (Recommended)

1. **Prepare environment variables**
   - Set up PostgreSQL database on Vercel
   - Configure environment variables in Vercel dashboard:
     - `NEXT_PUBLIC_API_URL` - Your API URL
     - `JWT_SECRET` - Secret key for JWT tokens
     - `DATABASE_URL` - PostgreSQL connection string
     - `CORS_ORIGIN` - Your frontend URL

2. **Deploy**
   ```bash
   # Push to GitHub
   git push origin master
   
   # Connect repository to Vercel
   # Vercel will automatically deploy on push
   ```

#### Manual Deployment

1. **Build the application**
   ```bash
   npm run build:full
   ```

2. **Start production servers**
   ```bash
   npm run start:full
   ```

## Environment Variables

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=Anor Learning Platform
```

### Backend (client/.env)
```env
# Database
DB_TYPE=sqlite
DB_DATABASE=anor.db

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1d

# Server
PORT=5000
NODE_ENV=production

# CORS
CORS_ORIGIN=http://localhost:3000

# Email (Eskiz)
ESKIZ_EMAIL=your_eskiz_email@example.com
ESKIZ_PASSWORD=your_eskiz_password

# File Upload
MAX_FILE_SIZE=2147483648
UPLOAD_DEST=./uploads
```

## API Endpoints

### Authentication
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /users/me` - Get current user

### Tariffs & Lessons
- `GET /api/tariffs` - Get all tariffs
- `POST /api/tariffs` - Create tariff (Admin only)
- `GET /api/tariffs/:id` - Get tariff by ID
- `GET /api/tariffs/:id/lessons` - Get lessons for a tariff
- `POST /api/tariffs/:id/lessons` - Create lesson (Admin only)
- `GET /api/lessons/:id` - Get lesson by ID

### Videos
- `GET /api/videos` - Get all videos
- `POST /api/videos` - Create video with Google Drive link (Admin only)
- `GET /api/videos/:id` - Get video by ID
- `GET /watch/:id` - Watch video (Google Drive or local)

## Admin Access

Default admin credentials:
- Email: `admin@anor.uz`
- Password: `admin123`

## File Structure

```
anor-client-master/
├── app/                    # Next.js frontend pages
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   ├── watch/             # Video player
│   └── ...
├── client/                 # NestJS backend
│   ├── src/
│   │   ├── modules/       # Feature modules
│   │   ├── main.ts        # Application entry point
│   │   └── app.module.ts  # Root module
│   └── uploads/           # Video uploads (optional)
├── components/            # React components
├── lib/                   # Utility functions
├── services/              # API services
├── store/                 # State management
├── types/                 # TypeScript types
└── vercel.json            # Vercel configuration
```

## Development Scripts

- `npm run dev` - Start frontend development server
- `npm run dev:backend` - Start backend development server
- `npm run dev:full` - Start both servers concurrently
- `npm run build` - Build frontend for production
- `npm run build:backend` - Build backend for production
- `npm run build:full` - Build both applications
- `npm run start:full` - Start both servers in production

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   # Kill processes using ports 3000 and 5000
   npx kill-port 3000 5000
   ```

2. **Database issues**
   ```bash
   # Delete database and restart
   rm client/anor.db
   npm run dev:full
   ```

3. **Permission issues (Linux/Mac)**
   ```bash
   chmod +x deploy.sh
   sudo chown -R $USER:$USER client/uploads
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.



