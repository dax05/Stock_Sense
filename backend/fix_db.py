from app.database import engine
from sqlalchemy import text

# Check current columns
with engine.connect() as conn:
    result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'users' ORDER BY ordinal_position"))
    columns = [r[0] for r in result]
    print("Current columns in users table:")
    for col in columns:
        print(f"  - {col}")
    
    # Check if OTP columns exist
    if 'otp_code' not in columns:
        print("\n⚠️ otp_code column is missing. Adding it now...")
        conn.execute(text("ALTER TABLE users ADD COLUMN otp_code VARCHAR(6)"))
        conn.commit()
        print("✅ Added otp_code column")
    else:
        print("\n✅ otp_code column already exists")
    
    if 'otp_expires_at' not in columns:
        print("⚠️ otp_expires_at column is missing. Adding it now...")
        conn.execute(text("ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP WITH TIME ZONE"))
        conn.commit()
        print("✅ Added otp_expires_at column")
    else:
        print("✅ otp_expires_at column already exists")

print("\n✅ Database schema is now up to date!")
