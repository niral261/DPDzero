# ---- Builder Stage ----
FROM python:3.10-alpine AS builder

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN apk add --no-cache build-base
WORKDIR /app

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install --user -r requirements.txt

# ---- Final Stage ----
FROM python:3.10-alpine AS final

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

RUN adduser -D niral
WORKDIR /app

COPY --from=builder /root/.local /home/niral/.local
ENV PATH="/home/niral/.local/bin:$PATH"

COPY . .
USER niral

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"] 