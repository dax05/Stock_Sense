#!/usr/bin/env python3
"""
Database cleanup script to truncate users table and start fresh
with the new SHA-256 + Bcrypt hashing strategy.

Usage:
    cd backend
    python cleanup_users.py
"""

import sys
from sqlalchemy import text
from app.database import SessionLocal, engine
from app.config import settings

def cleanup_users_table():
    """Truncate the users table to remove any corrupted password hashes"""
    
    print("🧹 CoreInventory Database Cleanup")
    print("=" * 50)
    print(f"Database: {settings.DATABASE_URL.split('@')[-1]}")  # Hide credentials
    print()
    
    # Confirm with user
    confirm = input("⚠️  This will DELETE ALL USERS from the database. Continue? (yes/no): ")
    if confirm.lower() not in ['yes', 'y']:
        print("❌ Cleanup cancelled.")
        return
    
    try:
        # Create database session
        db = SessionLocal()
        
        # Truncate users table (removes all rows and resets auto-increment)
        print("🗑️  Truncating users table...")
        db.execute(text("TRUNCATE TABLE users RESTART IDENTITY CASCADE;"))
        db.commit()
        
        print("✅ Users table cleaned successfully!")
        print()
        print("📝 Next steps:")
        print("1. Restart your backend server")
        print("2. Try signing up with a new account")
        print("3. The new SHA-256 + Bcrypt hashing will prevent the 72-byte error")
        
    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
        sys.exit(1)
        
    finally:
        db.close()

def verify_connection():
    """Test database connection before cleanup"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Make sure PostgreSQL is running and credentials are correct")
        return False

if __name__ == "__main__":
    print("🔍 Testing database connection...")
    
    if not verify_connection():
        sys.exit(1)
        
    print("✅ Database connection successful!")
    print()
    
    cleanup_users_table()