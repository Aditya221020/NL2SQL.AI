import sqlite3, os
from passlib.context import CryptContext
import logging

logger = logging.getLogger(__name__)
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Password hashing
# Prefer bcrypt but fall back to sha256_crypt if bcrypt is not available or fails.
pwd_context = CryptContext(schemes=["bcrypt", "sha256_crypt"], deprecated="auto")

USER_DB = os.getenv("USER_DB", "backend/userdata.db")

def init():
    conn = sqlite3.connect(USER_DB)
    cur = conn.cursor()
    cur.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )
    """)
    conn.commit()
    conn.close()

def create_user(username, password):
    logger.debug(f"Creating user: {username}")
    conn = sqlite3.connect(USER_DB)
    cur = conn.cursor()
    try:
        try:
            hashed_password = pwd_context.hash(password)
        except Exception as e:
            logger.debug(f"primary hash failed: {e}, falling back to sha256_crypt")
            from passlib.hash import sha256_crypt
            hashed_password = sha256_crypt.hash(password)
        logger.debug(f"Hashed password: {hashed_password}")
        cur.execute("INSERT INTO users (username, password) VALUES (?, ?)", (username, hashed_password))
        conn.commit()
        logger.debug("User created successfully")
        return True
    except Exception as e:
        logger.debug(f"User creation failed: {e}")
        return False
    finally:
        conn.close()

def authenticate(username, password):
    logger.debug(f"Authenticating user: {username}")
    conn = sqlite3.connect(USER_DB)
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username=?", (username,))
    user = cur.fetchone()
    logger.debug(f"DB user row: {user}")
    conn.close()
    if user:
        try:
            verified = pwd_context.verify(password, user[2])
            logger.debug(f"Password verified: {verified}")
            if verified:
                return user
        except Exception as e:
            logger.debug(f"Password verification error: {e}")
    return None
