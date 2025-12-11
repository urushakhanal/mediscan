# App Monorepo

A full-stack JavaScript monorepo with Express backend and React frontend.

## 🚀 Features

- **Backend (API)**: Express + MongoDB + Swagger Documentation
- **Frontend (Client)**: React (Create React App) + Modern UI
- **Monorepo**: npm workspaces for seamless development
- **Health Monitoring**: Real-time system health dashboard
- **API Documentation**: Auto-generated Swagger docs
- **JavaScript Only**: No TypeScript - pure JavaScript for simplicity

## 📁 Project Structure

```
app/
├── package.json                  # Root package with workspace scripts
├── .gitignore
├── .env.example
├── README.md
│
├── api/                          # Express Backend
│   ├── package.json
│   ├── .env.example
│   ├── .eslintrc.js
│   └── src/
│       ├── index.js              # Server entry point
│       ├── app.js                # Express app configuration
│       ├── config/
│       │   ├── env.js            # Environment configuration
│       │   └── db.js             # MongoDB connection
│       ├── routes/
│       │   └── health.routes.js  # Health check endpoint
│       ├── middlewares/
│       │   └── errorHandler.js   # Global error handler
│       └── docs/
│           └── swagger.js        # Swagger documentation setup
│
└── client/                       # React Frontend
    ├── package.json
    ├── .env.example
    ├── public/
    │   └── index.html
    └── src/
        ├── index.js              # React entry point
        ├── App.jsx               # Main app component
        ├── App.css
        ├── index.css
        └── components/
            ├── HealthStatus.jsx  # Health status component
            └── HealthStatus.css
```

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (v7 or higher) - Comes with Node.js
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)

### Verify Installation

```bash
node --version    # Should be v16+
npm --version     # Should be v7+
mongod --version  # Should be v4.4+
```

## 📦 Installation

### 1. Clone or Navigate to the Project

```bash
cd app
```

### 2. Install All Dependencies

From the `app` root directory, run:

```bash
npm install
```

This will install dependencies for both the API and client using npm workspaces.

### 3. Configure Environment Variables

#### API Configuration

```bash
# Copy the example env file
cp api/.env.example api/.env

# Edit api/.env with your values
```

**api/.env** (example values):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/app_db
APP_NAME=AppMonorepo
APP_VERSION=1.0.0
```

#### Client Configuration

```bash
# Copy the example env file
cp client/.env.example client/.env

# Edit client/.env with your values
```

**client/.env** (example values):

```env
REACT_APP_API_BASE_URL=http://localhost:5000
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# macOS (if installed via Homebrew)
brew services start mongodb-community

# Linux (systemd)
sudo systemctl start mongod

# Or run manually
mongod --dbpath /path/to/data/directory
```

To verify MongoDB is running:

```bash
# Connect to MongoDB shell
mongosh

# Or check the process
ps aux | grep mongod
```

## 🚀 Running the Application

### Option 1: Single Terminal with Labels (Recommended)

```bash
npm run dev
```

Shows both servers with **[API]** and **[CLIENT]** labels in different colors.

### Option 2: Separate Terminals (Easy to Switch)

**Terminal 1:**
```bash
npm run dev:api
```

**Terminal 2:**
```bash
npm run dev:client
```

Just open 2 terminal tabs and run each command. Easy to switch between tabs to see which one has errors.

## 🌐 Application URLs

Once running, you can access:

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React application |
| **API Root** | http://localhost:5000 | API welcome message |
| **Health Check** | http://localhost:5000/api/health | System health status |
| **API Docs** | http://localhost:5000/api/docs | Swagger documentation |
| **API Docs JSON** | http://localhost:5000/api/docs.json | OpenAPI specification |

## 📋 Available Scripts

### Root Level Scripts (run from `app/` directory)

```bash
# Install all dependencies for both api and client
npm install

# Install dependencies for all workspaces
npm run install:all

# Run both API and client with labeled output (RECOMMENDED)
npm run dev

# Run API and client in background (mixed output, not recommended)
npm run dev:parallel

# Run only the API in development mode
npm run dev:api

# Run only the client in development mode
npm run dev:client

# Run linting for both API and client
npm run lint
```

### API Scripts (run from `app/api/` directory or use workspace flag)

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm run start

# Lint code
npm run lint
```

### Client Scripts (run from `app/client/` directory or use workspace flag)

```bash
# Development mode
npm run dev

# Production build
npm run build

# Run tests
npm run test

# Lint code
npm run lint
```

## 🏗️ Architecture Overview

### Backend (API)

**Tech Stack:**
- **Express.js**: Web framework
- **MongoDB**: Database
- **Mongoose**: MongoDB ODM
- **Swagger**: API documentation
- **Morgan**: HTTP request logger
- **CORS**: Cross-origin resource sharing

**Key Features:**
- RESTful API design
- MongoDB connection with connection state monitoring
- Swagger/OpenAPI documentation
- Global error handling
- Environment-based configuration
- Graceful shutdown handling
- Request logging in development

### Frontend (Client)

**Tech Stack:**
- **React**: UI library (JavaScript/JSX)
- **Create React App**: Build tooling
- **CSS**: Styling (no frameworks)

**Key Features:**
- Real-time health status monitoring
- Auto-refresh every 30 seconds
- Error handling and retry logic
- Responsive design
- Clean, modern UI

## 🔍 Health Check Endpoint

The health check endpoint provides system status information:

**Request:**
```bash
GET http://localhost:5000/api/health
```

**Response:**
```json
{
  "success": true,
  "message": "OK",
  "app": {
    "name": "AppMonorepo",
    "version": "1.0.0",
    "env": "development"
  },
  "database": {
    "connected": true,
    "state": "connected"
  },
  "timestamp": "2025-12-10T00:00:00.000Z"
}
```

## 🐛 Troubleshooting

### Understanding Concurrently Output

When you run `npm run dev`, you'll see output like this:

```
[API] 🚀 Server running on http://localhost:5000
[CLIENT] webpack compiled successfully
```

- **[API]** in blue = Backend server output
- **[CLIENT]** in green = React client output
- If one crashes, you'll see which one failed
- Press `Ctrl+C` to stop both servers

**Tip:** If the output is too cluttered, run them in separate terminals:
```bash
# Terminal 1
npm run dev:api

# Terminal 2
npm run dev:client
```

### MongoDB Connection Issues

**Problem**: `MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017`

**Solution:**
1. Make sure MongoDB is running:
   ```bash
   # macOS
   brew services start mongodb-community
   
   # Linux
   sudo systemctl start mongod
   ```

2. Verify MongoDB is accessible:
   ```bash
   mongosh
   ```

3. Check your `MONGO_URI` in `api/.env`

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::5000`

**Solution:**
1. Find and kill the process using the port:
   ```bash
   # Find the process
   lsof -i :5000
   
   # Kill the process (replace PID with actual process ID)
   kill -9 <PID>
   ```

2. Or change the port in `api/.env`:
   ```env
   PORT=5001
   ```

### Client Cannot Connect to API

**Problem**: Frontend shows "Unable to Connect" error

**Solution:**
1. Make sure the API is running on port 5000
2. Check `REACT_APP_API_BASE_URL` in `client/.env`
3. Verify CORS is properly configured in `api/src/app.js`
4. Check browser console for specific error messages

### npm Install Errors

**Problem**: npm install fails with permission errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Try installing again
npm install

# If still failing, check Node.js and npm versions
node --version
npm --version
```

## 📚 API Documentation

The API is fully documented using Swagger/OpenAPI. Once the API is running, visit:

**http://localhost:5000/api/docs**

You can:
- View all available endpoints
- See request/response schemas
- Test endpoints directly from the browser
- Download the OpenAPI specification

## 🧪 Testing the Application

### Test the API Health Endpoint

```bash
# Using curl
curl http://localhost:5000/api/health

# Using httpie (if installed)
http GET http://localhost:5000/api/health
```

### Test from the Browser

1. Open http://localhost:3000 in your browser
2. You should see the health status displayed
3. The status updates automatically every 30 seconds

## 🔐 Environment Variables Reference

### API Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | 5000 | Server port number |
| `NODE_ENV` | No | development | Environment (development/production) |
| `MONGO_URI` | Yes | mongodb://localhost:27017/app_db | MongoDB connection string |
| `APP_NAME` | No | AppMonorepo | Application name |
| `APP_VERSION` | No | 1.0.0 | Application version |

### Client Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `REACT_APP_API_BASE_URL` | Yes | http://localhost:5000 | Backend API base URL |

## 🚢 Production Deployment

### API Deployment

1. Set environment variables:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=your_production_mongodb_uri
   ```

2. Start the server:
   ```bash
   cd api
   npm start
   ```

### Client Deployment

1. Set environment variables:
   ```env
   REACT_APP_API_BASE_URL=https://your-api-domain.com
   ```

2. Build the production bundle:
   ```bash
   cd client
   npm run build
   ```

3. Serve the `build` folder using a static file server (nginx, serve, etc.)

## 📖 Learning Resources

- [Express.js Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Swagger/OpenAPI Specification](https://swagger.io/specification/)

## 🤝 Contributing

1. Follow the existing code style
2. Write clean, commented code
3. Test your changes thoroughly
4. Update documentation as needed

## 📝 License

MIT License - feel free to use this project for learning and development.

---

**Built with ❤️ using JavaScript, Express, React, and MongoDB**
