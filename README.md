# Project 

Pharmacy management system for pharmacies.

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

# Start the production server (after building)
npm run start
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
## Project Structure
```
.
├── src/
│   ├── controllers/     # Route controllers
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   ├── db/
│   │   ├── migrations/  # Database migrations
│   │   
│   └── server.ts        # Application entry point
|   |__ knexfile.ts       # Knex configuration
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

