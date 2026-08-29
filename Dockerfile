# IMMUNE Lattice Space — stdlib Python hologram. No npm. No Vite.
# GCR pin: HF builders fail public.ecr.aws with exit 128.
# Hub flatten: immune mirror copies space/server.py + space/index.html to /
# and writes COPY server.py (khipu-lab class). Nested COPY space/ is GH-root only.
FROM mirror.gcr.io/library/python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=7860
COPY space/server.py ./server.py
COPY space/index.html ./index.html
EXPOSE 7860
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=5 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:7860/healthz', timeout=4)"
CMD ["python", "-u", "server.py"]
