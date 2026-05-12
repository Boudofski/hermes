FROM python:3.11-slim

WORKDIR /app

# Install adapter dependencies
COPY hermes-adapter/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Install Hermes dependencies so AIAgent is importable
COPY pyproject.toml ./pyproject.toml
COPY . /hermes
RUN pip install --no-cache-dir -e "/hermes[all]" || \
    pip install --no-cache-dir -e "/hermes" && \
    echo "Installed hermes core (some extras may be missing)"

# Copy adapter source
COPY hermes-adapter/ ./

ENV PYTHONPATH=/hermes
ENV PORT=8001

EXPOSE 8001

CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT}"]
