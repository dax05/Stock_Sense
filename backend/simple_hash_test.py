#!/usr/bin/env python3
"""
Simple test to isolate the bcrypt issue
"""

import hashlib
import bcrypt

def test_simple_bcrypt():
    """Test bcrypt directly with SHA-256 pre-hashing"""
    
    print("🔍 Testing Simple Bcrypt with SHA-256 Pre-hash")
    print("=" * 50)
    
    # Test the problematic password
    original_password = "my_password[:72]"
    print(f"Original password: '{original_password}' ({len(original_password)} chars)")
    
    # Step 1: SHA-256 pre-hash
    utf8_password = original_password.encode('utf-8')
    sha256_hash = hashlib.sha256(utf8_password).hexdigest()
    print(f"SHA-256 hash: '{sha256_hash}' ({len(sha256_hash)} chars)")
    
    # Step 2: Bcrypt the SHA-256 hash
    try:
        salt = bcrypt.gensalt()
        bcrypt_hash = bcrypt.hashpw(sha256_hash.encode('utf-8'), salt)
        print(f"✅ Bcrypt hashing successful!")
        
        # Test verification
        if bcrypt.checkpw(sha256_hash.encode('utf-8'), bcrypt_hash):
            print(f"✅ Bcrypt verification successful!")
            return True
        else:
            print(f"❌ Bcrypt verification failed!")
            return False
            
    except Exception as e:
        print(f"❌ Bcrypt error: {e}")
        return False

if __name__ == "__main__":
    test_simple_bcrypt()