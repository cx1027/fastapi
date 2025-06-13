import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Set up environment variables
os.environ["PYTHONPATH"] = str(backend_dir)

# Now we can import our models and config
from app.core.config import settings  # noqa
from app.models import User, Item, Job  # noqa

# Run the migration
if __name__ == "__main__":
    os.system("PYTHONPATH=$PYTHONPATH alembic revision --autogenerate -m 'add jobs table'") 