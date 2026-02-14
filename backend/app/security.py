import bcrypt
from datetime import datetime, timedelta, timezone

from cryptography.fernet import Fernet
from jose import JWTError, jwt

from app.config import settings

_fernet_instance: Fernet | None = None


def _get_fernet() -> Fernet:
    global _fernet_instance
    if _fernet_instance is None:
        key = settings.ENCRYPTION_KEY
        if not key:
            # Generate a new valid Fernet key
            key = Fernet.generate_key()
        elif isinstance(key, str):
            key = key.encode('utf-8')

        # Ensure the key is properly formatted (32 bytes, base64-encoded)
        if isinstance(key, bytes) and len(key) != 44:
            # Key is not in correct Fernet format, generate new one
            key = Fernet.generate_key()
        elif isinstance(key, bytes):
            # Ensure it's valid base64
            import base64
            try:
                # Decode and re-encode to validate
                decoded = base64.urlsafe_b64decode(key)
                if len(decoded) != 32:
                    key = Fernet.generate_key()
            except Exception:
                key = Fernet.generate_key()

        _fernet_instance = Fernet(key)
    return _fernet_instance


def hash_password(password: str) -> str:
    # bcrypt requires bytes and has a 72 byte limit
    if isinstance(password, str):
        password = password.encode('utf-8')
    # Truncate if too long (bcrypt limitation)
    if len(password) > 72:
        password = password[:72]
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password, salt).decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if isinstance(plain_password, str):
        plain_password = plain_password.encode('utf-8')
    if isinstance(hashed_password, str):
        hashed_password = hashed_password.encode('utf-8')
    # Truncate if too long (bcrypt limitation)
    if len(plain_password) > 72:
        plain_password = plain_password[:72]
    return bcrypt.checkpw(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None


def encrypt_api_key(api_key: str) -> str:
    fernet = _get_fernet()
    return fernet.encrypt(api_key.encode()).decode()


def decrypt_api_key(encrypted_key: str) -> str:
    fernet = _get_fernet()
    return fernet.decrypt(encrypted_key.encode()).decode()
