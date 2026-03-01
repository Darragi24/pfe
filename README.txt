=========================================
             PetStay Project
=========================================

Description:
------------
PetStay is a Node.js/Express backend for a pet-boarding platform. It provides authentication, role-based access (owner, host, admin), host applications, pet management, booking requests, real-time messaging, and notifications over WebSockets. Any web or mobile client can consume the REST APIs and Socket.IO events.

Technologies Used:
------------------
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT for authentication
- Bcrypt for password hashing
- Multer for file uploads (profile pictures, pet images)
- CORS
- Socket.IO for real-time messaging and notifications
/- Nodemon (dev)

Folder Structure:
-----------------
server/                    - Backend source
  ├─ server.js             - App entry, HTTP & Socket.IO server
  ├─ config/
  │   └─ db.js             - MongoDB connection
  ├─ controllers/          - Request handlers
  │   ├─ authController.js         - Auth, profile, host applications, admin user management
  │   ├─ bookingController.js      - Host search & booking lifecycle
  │   ├─ messageController.js      - Direct messages between users
  │   ├─ notificationController.js - Fetch/mark notifications
  │   └─ petController.js          - CRUD for user pets & images
  ├─ models/               - Mongoose models
  │   ├─ User.js
  │   ├─ Pet.js
  │   ├─ Booking.js
  │   ├─ Message.js
  │   └─ Notification.js
  ├─ routes/               - Express routers
  │   ├─ authRoutes.js
  │   ├─ petRoutes.js
  │   ├─ bookingRoutes.js
  │   ├─ messageRoutes.js
  │   └─ notificationRoutes.js
  └─ uploads/              - Uploaded files
      ├─ profile pictures (root)
      └─ pets/             - Pet images

Key Features:
-------------
1. Authentication & Profiles
   - Register with name, email, password, optional role, profile picture, phone, and bio.
   - Secure password hashing with bcrypt and JWT-based auth.
   - Update name, phone, bio, and profile picture.
   - Account activation/deactivation support (admin only).

2. Roles & Host Applications
   - Roles: `owner`, `host`, `admin` (users can have multiple).
   - Owners can apply to become hosts or update their host profile (experience, preferred pets, price per night).
   - Admins can approve/reject host applications and manage hosts.

3. Pets Management
   - Owners can create, update, and delete their pets.
   - Store pet type, age (in months), description, and image.
   - Age is also returned in a human-readable format (e.g. “1 year 3 months”).

4. Host Discovery & Bookings
   - Search approved, active hosts with filters: pet type, max price, experience keyword.
   - Create booking requests owner → host, linked to a specific pet and date range.
   - Automatic total price calculation based on host’s price-per-night and stay length.
   - Hosts can accept or reject bookings; both sides see their booking lists.

5. Messaging
   - Authenticated users can send direct messages to each other.
   - Optional association between messages and bookings.
   - Conversation threads with read/unread tracking and summary list of conversations.

6. Notifications
   - Persistent notifications stored in MongoDB (e.g. host applications, booking events).
   - Users can fetch and mark notifications as read.

7. Real-Time (Socket.IO)
   - WebSocket server initialized in `server.js`.
   - Rooms:
     - `admin-{adminId}` for admin dashboards.
     - `user-{userId}` for user-specific notifications.
     - Chat room per conversation (`{userIdA}-{userIdB}` sorted).
   - Real-time events for:
     - New notifications (host applications, approvals/rejections, booking changes).
     - New chat messages.

Installation & Setup:
---------------------
1. Clone the repository:
   git clone <repository-url>

2. Backend setup:
   cd server
   npm install

3. Environment variables:
   Create a `.env` file in `server/`:
     PORT=5000
     MONGO_URI=<your-mongodb-uri>
     JWT_SECRET=<your-secret-key>
     # Optional: adjust CORS origin in server.js if your frontend is not http://localhost:3000

4. Start the backend:
   npm run dev
   # or: node server.js

5. Access:
   - REST base URL: http://localhost:5000
   - Socket.IO server: same origin (http://localhost:5000)
   - Static uploads: http://localhost:5000/uploads and http://localhost:5000/uploads/pets

Main API Endpoints (summary):
-----------------------------
- Auth (`/api/auth`)
  - POST `/register`          : Register (multipart/form-data, `profilePic` optional)
  - POST `/login`             : Login, returns JWT + user
  - GET  `/me`                : Get current user
  - POST `/addRole`           : Add a role to current user (auth)
  - POST `/host/apply`        : Apply/update host profile (auth)
  - POST `/host/:userId/approve` / `/reject` : Admin-only host decisions
  - Admin utilities: get all users/hosts, activate/deactivate users/hosts

- Pets (`/api/pets`)
  - POST `/`                  : Create pet (multipart/form-data, `image`)
  - GET  `/`                  : Get pets for logged-in user
  - PUT  `/:id`               : Update pet
  - DELETE `/:id`             : Delete pet

- Bookings (`/api/bookings`)
  - GET  `/hosts`             : List approved hosts with filters
  - POST `/`                  : Create booking request
  - GET  `/my-bookings`       : Bookings where current user is requester
  - GET  `/host-bookings`     : Bookings where current user is host
  - PUT  `/:bookingId/accept` : Host accepts booking
  - PUT  `/:bookingId/reject` : Host rejects booking

- Messages (`/api/messages`)
  - POST `/`                  : Send message
  - GET  `/conversations`     : List conversation partners + last message
  - GET  `/:userId`           : Conversation with a specific user
  - PUT  `/:userId/read`      : Mark messages as read

- Notifications (`/api/notifications`)
  - GET  `/`                  : Get notifications for current user
  - PUT  `/mark-read/:id`     : Mark single notification as read

Notes:
------
- Ensure MongoDB is running and `MONGO_URI` is valid.
- Uploaded files are stored under `server/uploads` (profile pictures) and `server/uploads/pets`.
- Update the CORS configuration and Socket.IO `origin` in `server.js` for non-localhost frontends.

License:
--------
This project is for educational purposes.