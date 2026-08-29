# IMMUNE Lattice Space — stdlib Python hologram. No npm. No Vite.
# GCR pin: HF builders fail public.ecr.aws with exit 128.
FROM mirror.gcr.io/library/python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=7860
COPY space/server.py ./server.py
COPY space/index.html ./index.html
EXPOSE 7860
CMD ["python", "-u", "server.py"]
