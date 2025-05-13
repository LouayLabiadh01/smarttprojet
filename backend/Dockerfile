FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app/staticfiles
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . .

ENV PATH="/usr/local/bin:${PATH}"

CMD ["gunicorn", "core.wsgi:application", "--bind", "0.0.0.0:8000"]
