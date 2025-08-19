# Online Forum Backend

A comprehensive backend API for an online discussion forum built with Node.js, Express, and MongoDB.

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```
4. Start the server: `npm start`
5. For development: `npm run dev`

## Features

- **User Authentication**: JWT-based authentication with registration and login
- **Thread Management**: Create, read, update, delete discussion threads
- **Nested Replies**: Support for nested comment system
- **Voting System**: Upvote/downvote threads and replies
- **Categories & Tags**: Organize content with categories and tags
  - Categories with filtering by active status
  - Thread count for categories
  - Sorting threads by recent, popular, or views
  - Comprehensive input validation and error handling
- **Search & Filtering**: Search threads and filter by various criteria
- **User Profiles**: User profiles with reputation system
- **Admin Panel**: Admin and moderator roles with special permissions
- **Rate Limiting**: Protection against spam and abuse
- **Input Validation**: Comprehensive validation and sanitization
- **Security**: Helmet, CORS, password hashing, and more

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token

### Categories
- `GET /api/categories` - Get all categories with optional filtering by active status
- `GET /api/categories/:id` - Get a single category with optional thread count
- `GET /api/categories/:id/threads` - Get threads by category with sorting options (recent, popular, views)
- `POST /api/categories` - Create a new category (admin only)
- `PUT /api/categories/:id` - Update a category (admin only)
- `DELETE /api/categories/:id` - Delete a category (admin only)

### Tags
- `GET /api/tags` - Get all tags with pagination and search
- `GET /api/tags/popular` - Get popular tags based on usage count
- `GET /api/tags/:id` - Get a single tag with recent threads
- `POST /api/tags` - Create a new tag (admin only)
- `PUT /api/tags/:id` - Update a tag (admin only)
- `DELETE /api/tags/:id` - Delete a tag (admin only)

### Threads
- `GET /api/threads` - Get all threads with filtering, sorting, and pagination
  - Filter by category, tags, and search terms
  - Sort by recent, popular (votes), or views
- `GET /api/threads/:id` - Get a single thread with replies (increments view count)
- `POST /api/threads` - Create a new thread (authenticated users)
  - Requires title, content, category
  - Optional tags (up to 5)
