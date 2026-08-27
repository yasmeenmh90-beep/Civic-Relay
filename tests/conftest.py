import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db import Base, get_db
from app.main import app
from app.rate_limit import limiter

# In-memory SQLite shared across connections in the same test process -
# fast, fully isolated from any real civicrelay.db on disk, and doesn't
# require Postgres or any external service to run the test suite.
TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _override_get_db():
    db = TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(scope="function", autouse=True)
def fresh_database():
    """Recreates all tables before every test function, so tests never see
    another test's data - each test starts from a genuinely empty database."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function", autouse=True)
def reset_rate_limits():
    """Clears rate-limit counters between tests so one test's requests don't
    trip the limit for the next test (they'd otherwise share IP/user keys)."""
    limiter.reset()
    yield


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def auth_headers(client):
    """Signs up and logs in a fresh user, returns headers ready to use."""
    client.post("/users", json={"name": "Test User", "email": "test@civicrelay.io", "password": "testpass123"})
    resp = client.post("/users/login", json={"email": "test@civicrelay.io", "password": "testpass123"})
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
