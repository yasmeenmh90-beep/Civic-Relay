import time
import jwt as pyjwt
import pytest

from app.auth import hash_password, verify_password, create_access_token, decode_access_token


def test_hash_password_is_not_plaintext():
    hashed = hash_password("my-secret-password")
    assert hashed != "my-secret-password"


def test_verify_password_correct():
    hashed = hash_password("my-secret-password")
    assert verify_password("my-secret-password", hashed) is True


def test_verify_password_incorrect():
    hashed = hash_password("my-secret-password")
    assert verify_password("wrong-password", hashed) is False


def test_two_hashes_of_same_password_differ():
    """bcrypt salts each hash - same password should never hash identically twice."""
    assert hash_password("same-password") != hash_password("same-password")


def test_create_and_decode_access_token_roundtrip():
    token = create_access_token(user_id="abc-123")
    user_id = decode_access_token(token)
    assert user_id == "abc-123"


def test_decode_garbage_token_raises():
    with pytest.raises(pyjwt.InvalidTokenError):
        decode_access_token("not-a-real-token")
