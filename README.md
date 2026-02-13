# News Search Application - Final Project

A Twitter/X-like social media platform with AI-powered news search capabilities.

**Team Size:** 2 Developers

## Features

- **Authentication**: JWT + Google OAuth ✅
- **Posts**: Create, edit, delete posts with images
- **Comments**: Comment on posts
- **Likes**: Like/unlike posts
- **Real-Time Web Search**: OpenAI Web Search tool for actual news ✅
- **Security**: Input sanitization & XSS prevention ✅
- **User Profiles**: View and edit profiles with Google profile images
- **Responsive UI**: Modern React frontend
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest unit tests (30+)
- **Google Sign-In**: One-click authentication with Google

## Tech Stack

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- OpenAI API
- Multer (file upload)
- Swagger

### Frontend
- React 19 + TypeScript
- Tailwind CSS
- React Query
- React Hook Form
- Axios

## Prerequisites

Before you begin, ensure you have:
- **Node.js 18+** installed
- **MongoDB** running (local or remote)
- **OpenAI API Key** (get from https://platform.openai.com/api-keys)
- **Git** installed
- **Text editor** (VS Code recommended)

## Quick Installation

### Step 1: Install Backend Dependencies

```bash

# Install backend dependencies
npm install
```

**If you get 403 errors (work registry issue):**
```bash
# Use public registry explicitly
npm install --registry=https://registry.npmjs.org/
```

The project includes `.npmrc` files to force use of public npm registry.

### Step 2: Setup Environment Variables

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env
```

**Edit `.env` file with your credentials:**

```env
# Server Configuration
NODE_ENV=development
PORT=4000

# MongoDB - UPDATE WITH YOUR CREDENTIALS
MONGODB_URI=mongodb://username:password@host:port/database
# Example: mongodb://admin:password@localhost:27017/news-search-app

# JWT Secrets - GENERATE STRONG RANDOM STRINGS
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-key-at-least-32-characters-long
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# OpenAI API Key - GET FROM https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-proj-your-actual-openai-api-key-here

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/auth/google/callback

# File Upload
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**📘 For Google OAuth setup, see [GOOGLE_OAUTH_SETUP.md](GOOGLE_OAUTH_SETUP.md)**

### Step 3: Create Uploads Directory

```bash
mkdir uploads
```

### Step 4: Setup Frontend Environment

```bash
# Navigate to frontend directory
cd frontend

# Create frontend .env file
echo "REACT_APP_API_URL=http://localhost:4000" > .env

# Install frontend dependencies
npm install
```

### Step 5: Run the Application

#### Option 1: Run Both Servers with One Command (Recommended)

```bash
# Start both backend and frontend
./start.sh
```

This will:
- ✅ Start backend on port 4000
- ✅ Start frontend on port 3000
- ✅ Show logs in real-time
- ✅ Stop both with Ctrl+C

#### Option 2: Development Mode (Live Logs)

```bash
# Start with live logs from both servers
./dev.sh
```

#### Option 3: Manual (Two Terminals)

**Terminal 1 - Backend:**
```bash
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

#### Stop Servers

```bash
# Stop all servers
./stop.sh

# Or press Ctrl+C if using start.sh or dev.sh
```

## 🔑 Where to Get API Keys

### OpenAI API Key (Required)

1. Go to https://platform.openai.com/api-keys
2. Sign up or log in
3. Click "Create new secret key"
4. Copy the key (starts with `sk-proj-...`)
5. Paste it in `.env` as `OPENAI_API_KEY=sk-proj-your-key-here`

**Important:** 
- Keep your API key secret
- Never commit it to Git
- You need credits in your OpenAI account

### Google OAuth (Optional)

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add to `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

## ✅ Verify Installation

### Check Backend

Open browser and visit:
- **Health Check**: http://localhost:4000/health
- **API Docs**: http://localhost:4000/api-docs

You should see:
- Health check returns `{"status":"ok"}`
- Swagger UI loads successfully

### Check Frontend

Open browser and visit:
- **Frontend**: http://localhost:3000

You should see:
- Login page loads
- No console errors

## 🧪 Run Tests

```bash
# Backend tests
npm test

# Backend tests with coverage
npm run test:coverage

# Frontend tests
cd frontend
npm test
```

## 📚 API Documentation

Once the server is running, visit:
- **Swagger UI**: http://localhost:4000/api-docs
- **API JSON**: http://localhost:4000/api-docs.json

## 📁 Project Structure

```
AdvWebApp-Final-project/
├── src/                    # Backend source code
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers (5)
│   ├── middleware/        # Express middleware
│   ├── models/            # MongoDB models (5)
│   ├── routes/            # API routes (5)
│   ├── services/          # Business logic (AI service)
│   ├── tests/             # Jest tests (30+)
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   ├── app.ts             # Express app setup
│   └── server.ts          # Server entry point
├── frontend/              # React frontend
│   ├── public/           # Static files
│   └── src/              # Frontend source
│       ├── components/   # React components
│       ├── contexts/     # React contexts
│       ├── pages/        # Page components
│       ├── types/        # TypeScript types
│       └── utils/        # Utility functions
├── uploads/              # Uploaded images (created on first run)
├── .env                  # Environment variables (create from .env.example)
├── .env.example          # Environment template
├── package.json          # Backend dependencies
└── Documentation/        # Comprehensive guides (10 files)
```

## 🔧 Troubleshooting

### MongoDB Connection Error

**Problem:** `MongoServerError: Authentication failed`

**Solution:**
1. Verify MongoDB is running
2. Check credentials in `.env`
3. Test connection:
```bash
mongo --port YOUR_PORT -u YOUR_USERNAME -p YOUR_PASSWORD
```

### OpenAI API Error

**Problem:** `Error: Invalid API key` or `Insufficient credits`

**Solution:**
1. Verify API key is correct in `.env`
2. Check API key at https://platform.openai.com/api-keys
3. Ensure you have credits in your OpenAI account
4. Make sure key starts with `sk-proj-` or `sk-`

### Port Already in Use

**Problem:** `Error: listen EADDRINUSE: address already in use :::4000`

**Solution:**
```bash
# Find and kill process using port 4000
lsof -ti:4000 | xargs kill -9

# Or change PORT in .env
PORT=4001
```

### Frontend Can't Connect to Backend

**Problem:** Network error or CORS error

**Solution:**
1. Verify backend is running on port 4000
2. Check `REACT_APP_API_URL` in `frontend/.env`
3. Verify CORS is configured correctly

### NPM 403 Forbidden Error (Work Registry)

**Problem:** `npm error 403 403 Forbidden - GET https://your-work-registry...`

**Solution:**
```bash
# Use public registry explicitly
npm install --registry=https://registry.npmjs.org/

# Or temporarily rename your global .npmrc
mv ~/.npmrc ~/.npmrc.backup
npm install
mv ~/.npmrc.backup ~/.npmrc
```

See `NPM_REGISTRY_FIX.md` for detailed solutions.

### Module Not Found

**Problem:** `Cannot find module 'xyz'`

**Solution:**
```bash
# Clean install backend
rm -rf node_modules package-lock.json
npm install --registry=https://registry.npmjs.org/

# Clean install frontend
cd frontend
rm -rf node_modules package-lock.json
npm install --registry=https://registry.npmjs.org/
```


## Development Workflow

```bash
# Terminal 1 - Backend with auto-reload
npm run dev

# Terminal 2 - Frontend with auto-reload
cd frontend && npm start

# Terminal 3 - Run tests (optional)
npm run test:watch
```

## Production Deployment

### Deployment Method

This project uses **PM2 process manager** for production deployment directly on the server. No automated CI/CD pipeline.

### Server Requirements

- **Node.js**: 18+
- **MongoDB**: Running instance
- **PM2**: Installed globally (`npm install -g pm2`)
- **Ports**: 80 (HTTP), 443 (HTTPS)
- **SSL Certificates**: Self-signed or Let's Encrypt

### Initial Server Setup

```bash
# Clone repository
git clone <your-repository-url>
cd <project-directory>

# Create production .env file
nano .env

# Install dependencies
npm install

# Build backend
npm run build

# Build frontend
cd frontend
npm install
npm run build
cd ..

# Create uploads directory
mkdir uploads

# Generate self-signed SSL certificates (if needed)
openssl req -nodes -new -x509 -keyout client-key.pem -out client-cert.pem -days 365

# Start with PM2 (requires sudo for ports 80/443)
sudo pm2 start ecosystem.config.js --env production
sudo pm2 save
sudo pm2 startup
```

### Production Environment Variables

Create `.env` file in project root:

```env
NODE_ENV=production
PORT=4000
HTTPS_PORT=443
HTTP_PORT=80

MONGODB_URI=mongodb://username:password@host:port/database
JWT_SECRET=your-production-jwt-secret
JWT_REFRESH_SECRET=your-production-refresh-secret
OPENAI_API_KEY=sk-proj-your-openai-key

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://your-domain.com/auth/google/callback

UPLOAD_DIR=uploads
FRONTEND_URL=https://your-domain.com
```

**Note**: URL-encode special characters in passwords (e.g., `@` becomes `%40`)

### Update Deployment (After Code Changes)

```bash
# Pull latest changes
git pull origin main

# Install new dependencies (if any)
npm install

# Rebuild backend
npm run build

# Rebuild frontend
cd frontend
npm install
npm run build
cd ..

# Restart PM2
sudo pm2 restart news-search-app --update-env

# Check logs
sudo pm2 logs news-search-app --lines 50
```

### PM2 Management Commands

```bash
# Status
sudo pm2 status

# Logs (real-time)
sudo pm2 logs news-search-app

# Restart
sudo pm2 restart news-search-app --update-env

# Stop
sudo pm2 stop news-search-app

# Delete and recreate (for major changes)
sudo pm2 delete news-search-app
sudo pm2 start ecosystem.config.js --env production
sudo pm2 save
```

### Google OAuth Setup

This project uses **client-side Google Sign-In** (not server redirect flow), which works even with self-signed SSL certificates.

**Google Cloud Console:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Add **Authorized JavaScript origins**:
   - `https://your-domain.com`
   - `http://localhost:3000` (for development)
3. No redirect URIs needed (client-side flow)

## Authors

Tal Cohen

## License

ISC

