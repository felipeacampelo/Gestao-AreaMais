FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_NO_CACHE_DIR=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN python -m ensurepip --upgrade && \
    python -m pip install --upgrade pip && \
    python -m pip install -r requirements.txt

# Copy project
COPY . .

# Collect static files
RUN mkdir -p staticfiles
RUN python manage.py collectstatic --noinput

# Run the application
CMD ["gunicorn", "config.wsgi", "--bind", "0.0.0.0:$PORT"]
