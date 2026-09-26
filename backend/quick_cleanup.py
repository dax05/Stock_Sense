from sqlalchemy import text
from app.database import SessionLocal

print("🧹 Cleaning users table...")
db = SessionLocal()
try:
    db.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))
    db.commit()
    print("✅ Users table cleaned successfully!")
except Exception as e:
    print(f"❌ Error: {e}")
    db.rollback()
finally:
    db.close()