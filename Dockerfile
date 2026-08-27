FROM python:3.12-slim

WORKDIR /app

# System deps needed to build psycopg2 and bcrypt/cryptography wheels on slim images
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# /app is root-owned after COPY - appuser needs write access to create the
# uploads/ folder at runtime (app/main.py does Path("uploads").mkdir(...)).
# Create it now and hand ownership of the whole app dir to appuser before
# switching to it, or every non-root run fails with PermissionError.
RUN mkdir -p /app/uploads && useradd --create-home appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

# Migrations run first, then the server starts - this is what a real deploy
# (not local `alembic upgrade head` by hand) needs to do on every boot.
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
