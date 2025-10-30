# Project Name

Brief description of your project.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

## Environment Variables

Create a `.env` file in the root directory with the following variables:
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# JWT
JWT_ACCESS_SECRET_KEY=your_access_secret_key
JWT_REFRESH_SECRET_KEY=your_refresh_secret_key
JWT_ACCESS_TOKEN_EXPIRES=15m
JWT_REFRESH_TOKEN_EXPIRES=7d

# Email (Mailgun)
MAILGUN=your_mailgun_api_key
SENDER_EMAIL=noreply@yourdomain.com

# Server
NODE_ENV=development
PORT=3000
```

## Installation
```bash
# Install dependencies
npm install
```

## Database Setup
```bash
# Run migrations
npm run migrate:latest

# Check migration status
npm run migrate:status

# Rollback last migration (if needed)
npm run migrate:rollback
```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Build the application
npm run build

# Start the server
npm start
```

## Database Migrations
```bash
# Create a new migration
npm run migrate:make <migration_name>

# Run all pending migrations
npm run migrate:latest

# Rollback the last batch of migrations
npm run migrate:rollback

# Check migration status
npm run migrate:status

# List all migrations
npm run migrate:list
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `POST /api/v1/auth/logout` - Logout user

## Project Structure
```
.
├── src/
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── db/
│   │   ├── migrations/  # Database migrations
│   │   └── knexfile.ts  # Knex configuration
│   ├── types/           # TypeScript type definitions
│   └── server.ts        # Application entry point
├── dist/                # Compiled JavaScript (generated)
└── package.json
```

## Technologies Used

- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **PostgreSQL** - Database
- **Knex.js** - SQL query builder
- **JWT** - Authentication
- **Mailgun** - Email service

## License

