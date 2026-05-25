# SWAPPIT — Django REST API

Backend API for the SWAPPIT item-swap platform.  
Connects the React/Vite frontend to a real database.

---

## Architecture

```
Frontend (React/Vite)          Backend (Django REST)
──────────────────────         ──────────────────────────────
src/services/api.js     ←───→  /api/v1/auth/        (JWT auth)
src/context/AppContext  ←───→  /api/v1/items/       (items CRUD)
                        ←───→  /api/v1/exchanges/   (swap proposals)
                        ←───→  /api/v1/reviews/     (ratings)
                        ←───→  /api/v1/notifications/
```

---

## Quick Start

### 1. Install dependencies
```bash
cd swappit_api
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — set DJANGO_SECRET_KEY at minimum
```

### 3. Run migrations
```bash
python manage.py migrate
python manage.py createsuperuser   # optional: for /admin/
```

### 4. Start the server
```bash
python manage.py runserver
# API available at http://localhost:8000/api/v1/
```

### 5. Connect the frontend
```
# In your React project, copy:
#   frontend_service/api.js       → src/services/api.js
#   frontend_service/AppContext.jsx → src/context/AppContext.jsx

# Add to your .env:
VITE_API_URL=http://localhost:8000/api/v1
```

---

## API Reference

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/signup/` | Create account | ❌ |
| POST | `/auth/signin/` | Login → JWT tokens | ❌ |
| POST | `/auth/signout/` | Blacklist refresh token | ✅ |
| GET | `/auth/me/` | Get own profile | ✅ |
| PATCH | `/auth/me/` | Update profile + photo | ✅ |
| POST | `/auth/token/refresh/` | Refresh access token | ❌ |
| GET | `/auth/users/<id>/` | Public user profile | ✅ |

**Signup body:**
```json
{
  "firstName": "Armel",
  "lastName": "Kamga",
  "email": "armel@example.com",
  "password": "pass123",
  "contact": "+237 6 71 23 45 67",
  "bio": "Gadget collector"
}
```
**Response:**
```json
{
  "ok": true,
  "tokens": { "access": "...", "refresh": "..." },
  "user": { "id": 1, "firstName": "Armel", ... }
}
```

---

### Items
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/items/` | All available items (search/filter/sort) |
| POST | `/items/` | Create item (multipart for image) |
| GET | `/items/<id>/` | Item detail |
| DELETE | `/items/<id>/` | Delete own item |
| GET | `/items/mine/` | My items |
| GET | `/items/suggestions/` | Smart swap suggestions |

**Query params for GET /items/:**
- `?search=iphone` — text search
- `?category=Electronics` — filter by category
- `?sort=recent|value_asc|value_desc`

**Create item body:**
```json
{
  "name": "iPhone 13 Pro",
  "category": "Electronics",
  "description": "Excellent condition...",
  "condition": "Excellent",
  "value": 180000,
  "emoji": "📱"
}
```

---

### Exchanges
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/exchanges/` | My exchanges (as proposer or owner) |
| POST | `/exchanges/` | Propose a swap |
| POST | `/exchanges/<id>/respond/` | Accept or reject |

**Propose body:**
```json
{ "offeredItemId": 1, "requestedItemId": 5 }
```
**Respond body:**
```json
{ "accepted": true }
```

---

### Reviews
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reviews/?userId=<id>` | Reviews for a user |
| POST | `/reviews/` | Submit a review |

**Review body:**
```json
{
  "targetUserId": 2,
  "exchangeId": 10,
  "stars": 5,
  "comment": "Smooth exchange!"
}
```

---

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/` | My notifications + unreadCount |
| POST | `/notifications/<id>/read/` | Mark one as read |
| POST | `/notifications/read-all/` | Mark all as read |

---

## Fairness Calculation

The API mirrors the AppContext fairness logic exactly:

| Ratio | Label | Meaning |
|-------|-------|---------|
| 0.92 – 1.08 | **Balanced** | Nearly equal value |
| 0.72 – 1.39 | **Acceptable** | Slight imbalance |
| Outside | **Unfair** | Large value gap |

---

## Project Structure

```
swappit_api/
├── manage.py
├── requirements.txt
├── .env.example
├── swappit_api/
│   ├── settings.py       ← JWT, CORS, DRF config
│   └── urls.py           ← Root URL routing
└── apps/
    ├── users/            ← Custom User model + JWT auth
    ├── items/            ← Item CRUD + suggestions
    ├── exchanges/        ← Swap proposal flow
    ├── reviews/          ← Star ratings + avg recalc
    └── notifications/    ← In-app notification system

frontend_service/
    ├── api.js            ← Copy to src/services/api.js
    └── AppContext.jsx    ← Copy to src/context/AppContext.jsx
```
