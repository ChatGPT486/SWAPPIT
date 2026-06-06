# Swappit Backend API

Django + PostgreSQL REST API for the Swappit swap marketplace.

---

## Stack
- Python 3.x · Django 6 · Django REST Framework
- PostgreSQL (via psycopg2)
- Simple JWT (access + refresh tokens with blacklisting)
- django-cors-headers · Pillow · python-decouple

---

## Project Structure

```
swappit_backend/
├── swappit_backend/     # Project config (settings, root URLs)
├── users/               # Custom User model, auth, profile
├── items/               # Item model, CRUD, smart suggestions
├── exchanges/           # Swap proposals, state machine, reviews, fairness
├── notifications/       # In-app notifications
├── media/               # Uploaded images (gitignored)
└── manage.py
```

---

## Setup

### 1. Create & activate virtual environment
```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
```

### 2. Install dependencies
```bash
pip install django djangorestframework djangorestframework-simplejwt \
            django-cors-headers psycopg2-binary Pillow python-decouple
```

### 3. Configure environment
Edit `.env` with your PostgreSQL credentials:
```
DB_NAME=swappit_db
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_HOST=localhost
DB_PORT=5432
```

### 4. Create the database
```sql
CREATE DATABASE swappit_db;
```

### 5. Run migrations
```bash
python manage.py makemigrations
python manage.py migrate
```

### 6. Seed demo data
```bash
python manage.py seed_data
```

### 7. Create superuser (for admin panel)
```bash
python manage.py createsuperuser
```

### 8. Run the server
```bash
python manage.py runserver
```

API available at: `http://localhost:8000/api/`
Admin panel at:   `http://localhost:8000/admin/`

---

## API Endpoints

### 🔐 Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register/` | ❌ | Register new user → returns tokens + profile |
| POST | `/api/auth/login/` | ❌ | Login → returns tokens + profile |
| POST | `/api/auth/logout/` | ✅ | Blacklist refresh token |
| POST | `/api/auth/token/refresh/` | ❌ | Refresh access token |

**Login request:**
```json
{ "email": "armel@example.com", "password": "pass123" }
```
**Login response:**
```json
{
  "access": "eyJ...",
  "refresh": "eyJ...",
  "user": { "id": 1, "full_name": "Armel Kamga", "email": "...", ... }
}
```

---

### 👤 Users

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/users/me/` | ✅ | Get own full profile |
| PATCH | `/api/users/me/` | ✅ | Update own profile |
| POST | `/api/users/me/change-password/` | ✅ | Change password |
| GET | `/api/users/<id>/` | ✅ | Get public profile of any user |

---

### 📦 Items

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/items/` | ✅ | Browse all available items |
| POST | `/api/items/` | ✅ | Post a new item |
| GET | `/api/items/<id>/` | ✅ | Item detail |
| PATCH | `/api/items/<id>/` | ✅ | Update own item |
| DELETE | `/api/items/<id>/` | ✅ | Delete own item |
| GET | `/api/items/mine/` | ✅ | My items (all, including unavailable) |
| GET | `/api/items/suggestions/` | ✅ | Smart swap suggestions |

**Query params for GET /api/items/:**
```
?category=Electronics
?min_value=10000&max_value=100000
?search=iphone
?exclude_own=true
?ordering=-value
```

---

### 🔁 Exchanges

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/exchanges/` | ✅ | My exchanges (sent + received) |
| POST | `/api/exchanges/` | ✅ | Propose a swap |
| GET | `/api/exchanges/<id>/` | ✅ | Exchange detail |
| POST | `/api/exchanges/<id>/respond/` | ✅ | Accept or reject |
| GET | `/api/exchanges/fairness/` | ✅ | Check fairness before proposing |

**Propose swap:**
```json
{ "offered_item_id": 1, "requested_item_id": 3 }
```

**Respond:**
```json
{ "action": "accept" }
{ "action": "reject" }
```

**Fairness check:**
```
GET /api/exchanges/fairness/?offered=1&requested=3
```
Response:
```json
{
  "offered_value": 85000.0,
  "requested_value": 95000.0,
  "fairness": { "label": "Balanced", "icon": "⚖️", "color": "#059669", "tier": "balanced" }
}
```

---

### ⭐ Reviews

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/reviews/` | ✅ | My received reviews |
| POST | `/api/reviews/` | ✅ | Leave a review (after accepted exchange) |
| GET | `/api/reviews/?user=<id>` | ✅ | Reviews for a specific user |

**Create review:**
```json
{ "exchange": 1, "recipient": 2, "stars": 5, "comment": "Great swap!" }
```

---

### 🔔 Notifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/notifications/` | ✅ | All my notifications |
| GET | `/api/notifications/?unread=true` | ✅ | Unread only |
| GET | `/api/notifications/unread-count/` | ✅ | Badge count for navbar |
| POST | `/api/notifications/<id>/read/` | ✅ | Mark one as read |
| POST | `/api/notifications/read-all/` | ✅ | Mark all as read |

---

## Authentication in Requests

All protected endpoints require the JWT access token in the header:
```
Authorization: Bearer <access_token>
```

---

## OOP Concepts Applied

| Concept | Where |
|---------|-------|
| **Inheritance** | `UserManager` extends `BaseUserManager`; all views extend DRF generics; `CustomTokenObtainPairSerializer` extends `TokenObtainPairSerializer` |
| **Encapsulation** | `FairnessService` encapsulates all fairness logic; `ItemQuerySet` encapsulates query strategies; `User.update_reputation()` encapsulates reputation logic |
| **Polymorphism** | `get_serializer_class()` returns different serializers depending on HTTP method in same view class |
| **Abstraction** | `BaseAuthView` abstracts shared auth logic; `IsOwnerOrReadOnly` abstracts permission logic |
| **State Machine** | `Exchange.accept()` / `Exchange.reject()` enforce valid state transitions |
| **Factory Pattern** | `UserManager.create_user()` / `create_superuser()` |
| **Strategy Pattern** | `ItemQuerySet` methods (`.available()`, `.similar_to()`, `.by_value_range()`) |
| **SRP** | Each serializer, view, and model has one clear job |
| **OCP** | New categories/conditions added without changing existing logic |

---

## Demo Credentials (after seed_data)

| User | Email | Password |
|------|-------|----------|
| Armel Kamga | armel@example.com | pass123 |
| Diane Mballa | diane@example.com | pass123 |
| Patrick Nguele | patrick@example.com | pass123 |
