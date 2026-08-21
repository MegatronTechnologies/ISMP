import os
from pathlib import Path


EDGE_ROOT = Path(__file__).resolve().parent
os.chdir(EDGE_ROOT)

import uvicorn

from app.config import settings


if __name__ == "__main__":
    uvicorn.run("app.main:app", host=settings.host, port=settings.port, reload=False)
