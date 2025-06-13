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

### Dashboard Login

[![API docs](img/login.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Admin

[![API docs](img/dashboard.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Create User

[![API docs](img/dashboard-create.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Items

[![API docs](img/dashboard-items.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - User Settings

[![API docs](img/dashboard-user-settings.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Dashboard - Dark Mode

[![API docs](img/dashboard-dark.png)](https://github.com/fastapi/full-stack-fastapi-template)

### Interactive API Documentation

[![API docs](img/docs.png)](https://github.com/fastapi/full-stack-fastapi-template)

## How To Use It

You can **just fork or clone** this repository and use it as is.

✨ It just works. ✨

### How to Use a Private Repository

If you want to have a private repository, GitHub won't allow you to simply fork it as it doesn't allow changing the visibility of forks.

But you can do the following:

- Create a new GitHub repo, for example `my-full-stack`.
- Clone this repository manually, set the name with the name of the project you want to use, for example `my-full-stack`:

```bash
git clone git@github.com:fastapi/full-stack-fastapi-template.git my-full-stack
```

- Enter into the new directory:

```bash
cd my-full-stack
```

- Set the new origin to your new repository, copy it from the GitHub interface, for example:

```bash
git remote set-url origin git@github.com:octocat/my-full-stack.git
```

- Add this repo as another "remote" to allow you to get updates later:

```bash
git remote add upstream git@github.com:fastapi/full-stack-fastapi-template.git
```

- Push the code to your new repository:

```bash
git push -u origin master
```

### Update From the Original Template

After cloning the repository, and after doing changes, you might want to get the latest changes from this original template.

- Make sure you added the original repository as a remote, you can check it with:

```bash
git remote -v

origin    git@github.com:octocat/my-full-stack.git (fetch)
origin    git@github.com:octocat/my-full-stack.git (push)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (fetch)
upstream    git@github.com:fastapi/full-stack-fastapi-template.git (push)
```

- Pull the latest changes without merging:

```bash
git pull --no-commit upstream master
```

This will download the latest changes from this template without committing them, that way you can check everything is right before committing.

- If there are conflicts, solve them in your editor.

- Once you are done, commit the changes:

```bash
git merge --continue
```

### Configure

You can then update configs in the `.env` files to customize your configurations.

Before deploying it, make sure you change at least the values for:

- `SECRET_KEY`
- `FIRST_SUPERUSER_PASSWORD`
- `POSTGRES_PASSWORD`

You can (and should) pass these as environment variables from secrets.

Read the [deployment.md](./deployment.md) docs for more details.

### Generate Secret Keys

Some environment variables in the `.env` file have a default value of `changethis`.

You have to change them with a secret key, to generate secret keys you can run the following command:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

Copy the content and use that as password / secret key. And run that again to generate another secure key.

## How To Use It - Alternative With Copier

This repository also supports generating a new project using [Copier](https://copier.readthedocs.io).

It will copy all the files, ask you configuration questions, and update the `.env` files with your answers.

### Install Copier

You can install Copier with:

```bash
pip install copier
```

Or better, if you have [`pipx`](https://pipx.pypa.io/), you can run it with:

```bash
pipx install copier
```

**Note**: If you have `pipx`, installing copier is optional, you could run it directly.

### Generate a Project With Copier

Decide a name for your new project's directory, you will use it below. For example, `my-awesome-project`.

Go to the directory that will be the parent of your project, and run the command with your project's name:

```bash
copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

If you have `pipx` and you didn't install `copier`, you can run it directly:

```bash
pipx run copier copy https://github.com/fastapi/full-stack-fastapi-template my-awesome-project --trust
```

**Note** the `--trust` option is necessary to be able to execute a [post-creation script](https://github.com/fastapi/full-stack-fastapi-template/blob/master/.copier/update_dotenv.py) that updates your `.env` files.

### Input Variables

Copier will ask you for some data, you might want to have at hand before generating the project.

But don't worry, you can just update any of that in the `.env` files afterwards.

The input variables, with their default values (some auto generated) are:

- `project_name`: (default: `"FastAPI Project"`) The name of the project, shown to API users (in .env).
- `stack_name`: (default: `"fastapi-project"`) The name of the stack used for Docker Compose labels and project name (no spaces, no periods) (in .env).
- `secret_key`: (default: `"changethis"`) The secret key for the project, used for security, stored in .env, you can generate one with the method above.
- `first_superuser`: (default: `"admin@example.com"`) The email of the first superuser (in .env).
- `first_superuser_password`: (default: `"changethis"`) The password of the first superuser (in .env).
- `smtp_host`: (default: "") The SMTP server host to send emails, you can set it later in .env.
- `smtp_user`: (default: "") The SMTP server user to send emails, you can set it later in .env.
- `smtp_password`: (default: "") The SMTP server password to send emails, you can set it later in .env.
- `emails_from_email`: (default: `"info@example.com"`) The email account to send emails from, you can set it later in .env.
- `postgres_password`: (default: `"changethis"`) The password for the PostgreSQL database, stored in .env, you can generate one with the method above.
- `sentry_dsn`: (default: "") The DSN for Sentry, if you are using it, you can set it later in .env.

## Backend Development

Backend docs: [backend/README.md](./backend/README.md).

## Frontend Development

Frontend docs: [frontend/README.md](./frontend/README.md).

## Deployment

Deployment docs: [deployment.md](./deployment.md).

## Development

General development docs: [development.md](./development.md).

This includes using Docker Compose, custom local domains, `.env` configurations, etc.

## Release Notes

Check the file [release-notes.md](./release-notes.md).

## License

The Full Stack FastAPI Template is licensed under the terms of the MIT license.

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

### API Documentation

Once the server is running, you can access:
- Interactive API documentation (Swagger UI): `http://localhost:8000/api/v1/docs`
- Alternative API documentation (ReDoc): `http://localhost:8000/api/v1/redoc`
- Original API documentation: `http://0.0.0.0:8000/docs`

### Environment Variables

The backend requires certain environment variables to be set. Make sure you have a `.env` file in the root directory with the necessary configuration. Required variables include:

- `POSTGRES_SERVER`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `FIRST_SUPERUSER`
- `FIRST_SUPERUSER_PASSWORD`
- `PROJECT_NAME`

### Database

The application uses PostgreSQL as its database. Make sure you have PostgreSQL installed and running before starting the application.

### PostgreSQL Setup

1. Install PostgreSQL:
   - On macOS (using Homebrew):
   ```bash
   brew install postgresql@14
   brew services start postgresql@14
   ```
   - On Ubuntu/Debian:
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```
   - On Windows:
   Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

2. Create a new database and user:
   ```bash
   # Connect to PostgreSQL
   psql postgres

   # Create a new database
   CREATE DATABASE fastapi_db;

   # Create a new user with password
   CREATE USER fastapi_user WITH PASSWORD 'your_password';

   # Grant privileges to the user
   GRANT ALL PRIVILEGES ON DATABASE fastapi_db TO fastapi_user;
   ```

3. Update your `.env` file with the database credentials:
   ```
   POSTGRES_SERVER=localhost
   POSTGRES_USER=fastapi_user
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=fastapi_db
   ```
4. Run DB
   ```
   # Mac
   # Create DB
   psql postgres -c "CREATE DATABASE app;" -c "CREATE USER postgresfastapi WITH PASSWORD 'changethis';" -c "GRANT ALL PRIVILEGES ON DATABASE app TO postgres;"
   # Launch DB
   brew services start postgresql@14
   # DB migration
   psql -U postgres -d your_database
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   export PYTHONPATH=$PYTHONPATH:$(pwd) && alembic upgrade head
   # Create admin user with .env
   PYTHONPATH=$PYTHONPATH:$(pwd) python -m app.initial_data
   ```

5. Run database migrations:
   ```bash
   cd backend
   alembic upgrade head
   ```

### Development

For development purposes, the `--reload` flag is included in the run command, which enables auto-reload when code changes are detected.

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
