<div align="center">

# ⚡ NF Forms

### _A Comic Book-Themed Event Registration Platform_

[![Built with React](https://img.shields.io/badge/Frontend-React%2019-61dafb?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Powered by Express](https://img.shields.io/badge/Backend-Express%205-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Database MongoDB](https://img.shields.io/badge/Database-MongoDB%207-47a248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Dockerized](https://img.shields.io/badge/Containerized-Docker-2496ed?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

---

**NF Forms** is a role-based event management and form registration system with a bold **comic book UI**. Admins create events, assign Points of Contact (POCs), and Data Collectors (DCs) fill forms — all tracked with a full activity log.

</div>

---

## 🎨 Screenshots

<div align="center">

| Login | Admin Dashboard |
|:---:|:---:|
| ![Login](https://via.placeholder.com/400x250/1a1a2e/ffe066?text=⚡+NF+Forms+Login) | ![Dashboard](https://via.placeholder.com/400x250/fef9c3/1a1a2e?text=🛡️+Admin+HQ) |

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🛡️ **Role-Based Access** | Three distinct roles — Admin, POC, DC — each with their own dashboard |
| 📝 **Event Management** | Admins create events with custom questions, deadlines, and POC assignments |
| ✏️ **Form Filling** | DCs fill event forms with team-based responses |
| 🔒 **One-Time Fill** | DCs can only submit once per event — enforced on both frontend & backend |
| ⏰ **Deadlines** | Admins set submission deadlines; expired forms auto-lock |
| 👥 **POC Assignment** | Admins assign specific POCs to events; unassigned POCs can't see the event |
| 📜 **Activity Logs** | Every action (create, update, fill) is logged — admin-only audit trail |
| 👤 **User Management** | Admins can add new DC and POC users directly from the dashboard |
| 🎨 **Comic Book UI** | Bold borders, halftone backgrounds, Bangers font, pop-art colors |
| 📱 **Fully Responsive** | Works on desktop, tablet, and mobile |
| 🐳 **Dockerized** | One command to run everything |

---

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) & Docker Compose

### Run with a single command

```bash
git clone https://github.com/Divyanssss/nfforms.git
cd nfforms
docker compose up --build
```

That's it! 🎉

| Service | URL |
|---------|-----|
| 🖥️ **Frontend** | [http://localhost:3000](http://localhost:3000) |
| ⚙️ **Backend API** | [http://localhost:5000/api](http://localhost:5000/api) |
| 🍃 **MongoDB** | `mongodb://localhost:27017/nfforms` |

> The `seed` service runs automatically on first launch and populates test users.

---

## 🔑 Test Credentials

The seed script creates the following users automatically:

| Role | Name | Email | Password |
|------|------|-------|----------|
| 🛡️ **Admin** | Admin | `admin@nfforms.com` | `admin123` |
| 👁️ **POC** | POC User | `poc@nfforms.com` | `poc123` |
| 👁️ **POC** | POC User 2 | `poc2@nfforms.com` | `poc123` |
| 📋 **DC** | DC User | `dc@nfforms.com` | `dc123` |
| 📋 **DC** | DC User 2 | `dc2@nfforms.com` | `dc123` |
| 📋 **DC** | DC User 3 | `dc3@nfforms.com` | `dc123` |

---

## 🏗️ Architecture

```
nfforms/
├── backend/                # Express.js API server
│   ├── models/             # Mongoose schemas
│   │   ├── User.js         # User (admin, poc, dc)
│   │   ├── Event.js        # Events with questions & deadlines
│   │   ├── Response.js     # DC form responses
│   │   └── Log.js          # Activity audit logs
│   ├── routes/
│   │   ├── auth.js         # Login, register, user listing
│   │   └── events.js       # CRUD events, responses, logs
│   ├── middleware/
│   │   └── auth.js         # JWT auth + role guard
│   ├── seed.js             # Test data seeder
│   ├── server.js           # Express entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend-app/           # React 19 SPA
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.js
│   │   │   ├── AdminDashboard.js
│   │   │   ├── PocDashboard.js
│   │   │   ├── DcDashboard.js
│   │   │   ├── EventFillPage.js
│   │   │   └── EventResponsesPage.js
│   │   ├── components/
│   │   │   └── ProtectedRoute.js
│   │   ├── AuthContext.js  # Auth state management
│   │   ├── api.js          # API client
│   │   ├── App.js          # Routes & layout
│   │   ├── App.css         # Comic book design system
│   │   └── index.css       # Base styles
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml      # Full-stack orchestration
└── README.md
```

---

## 🔧 Development (without Docker)

### Backend

```bash
cd backend
npm install
npm run seed       # Seed test users
npm run start      # Start on :5000
```

### Frontend

```bash
cd frontend-app
npm install
npm run start      # Start on :3000
```

> Make sure MongoDB is running locally on port 27017.

---

## 🛠️ API Endpoints

### Auth (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/login` | ❌ | Login with email & password |
| `GET` | `/me` | ✅ | Get current user profile |
| `POST` | `/admin/create-user` | 🛡️ Admin | Create a new DC/POC user |
| `GET` | `/users/poc` | 🛡️ Admin | List all POC users |

### Events (`/api/events`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | ✅ | List events (filtered by role) |
| `POST` | `/` | 🛡️ Admin | Create new event |
| `GET` | `/:id` | ✅ | Get event details |
| `PUT` | `/:id` | 🛡️ Admin/POC | Update event |
| `POST` | `/:id/responses` | 📋 DC | Submit form response |
| `GET` | `/:id/responses` | 🛡️ Admin/👁️ POC | View responses |
| `GET` | `/admin/logs` | 🛡️ Admin | View activity logs |

---

## 🎭 User Roles

### 🛡️ Admin
- Create & manage events with custom questions
- Set submission deadlines
- Assign POCs to events
- Add new DC/POC users
- View all responses
- Access full activity logs

### 👁️ POC (Point of Contact)
- View only assigned events
- View responses for assigned events

### 📋 DC (Data Collector)
- View all available events
- Fill forms (one submission per event)
- Cannot submit after deadline

---

## 🎨 Design System

The UI follows a **comic book / sequential art** theme:

- **Fonts**: [Bangers](https://fonts.google.com/specimen/Bangers) (headings) + [Comic Neue](https://fonts.google.com/specimen/Comic+Neue) (body)
- **Colors**: Pop-art palette — `#ff6b6b` red, `#ffe066` yellow, `#4ecdc4` teal, `#1a1a2e` dark
- **Panels**: Bold 4px black borders with offset drop shadows
- **Background**: Warm yellow with halftone dot pattern
- **Buttons**: Sharp-edged with shadow-lift hover effects
- **Badges**: Comic-style tags for roles, deadlines, and statuses

---

<div align="center">

**Built with 💥 by [Divyanssss](https://github.com/Divyanssss)**

</div>
