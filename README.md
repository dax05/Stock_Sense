# 📦 CoreInventory - Advanced Inventory Management System

A full-stack inventory management system built with **FastAPI** (Python) backend and **React** (Vite) frontend. CoreInventory provides comprehensive tools for managing products, warehouses, stock movements, and operations with real-time tracking and reporting capabilities.

![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?logo=fastapi)
![React](https://img.shields.io/badge/React-19.2.4-61DAFB?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)

## ✨ Features

### 📊 Inventory Management
- **Product Catalog**: Create and manage products with SKU, cost, UOM, and categorization
- **Category Management**: Organize products into hierarchical categories
- **Stock Levels**: Real-time tracking of on-hand and free-to-use inventory
- **Low Stock Alerts**: Automatic alerts for products below minimum stock levels
- **Reorder Management**: Configure minimum stock levels and reorder quantities

### 🏢 Multi-Warehouse Support
- **Warehouse Management**: Create and manage multiple warehouse locations
- **Location Types**: Support for Internal, Customer, Vendor, View, and Adjustment locations
- **Inter-warehouse Transfers**: Move inventory between warehouses seamlessly
- **Location Hierarchy**: Organize locations within warehouses with short codes

### 🔄 Operations Management
- **Receipts (IN)**: Record incoming inventory from vendors
- **Deliveries (OUT)**: Track outgoing inventory to customers
- **Transfers (INT)**: Move inventory between internal locations
- **Adjustments (ADJ)**: Make inventory corrections and adjustments
- **Operation Status**: Track operations through Draft → Waiting → Ready → Done workflow
- **Stock Move Tracking**: Detailed tracking of every stock movement

### 📈 Reporting & Analytics
- **Dashboard**: Real-time overview of inventory status and recent activities
- **Move History**: Complete audit trail of all stock movements
- **Inventory Reports**: Generate detailed reports on stock levels and movements
- **Statistics**: Key metrics and performance indicators

### 🔐 Authentication & Security
- **User Authentication**: JWT-based secure authentication system
- **User Registration**: New user signup with password hashing (bcrypt)
- **Protected Routes**: Role-based access control
- **Session Management**: Secure token-based sessions

## 🛠️ Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy 2.0**: Modern ORM with async support
- **Alembic**: Database migrations
- **PostgreSQL**: Robust relational database
- **Pydantic**: Data validation and serialization
- **JWT**: Token-based authentication
- **Uvicorn**: Lightning-fast ASGI server

### Frontend
- **React 19**: Latest React with modern hooks
- **Vite 8**: Ultra-fast build tool and dev server
- **React Router 7**: Client-side routing
- **Axios**: HTTP client for API calls
- **Tailwind CSS**: Utility-first styling
- **Lucide React**: Beautiful icon library
- **Recharts**: Powerful charting library

## 📁 Project Structure

```
Inventory-System-main/
├── backend/
│   ├── alembic/                 # Database migrations
│   ├── app/
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── product.py
│   │   │   ├── category.py
│   │   │   ├── warehouse.py
│   │   │   └── operation.py
│   │   ├── routes/              # API endpoints
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── operations.py
│   │   │   ├── warehouses.py
│   │   │   ├── categories.py
│   │   │   ├── stock_moves.py
│   │   │   ├── stats.py
│   │   │   └── reports.py
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic
│   │   │   ├── auth.py
│   │   │   ├── inventory.py
│   │   │   ├── reference.py
│   │   │   ├── reports.py
│   │   │   └── seeder.py
│   │   ├── config.py            # Configuration
│   │   ├── database.py          # Database setup
│   │   └── main.py              # FastAPI app
│   ├── requirements.txt
│   └── alembic.ini
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── dashboard/       # Dashboard widgets
    │   │   ├── layout/          # Layout components
    │   │   ├── operations/      # Operation forms
    │   │   └── ui/              # Reusable UI components
    │   ├── context/             # React context providers
    │   ├── hooks/               # Custom React hooks
    │   ├── lib/                 # Utilities and API client
    │   ├── pages/               # Page components
    │   │   ├── auth/            # Login & Signup
    │   │   ├── catalog/         # Products & Categories
    │   │   ├── dashboard/       # Dashboard
    │   │   ├── history/         # Move History
    │   │   ├── operations/      # Receipts, Deliveries, etc.
    │   │   ├── reports/         # Reports
    │   │   └── settings/        # Warehouses & Locations
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

## 🚀 Quick Start

### Prerequisites
- **Python 3.10+**
- **Node.js 18+**
- **PostgreSQL 13+**
- **npm or yarn**

### Database Setup

1. **Install PostgreSQL** if not already installed

2. **Create the database**:
```sql
CREATE DATABASE coreinventory;
```

3. **Create a PostgreSQL user** (if needed):
```sql
CREATE USER postgres WITH PASSWORD 'Hack123';
GRANT ALL PRIVILEGES ON DATABASE coreinventory TO postgres;
```

### Backend Setup

1. **Navigate to backend directory**:
```bash
cd backend
```

2. **Create and configure `.env` file**:
```env
DATABASE_URL=postgresql://postgres:Hack123@localhost:5432/coreinventory
SECRET_KEY=MjpXUlshGQk3VtBIn_eYbaEbbQ-dX6KoslRmp9y7Qpg
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Run database migrations** (optional, tables auto-create on startup):
```bash
alembic upgrade head
```

5. **Start the backend server**:
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: **http://localhost:8000**

API Documentation: **http://localhost:8000/docs**

### Frontend Setup

1. **Navigate to frontend directory**:
```bash
cd frontend
```

2. **Create and configure `.env` file**:
```env
VITE_API_URL=http://localhost:8000
```

3. **Install dependencies**:
```bash
npm install
```

4. **Start the development server**:
```bash
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## 📚 API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

#### Authentication
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login and get JWT token
- `GET /auth/me` - Get current user info

#### Products
- `GET /products` - List all products
- `POST /products` - Create new product
- `PUT /products/{id}` - Update product
- `DELETE /products/{id}` - Delete product
- `GET /products/low-stock` - Get low stock alerts

#### Operations
- `GET /operations` - List all operations
- `POST /operations` - Create new operation
- `POST /operations/{id}/validate` - Validate and execute operation
- `DELETE /operations/{id}` - Cancel operation

#### Warehouses & Locations
- `GET /warehouses` - List all warehouses
- `POST /warehouses` - Create new warehouse
- `GET /warehouses/{id}/locations` - Get warehouse locations
- `POST /locations` - Create new location

#### Statistics & Reports
- `GET /stats/dashboard` - Dashboard statistics
- `GET /reports/inventory` - Inventory report
- `GET /stock-moves` - Stock movement history

## 🎯 Usage Guide

### 1. Initial Setup
1. **Sign up** for a new account at `/signup`
2. **Login** with your credentials
3. System automatically creates virtual locations (Vendors, Customers, Inventory Adjustments)

### 2. Configure Warehouses
1. Navigate to **Settings → Warehouses**
2. Create your physical warehouses with short codes (e.g., WH01, WH02)
3. Add locations within each warehouse (e.g., SHELF-A, ZONE-B)

### 3. Set Up Products
1. Go to **Catalog → Categories** and create product categories
2. Navigate to **Catalog → Products**
3. Add products with SKU, cost, UOM, min stock levels, and reorder quantities

### 4. Perform Operations

**Receipt (IN)** - Receiving inventory:
- Type: IN
- Source: Vendors location
- Destination: Your warehouse location
- Add products and quantities

**Delivery (OUT)** - Shipping to customers:
- Type: OUT
- Source: Your warehouse location
- Destination: Customers location
- Add products and quantities

**Transfer (INT)** - Moving between warehouses:
- Type: INT
- Source: Warehouse A
- Destination: Warehouse B
- Add products and quantities

**Adjustment (ADJ)** - Inventory corrections:
- Type: ADJ
- Source/Destination: Inventory Adjustments location
- Add products with positive (add) or negative (remove) quantities

### 5. Monitor and Report
- View **Dashboard** for real-time inventory overview
- Check **Low Stock Alerts** for reorder notifications
- Review **Move History** for complete audit trail
- Generate **Reports** for analysis

## 🔒 Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **CORS Protection**: Configurable CORS middleware
- **SQL Injection Prevention**: SQLAlchemy ORM parameterized queries
- **Input Validation**: Pydantic schema validation
- **Environment Variables**: Sensitive data in .env files

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 🛠️ Development

### Backend Hot Reload
The backend runs with `--reload` flag for automatic restart on code changes.

### Frontend Hot Reload
Vite provides instant HMR (Hot Module Replacement) for React components.

### Database Migrations
Create new migration:
```bash
alembic revision --autogenerate -m "description"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

## 📦 Building for Production

### Backend
```bash
cd backend
pip install -r requirements.txt
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm run build


### Environment Variables

**Backend**:
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT secret key
- `ALGORITHM`: JWT algorithm (default: HS256)
- `ACCESS_TOKEN_EXPIRE_MINUTES`: Token expiration time

**Frontend**:
- `VITE_API_URL`: Backend API URL

**⭐ Star this repository if you find it helpful!**
