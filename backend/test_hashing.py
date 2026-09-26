#!/usr/bin/env python3
"""
Test script to verify the new SHA-256 + Bcrypt hashing logic works correctly.

Usage:
    cd backend
    python test_hashing.py
"""

import hashlib
from app.services.auth import hash_password, verify_password

def test_sha256_conversion():
    """Test that SHA-256 conversion works correctly"""
    print("🔍 Testing SHA-256 Pre-hashing...")
    
    test_password = "my_password[:72]"  # The problematic password
    
    # Manual SHA-256 conversion
    utf8_password = test_password.encode('utf-8')
    sha256_result = hashlib.sha256(utf8_password).hexdigest()
    
    print(f"Original password: '{test_password}' ({len(test_password)} chars, {len(utf8_password)} bytes)")
    print(f"SHA-256 result: '{sha256_result}' ({len(sha256_result)} chars)")
    print(f"SHA-256 bytes: {len(sha256_result.encode('utf-8'))} bytes")
    
    if len(sha256_result) == 64 and len(sha256_result.encode('utf-8')) < 72:
        print("✅ SHA-256 conversion successful - under 72 bytes")
        return True
    else:
        print("❌ SHA-256 conversion failed")
        return False

def test_hashing():
    """Test the double-hash strategy with various password lengths"""
    
    print("\n🔐 Testing SHA-256 + Bcrypt Hashing Strategy")
    print("=" * 50)
    
    # Test the specific problematic password first
    problematic_password = "my_password[:72]"
    
    print(f"Testing problematic password: '{problematic_password}'")
    print(f"Length: {len(problematic_password)} chars, {len(problematic_password.encode('utf-8'))} bytes")
    
    try:
        # Hash the password
        hashed = hash_password(problematic_password)
        print(f"✅ Hashing successful!")
        
        # Verify correct password
        if verify_password(problematic_password, hashed):
            print(f"✅ Verification successful!")
        else:
            print(f"❌ Verification failed!")
            return False
            
        # Verify wrong password fails
        if not verify_password(problematic_password + "wrong", hashed):
            print(f"✅ Wrong password correctly rejected")
        else:
            print(f"❌ Wrong password incorrectly accepted!")
            return False
            
    except Exception as e:
        print(f"❌ Error with problematic password: {e}")
        return False
    
    print("\n🎉 Problematic password test passed!")
    
    # Test other passwords
    other_passwords = [
        "short123",
        "this_is_a_very_long_password_that_exceeds_normal_limits_and_should_still_work_with_our_hashing_strategy",
    ]
    
    print(f"\nTesting {len(other_passwords)} additional passwords...")
    
    for password in other_passwords:
        print(f"\nTesting: {len(password)} chars")
        try:
            hashed = hash_password(password)
            if verify_password(password, hashed):
                print(f"✅ Success")
            else:
                print(f"❌ Verification failed")
                return False
        except Exception as e:
            print(f"❌ Error: {e}")
            return False
    
    print("\n🎉 All tests passed!")
    return True

if __name__ == "__main__":
    if test_sha256_conversion():
        test_hashing()
    else:
        print("❌ SHA-256 conversion test failed")