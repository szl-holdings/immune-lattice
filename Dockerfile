# IMMUNE Lattice COP — Hugging Face Space.
# Factory class: npm ci / vite-dev BUILD_ERRORs on HF (Playwright, ECR, missing .grok).
# Anatomy / khipu-lab already run this GCR Python pin. Channel B is stdlib HTTP.
FROM mirror.gcr.io/library/python:3.12-slim

WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=7860
COPY space/server.py ./server.py
COPY space/index.html ./index.html
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:7860/healthz', timeout=4)"
CMD ["python", "-u", "server.py"]
