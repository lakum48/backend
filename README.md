# Database Management System

A full-stack application for managing SQL and NoSQL databases with a modern web interface.

## Features

- Support for multiple database types:
  - PostgreSQL
  - MySQL
  - MongoDB
- CRUD operations interface
- Database schema management
- Visual database structure representation
- User authentication and authorization
- Database migrations
- Data import/export (CSV, JSON)

## Project Structure

```
dbms-project/
├── frontend/          # React frontend application
├── backend/           # Node.js/TypeScript backend
└── docker/           # Docker configuration files
```

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Git
- PostgreSQL (for the application database)

## Getting Started

1. Clone the repository:
```bash
git clone <repository-url>
cd dbms-project
```

2. Set up environment variables:

Create `.env` files in both frontend and backend directories:

Backend (.env):
```
PORT=4000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=dbms
JWT_SECRET=your-secret-key-change-in-production
```

Frontend (.env):
```
REACT_APP_API_URL=http://localhost:4000
```

3. Install dependencies:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

4. Start the development environment:
```bash
# Using Docker Compose
docker-compose up

# Or start services separately
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000

## Development

### Backend

The backend is built with:
- Node.js
- TypeScript
- Express.js
- TypeORM
- JWT for authentication

Key features:
- RESTful API endpoints
- Database connection management
- Query execution
- Schema inspection
- User authentication

### Frontend

The frontend is built with:
- React
- TypeScript
- Material-UI
- React Query
- React Router

Key features:
- Modern, responsive UI
- Real-time query execution
- Schema visualization
- Connection management
- User authentication

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Database Connections
- GET /api/connections - Get all connections
- POST /api/connections - Create a new connection
- DELETE /api/connections/:id - Delete a connection

### Database Operations
- POST /api/connections/:id/query - Execute a query
- GET /api/connections/:id/schema - Get database schema

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
MIT 