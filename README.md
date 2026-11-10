# FreelanceTracker — Client & Project Workspace Manager

**FreelanceTracker** is a multi-tenant client and project lifecycle tracking platform tailored for independent software consultants, engineering agencies, and freelance developers. It unifies project budgets, client deliverables, status tracking, deadline monitoring, and granular role-based team collaboration.

---

## 1. Problem Statement

Freelancers and small agile development agencies struggle with managing multiple clients across fragmented tools:
1. **Scattered Client Records**: Milestones, budgets, and deadlines are spread across notes, spreadsheets, and chat threads.
2. **Lack of Granular Role Control**: Inviting external contractors or clients to view project timelines often exposes administrative actions or billing details.
3. **Data Leakage & Insecure Isolation**: Generic tracking tools often fail to enforce strict tenant isolation, risking accidental cross-client visibility.

FreelanceTracker addresses these challenges with strict JWT-authenticated tenant boundaries, three-tiered role permissions (Admin, Member, Viewer), live budget and deadline analytics, and fast search across clients, titles, and IDs.

---

## 2. Key Features

- **Project & Client Lifecycle Management**: Create, update, complete, and archive client engagements.
- **Granular Role-Based Access Control (RBAC)**:
  - **Admin**: Full control over project metadata, budget, members, roles, and deletion.
  - **Member**: Can update task status and active deliverables, but cannot rename or delete the project.
  - **Viewer**: Read-only timeline and milestone visibility.
- **Strict Data Isolation**: Users can query only projects they own or belong to as invited team members.
- **Real-Time Dashboard Analytics**: Computes total project volume, active deliverables, completion rate, and aggregate budget.
- **Search & Filter Engine**: Instant search across client names, project titles, and unique MongoDB IDs, with tabs for active and completed states.
- **Responsive Workspace UI**: Dark-mode dashboard built with modern CSS custom properties, fast navigation, and toast notifications.

---

## 3. Technology Stack

- **Frontend**: React 19, Vite 8, React Router v7, Lucide React, React Toastify.
- **Backend**: Node.js, Express 5, Mongoose 9, jsonwebtoken, bcryptjs, cors.
- **Database**: MongoDB (Atlas cloud cluster or local replica).
- **Tooling & Quality**: ESLint 10, custom automated verification test runner (`node:assert`).

---

## 4. Architecture Overview

```
 +------------------------+              +--------------------------+
 |  React 19 + Vite SPA   |  HTTP / REST |   Express 5 API Server   |
 |  (Client Dashboard)    | -----------> |   (Port 5000 / Node.js)  |
 +------------------------+              +--------------------------+
      |               ^                              |
      | Bearer Token  | JSON Response                | Mongoose ODM
      v               |                              v
 +------------------------+              +--------------------------+
 | Protected Views:       |              | MongoDB Atlas / Cluster  |
 | - Dashboard Analytics  |              | - users collection       |
 | - Projects Table       |              | - projects collection    |
 | - Project Detail & Team|              +--------------------------+
 | - User Profile         |
 +------------------------+
```

---

## 5. Project Folder Structure

```
freelancetracker/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection manager with resilient error handling
│   ├── controllers/
│   │   ├── authController.js     # User registration, login, profile management
│   │   ├── membersController.js  # Project team invitation & role administration
│   │   └── projectController.js  # Project CRUD, filtering, & tenant isolation
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT Bearer token protection & verification
│   │   └── permissionMiddleware.js # Dynamic role loading (Admin/Member/Viewer)
│   ├── models/
│   │   ├── project.js            # Project & Member embedded schemas
│   │   └── user.js               # User schema with bcrypt methods
│   ├── routes/
│   │   ├── authRoutes.js         # /auth endpoints
│   │   ├── membersRoutes.js      # /projects/:id/members endpoints
│   │   └── projectRoutes.js      # /projects endpoints
│   ├── tests/
│   │   └── run-tests.js          # Automated RBAC & crypto test suite
│   ├── .env.example              # Backend environment template
│   ├── package.json              # Backend dependencies & npm test script
│   └── server.js                 # Express application root
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx        # Navigation shell & sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global session state & authenticated fetch
│   │   ├── hooks/
│   │   │   └── usePermission.js  # Client-side permission computation hook
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Analytics stats & recent projects
│   │   │   ├── Projects.jsx      # Filterable project table & CRUD modal
│   │   │   ├── ProjectDetail.jsx # Milestone metadata & member management
│   │   │   ├── Profile.jsx       # User profile & password updates
│   │   │   ├── Login.jsx         # User login form
│   │   │   └── Signup.jsx        # User registration form
│   │   ├── App.jsx               # React Router route hierarchy
│   │   └── main.jsx              # DOM root entry
│   ├── index.html                # HTML entry
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite build configuration
├── vercel.json                   # Vercel SPA build & routing configuration
├── .env.example                  # Root environment template
├── .gitignore                    # Git ignore rules (.env, node_modules, dist)
└── README.md                     # Engineering documentation
```

---

## 6. Installation Instructions

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- MongoDB Atlas cluster or running MongoDB instance

### Setup Steps
```bash
# Clone the repository
git clone https://github.com/Dhinesh1628/freelancetracker.git
cd freelancetracker

# Install Backend dependencies
cd backend
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

---

## 7. Environment Configuration

### Backend (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/freelancetracker?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key_change_in_production
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000
```

---

## 8. Database Setup

FreelanceTracker uses MongoDB with Mongoose:
- Collections are automatically generated upon first document insertion (`users`, `projects`).
- Ensure your MongoDB Atlas cluster Network Access allows connections from your deployment IP (or `0.0.0.0/0` with secure credentials).

---

## 9. API Endpoint Summary

### Authentication (`/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Register new user account | No |
| `POST` | `/auth/login` | Authenticate user & receive JWT | No |
| `GET` | `/auth/me` | Fetch active user profile | Yes (Bearer) |
| `PUT` | `/auth/me` | Update name, email, or password | Yes (Bearer) |

### Projects (`/projects`)
| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects` | Get user projects with role annotations | Any Member |
| `POST` | `/projects` | Create project (creator becomes admin) | Authenticated |
| `GET` | `/projects/:id` | Get project details | Admin / Member / Viewer |
| `PUT` | `/projects/:id` | Update project metadata / status | Admin or Member |
| `DELETE` | `/projects/:id` | Delete project | Admin Only |

### Team Members (`/projects/:id/members`)
| Method | Endpoint | Description | Role Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/projects/:id/members` | List project collaborators | Admin / Member / Viewer |
| `POST` | `/projects/:id/members` | Invite member by email | Admin Only |
| `PUT` | `/projects/:id/members/:userId` | Update member role | Admin Only |
| `DELETE` | `/projects/:id/members/:userId` | Remove member from project | Admin Only |

---

## 10. Testing Instructions

### Backend Automated Test Suite
Run the test runner to verify crypto, authentication, RBAC, tenant isolation, and metrics:
```bash
cd backend
npm test
```

### Frontend Lint & Build Checks
```bash
cd frontend
npm run lint
npm run build
```

---

## 11. Deployment Instructions

### Backend (Render / Railway)
1. Create a Web Service connected to your repository.
2. Set Root Directory to `backend`.
3. Set Build Command: `npm install` and Start Command: `npm start`.
4. Configure Environment Variables: `MONGO_URI`, `JWT_SECRET`, `PORT`.

### Frontend (Vercel)
1. Import repository into [Vercel](https://vercel.com).
2. Root `vercel.json` automatically configures Vite build (`cd frontend && npm install && npm run build`).
3. Add Environment Variable: `VITE_API_URL=https://your-backend.onrender.com`.
4. Deploy!

---

## 12. Known Limitations

- **MongoDB Atlas IP Whitelisting**: Atlas requires whitelisting deployment IP addresses or setting `0.0.0.0/0`.
- **In-App Email Delivery**: Team invitations associate existing user accounts by email; email notification dispatching requires SMTP provider configuration.
