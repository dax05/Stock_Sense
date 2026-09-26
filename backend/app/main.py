from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base, SessionLocal
from app.services.seeder import seed_virtual_locations

# ── Import ALL models so SQLAlchemy knows about them before create_all ──
import app.models  # noqa: F401

# ── Create tables if they don't exist ──────────────────────────────────
Base.metadata.create_all(bind=engine)

# ── Import routers AFTER models are registered ─────────────────────────
from app.routes import auth, operations, products, stats, warehouses, stock_moves, categories, reports  # noqa: E402

app = FastAPI(title="CoreInventory API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(operations.router)
app.include_router(products.router)
app.include_router(stats.router)
app.include_router(warehouses.router)
app.include_router(stock_moves.router)
app.include_router(categories.router)
app.include_router(reports.router)


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_virtual_locations(db)
    finally:
        db.close()


@app.get("/ping")
def ping():
    return {"status": "online", "message": "Backend is reachable"}


@app.get("/health")
def health():
    return {"status": "ok", "service": "CoreInventory API"}
