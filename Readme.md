You can test these endpoints using the [Hopscotch Collection](your_hopscotch_link_here).
# Backend Video Platform API

A backend REST API for a video platform with features similar to YouTube, including user authentication, video management, likes, comments, and subscriptions.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
  - [User Routes](#user-routes)
  - [Video Routes](#video-routes)
  - [Like Routes](#like-routes)
  - [Comment Routes](#comment-routes)
  - [Subscription Routes](#subscription-routes)
  - [Tweet Routes](#tweet-routes)
  - [Playlist Routes](#playlist-routes)
  - [Dashboard Routes](#dashboard-routes)

## Features
- User authentication and authorization
- Video upload and management
- Like/dislike functionality
- Comments system
- Channel subscriptions
- User playlists
- Watch history tracking
- Tweet functionality
- Dashboard analytics
- Health check endpoint

## Tech Stack
- Node.js
- Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Cloudinary (for media storage)
- Cookie Parser
- CORS enabled

## Getting Started

### Prerequisites
- Node.js
- MongoDB
- Cloudinary account

### Installation
1. Clone the repository
```bash
git clone <repository-url>
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=8000
MONGODB_URI=your_mongodb_uri
ACCESS_TOKEN_SECRET=your_access_token_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. Start the server
```bash
npm start
```

The server will start on `http://localhost:8000`

## API Documentation

### Base URL
```
http://localhost:8000/api/v1
```

### Authentication
Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### User Routes
Base endpoint: `/users`

#### Register User
- **URL:** `/register`
- **Method:** `POST`
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `username` (required): Unique username
  - `email` (required): Unique email address
  - `fullname` (required): User's full name
  - `password` (required): Password
  - `avtar` (required): Profile image file
  - `coverImage` (optional): Cover image file
- **Response:**
```json
{
    "statusCode": 200,
    "data": {
        "username": "example_user",
        "fullname": "Example User",
        "email": "user@example.com",
        "avtar": "cloudinary_url",
        "coverImage": "cloudinary_url"
    },
    "message": "user registered successfully"
}
```

#### Login
- **URL:** `/login`
- **Method:** `POST`
- **Body:**
```json
{
    "email": "user@example.com",
    "password": "yourpassword"
}
```
- **Response:** Returns user data and sets auth cookies

#### Logout
- **URL:** `/logout`
- **Method:** `POST`
- **Auth:** Required
- **Response:** Clears auth cookies

#### Refresh Token
- **URL:** `/refresh-token`
- **Method:** `POST`
- **Body/Cookies:** Refresh token
- **Response:** New access and refresh tokens

#### Change Password
- **URL:** `/change-password`
- **Method:** `PATCH`
- **Auth:** Required
- **Body:**
```json
{
    "oldPassword": "current",
    "newPassword": "new"
}
```

#### Get Current User
- **URL:** `/current-user`
- **Method:** `GET`
- **Auth:** Required

#### Update Account Details
- **URL:** `/account-info`
- **Method:** `PATCH`
- **Auth:** Required
- **Body:**
```json
{
    "email": "new@example.com",
    "username": "newusername",
    "fullname": "New Name"
}
```

#### Update Avatar/Cover Image
- **URL:** `/avtar` or `/coverImage`
- **Method:** `PATCH`
- **Auth:** Required
- **Content-Type:** `multipart/form-data`

#### Get Channel Profile
- **URL:** `/c/:username`
- **Method:** `GET`
- **Auth:** Required
- **Response:** Channel details with subscriber counts

#### Get Watch History
- **URL:** `/history`
- **Method:** `GET`
- **Auth:** Required
- **Response:** List of watched videos with creator details
[Previous README content remains the same until the Additional Routes section]

### Video Routes
Base endpoint: `/api/v1/vidios`

All video routes require authentication (🔒).

#### Get All Videos
- **URL:** `/`
- **Method:** `GET`
- **Auth:** Required
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Results per page (default: 10)
  - `query` (optional): Search term for title/description
  - `sortBy` (optional): Field to sort by
  - `sortType` (optional): "asc" or "desc"
  - `userId` (optional): Filter by user
- **Success Response:**
```json
{
    "statusCode": 200,
    "data": [
        {
            "thumbnail": "thumbnail_url",
            "videoFile": "video_url",
            "title": "Video Title",
            "description": "Video Description",
            "videoBy": {
                "fullname": "Creator Name",
                "username": "creator_username",
                "avtar": "avatar_url"
            }
        }
    ],
    "message": "fetched successfully"
}
```

#### Publish a Video
- **URL:** `/`
- **Method:** `POST`
- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **Body Parameters:**
  - `title` (string, required): Video title
  - `description` (string, required): Video description
  - `duration` (number, required): Video duration
  - `vidio` (file, required): Video file
  - `thumbnail` (file, required): Video thumbnail
- **Success Response:**
```json
{
    "statusCode": 200,
    "data": {
        "videoFile": "cloudinary_video_url",
        "thumbnail": "cloudinary_thumbnail_url",
        "title": "Video Title",
        "description": "Description",
        "duration": "duration",
        "owner": "user_id"
    },
    "message": "video uploaded successfully"
}
```

#### Get Video by ID
- **URL:** `/:videoId`
- **Method:** `GET`
- **Auth:** Required
- **URL Parameters:**
  - `videoId`: Video's unique ID
- **Success Response:**
```json
{
    "statusCode": 200,
    "data": {
        "videoFile": "video_url",
        "title": "Video Title",
        "description": "Description",
        "views": 0,
        "createdAt": "timestamp",
        "duration": "duration",
        "comments": [],
        "owner": {
            "username": "creator_username",
            "avatar": "avatar_url",
            "subscribersCount": 0,
            "isSubscribed": false
        },
        "likesCount": 0,
        "isLiked": false
    },
    "message": "fetched video successfully"
}
```

#### Update Video
- **URL:** `/:videoId`
- **Method:** `PATCH`
- **Auth:** Required
- **Content-Type:** `multipart/form-data`
- **URL Parameters:**
  - `videoId`: Video's unique ID
- **Body Parameters:**
  - `title` (string, required): New title
  - `description` (string, required): New description
  - `thumbnail` (file, required): New thumbnail
- **Note:** Previous thumbnail will be deleted from Cloudinary
- **Success Response:**
```json
{
    "statusCode": 200,
    "data": {
        "updated_video_details"
    },
    "message": "updated successfully"
}
```

#### Delete Video
- **URL:** `/:videoId`
- **Method:** `DELETE`
- **Auth:** Required
- **URL Parameters:**
  - `videoId`: Video's unique ID
- **Note:** Deletes video and thumbnail from Cloudinary
- **Success Response:**
```json
{
    "statusCode": 200,
    "data": {
        "deleted_video_details"
    },
    "message": "deleted successfully"
}
```

#### Toggle Video Publication
- **URL:** `/toggle-publish/:videoId`
- **Method:** `PATCH`
- **Auth:** Required
- **URL Parameters:**
  - `videoId`: Video's unique ID
- **Success Response:**
```json
{
    "statusCode": 200,
    "data": {
        "video_details_with_updated_status"
    },
    "message": "status toggled"
}
```

### Video Upload Specifications
- Videos and thumbnails are stored on Cloudinary
- Supports multiple video formats
- File upload is handled by Multer middleware
- Maximum file size limits apply

### Error Responses
Video-specific error codes:
- 400: Invalid video ID, missing required fields
- 404: Video not found
- 500: Cloudinary upload failure

### Error Handling
All endpoints return errors in this format:
```json
{
    "success": false,
    "message": "Error description",
    "statusCode": 400
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Server Error

### Middleware
- `auth.middleware.js`: JWT verification
- `multer.middleware.js`: File upload handling

### File Upload Limits
- Maximum file size: 16KB
- Supported image formats: JPEG, PNG
- Files stored on Cloudinary

### Security Features
- Password hashing
- JWT authentication
- HTTP-only cookies
- CORS enabled
- Request size limits

## Additional Routes
The following routes are also available (documentation to be added):
- `/videos`: Video management
- `/likes`: Like/unlike functionality
- `/comments`: Comment management
- `/subscriptions`: Channel subscriptions
- `/tweets`: User tweets
- `/playlist`: Playlist management
- `/dashboard`: Analytics and stats
- `/healthcheck`: API health monitoring

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License
This project is licensed under the MIT License.
