FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY gcp_clients.py loaders.py models.py train.py ./

ENTRYPOINT ["python", "train.py"]
