import os
import tempfile
from pathlib import Path


def get_writable_temp_path(env_key: str, default_name: str) -> Path:
    """Resolve a writable path from env or the OS temp directory."""
    default_path = Path(tempfile.gettempdir()) / default_name
    return Path(os.getenv(env_key, str(default_path)))
