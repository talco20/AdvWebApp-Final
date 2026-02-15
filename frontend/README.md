# News Search Application - Frontend

React TypeScript frontend for the News Search Application.

## Features

- 🔐 User authentication (login/register)
- 📝 Create, view, edit, delete posts
- 🖼️ Image upload for posts and profiles
- ❤️ Like/unlike posts
- 💬 Comment on posts
- 🔍 AI-powered news search
- 👤 User profiles
- 📱 Responsive design with Tailwind CSS

## Tech Stack

- **React 19** with TypeScript
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form handling
- **Axios** for API calls
- **Tailwind CSS** for styling

## Getting Started

### Prerequisites

- Node.js 18+
- Backend API running on `http://localhost:4000`

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm start
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # Reusable components
│   ├── Auth/           # Authentication components
│   ├── Layout/         # Layout components
│   └── Post/           # Post-related components
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── Home.tsx        # Home feed
│   ├── Login.tsx       # Login page
│   ├── Register.tsx    # Registration page
│   ├── Profile.tsx     # User profile
│   ├── PostDetail.tsx  # Post detail with comments
│   ├── CreatePost.tsx  # Create new post
│   └── Search.tsx      # AI search page
├── types/              # TypeScript types
├── utils/              # Utility functions
│   └── api.ts          # API client with interceptors
├── App.tsx             # Main app component
└── index.tsx           # Entry point
```

## Environment Variables

Create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:4000
```

For production:

```env
REACT_APP_API_URL=https://your-production-domain.com
```

## Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (not recommended)

## Features Overview

### Authentication
- JWT-based authentication
- Automatic token refresh
- Protected routes
- Remember me functionality

### Posts
- Create posts with text and images
- Edit and delete own posts
- Like/unlike posts
- View post details
- Infinite scroll pagination

### Comments
- Add comments to posts
- Delete own comments
- View all comments on post detail page

### Search
- AI-powered news search using OpenAI
- Categorized results
- Search history

### Profile
- View user profiles
- Edit own profile (username and image)
- Upload profile picture
- View user's posts

## Design System

### Colors
- Primary: Blue (#3b82f6)
- Success: Green
- Error: Red
- Gray scale for text and backgrounds

### Components
- Modern card-based layouts
- Smooth animations
- Responsive design (mobile-first)
- Clean typography

## API Integration

The app communicates with the backend API using Axios with:
- Automatic JWT token injection
- Token refresh on 403 errors
- Error handling
- Request/response interceptors

## Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `build` folder to your server or hosting service

3. Configure environment variables for production

4. Ensure the backend API URL is correctly set

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

ISC

