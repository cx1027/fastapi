# Full Stack FastAPI Template

<a href="https://github.com/fastapi/full-stack-fastapi-template/actions?query=workflow%3ATest" target="_blank"><img src="https://github.com/fastapi/full-stack-fastapi-template/workflows/Test/badge.svg" alt="Test"></a>
<a href="https://coverage-badge.samuelcolvin.workers.dev/redirect/fastapi/full-stack-fastapi-template" target="_blank"><img src="https://coverage-badge.samuelcolvin.workers.dev/fastapi/full-stack-fastapi-template.svg" alt="Coverage"></a>

## Technology Stack and Features

- ⚡ [**FastAPI**](https://fastapi.tiangolo.com) for the Python backend API.
    - 🧰 [SQLModel](https://sqlmodel.tiangolo.com) for the Python SQL database interactions (ORM).
    - 🔍 [Pydantic](https://docs.pydantic.dev), used by FastAPI, for the data validation and settings management.
    - 💾 [PostgreSQL](https://www.postgresql.org) as the SQL database.
- 🚀 [React](https://react.dev) for the frontend.
    - 💃 Using TypeScript, hooks, Vite, and other parts of a modern frontend stack.
    - 🎨 [Chakra UI](https://chakra-ui.com) for the frontend components.
    - 🤖 An automatically generated frontend client.
    - 🧪 [Playwright](https://playwright.dev) for End-to-End testing.
    - 🦇 Dark mode support.
- 🐋 [Docker Compose](https://www.docker.com) for development and production.
- 🔒 Secure password hashing by default.
- 🔑 JWT (JSON Web Token) authentication.
- 📫 Email based password recovery.
- ✅ Tests with [Pytest](https://pytest.org).
- 📞 [Traefik](https://traefik.io) as a reverse proxy / load balancer.
- 🚢 Deployment instructions using Docker Compose, including how to set up a frontend Traefik proxy to handle automatic HTTPS certificates.
- 🏭 CI (continuous integration) and CD (continuous deployment) based on GitHub Actions.

## Xiu

## Add Jobs in side-bar
```
1.frontend
2.backend
3.db
4.create table in db
5.restart frontend
6.run db migration
alembic upgrade head
alembic revision --autogenerate -m "add jobs table"
```

## Backend Setup and Launch

### Prerequisites
- Python 3.10 or higher
- pip (Python package installer)

### Setup Steps

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv .venv
```

3. Activate the virtual environment:
- On macOS/Linux:
```bash
source .venv/bin/activate
```
- On Windows:
```bash
.venv\Scripts\activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Backend

To start the backend server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server will start at `http://localhost:8000`

## Run DB
   ```
   # Mac
   # Create DB
   psql postgres -c "CREATE DATABASE app;" -c "CREATE USER postgres WITH PASSWORD 'changethis';" -c "GRANT ALL PRIVILEGES ON DATABASE app TO postgres;"
   # Launch DB
   brew services start postgresql@14
   # DB migration
   psql -U postgres -d your_database
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   export PYTHONPATH=$PYTHONPATH:$(pwd) && alembic upgrade head
   # Create admin user with .env
   PYTHONPATH=$PYTHONPATH:$(pwd) python -m app.initial_data
   # create .env file, and locate the .env file in the correct place
   ```

## Frontend Setup and Launch

### Prerequisites
- Node.js (version specified in `.nvmrc`)
- npm (comes with Node.js)

### Setup Steps

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

### Running the Frontend

To start the frontend development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`












### Frontend Features
- Built with React, TypeScript, and Vite
- Uses Chakra UI for components
- Includes dark mode support
- Automatic API client generation
- End-to-end testing with Playwright

### API Client Generation

If you make changes to the backend API, you'll need to regenerate the frontend client:

1. Make sure the backend is running
2. Run the client generation script:
```bash
npm run generate-client
```

### Environment Variables

The frontend can be configured using environment variables in `frontend/.env`:
- `VITE_API_URL`: Set this to your backend API URL (defaults to `http://localhost:8000`)
