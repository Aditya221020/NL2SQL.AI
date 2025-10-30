# NL2SQL.AI# NL2SQL.AI 🚀



A small FastAPI + static frontend project that demonstrates a natural-language-to-SQL workflow with a Gemini integration.A powerful web application that converts natural language queries into SQL and executes them on your databases using Google's Gemini AI models.



## What this repository contains## Features ✨

- `backend/` — FastAPI app and server code (auth, models, Gemini client integration).

- `frontend/` — Static UI (HTML, CSS, JS).- **Natural Language to SQL**: Convert plain English questions into SQL queries

- `start.py` — convenience script to check environment and run the app locally.- **User Authentication**: Secure JWT-based authentication system

- **Database Management**: Upload or create SQLite databases

## Quick start (local)- **Query Execution**: Execute generated SQL queries safely

1. Create and activate a Python virtual environment:- **Modern UI**: Clean, responsive web interface

- **Multi-user Support**: Each user has their own database workspace

```powershell

python -m venv .venv## Quick Start 🏃‍♂️

.\.venv\Scripts\Activate.ps1

```### Prerequisites



2. Install dependencies (the backend requirements are in `backend/requirements.txt`):

### Setup

```powershell

pip install -r backend/requirements.txt1. **Clone and navigate to the project**:

```   ```bash

   cd NL2SQL.AI

3. Set required environment variables (do NOT commit `.env` to git):   ```



- `GEMINI_API_KEY` — your Gemini / Google generative AI API key2. **Install dependencies**:

- `SECRET_KEY` — secret key for JWT signing   ```bash

- `ACCESS_TOKEN_EXPIRE_MINUTES` — optional (defaults may be set in code)   pip install -r backend/requirements.txt

   ```

You can place them in a local `.env` (for local dev only) or set them in your shell. Example (`.env` not committed):

3. **Configure environment**:

GEMINI_API_KEY="your_key_here"   ```bash

SECRET_KEY="a_secret_value"   cp backend/env.example backend/.env

   ```

4. Run the app:   

   Edit `backend/env.example` and add your Gemini API key:

```powershell   ```

python start.py   GEMINI_API_KEY=your_actual_gemini_api_key_here

# or   ```

uvicorn backend.main:app --host 0.0.0.0 --port 8000   

```   Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)



The frontend is served from `/` and API endpoints are under `/api` (see `backend/main.py` for details).4. **Start the application**:

   ```bash

## Deploying   python start.py

- Render: you can add a `render.yaml` or create a Render web service and set the build command to `pip install -r backend/requirements.txt` and the start command to `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`.   ```

- Note: SQLite is ephemeral on many PaaS platforms. For production use, migrate to Postgres or another managed DB if you need persistent/shared storage.

5. **Open your browser**:

## Security & housekeeping   Navigate to `http://localhost:8000`

- Do NOT commit `.env` or secrets. If secrets were ever committed, rotate them immediately.

- Remove generated files before publishing: `__pycache__/`, `*.pyc`, `backend/userdata.db`.## Quick Windows (PowerShell) Guide 🪟

- Add a `.gitignore` that contains (at minimum):

  - `__pycache__/If you're on Windows and want the simplest way to run the project locally using PowerShell, follow these steps from the project root (`t:\NL2SQL.AI`):

  - *.py[cod]

  - .env1. Create and activate a virtual environment:

  - .venv/

  - backend/userdata.db```powershell

python -m venv .venv

## Helpful files.venv\Scripts\Activate.ps1

- `Procfile` — optional, helpful for Heroku/Render CLI deployments.```

- `render.yaml` — optional Render manifest (recommended if you want reproducible, Git-driven deploys).

2. Install dependencies:

## License

This project is licensed under the MIT License — see `LICENSE`.```powershell

pip install -r backend\requirements.txt

If you'd like, I can also create a `.gitignore`, add a small `DEPLOYMENT_GUIDE.md`, or remove the `__pycache__` and `.pyc` files from the repository now. Which would you like next?```

3. Ensure your environment variables are configured. Copy `backend/env.example` to `backend/.env` and fill in values or set them in the shell:

```powershell
# $env:GEMINI_API_KEY = "your_gemini_api_key_here"
# $env:SECRET_KEY = "some_long_secret"
# (or create backend/.env with those keys)
```

4. Start the app (recommended):

```powershell
python start.py
```

5. Open the app in your browser:

```
http://localhost:8000
```

This short guide mirrors the full development instructions above but is tailored for PowerShell users.

## Usage 📖

### 1. Create an Account
- Click "Signup" and create a new account
- Login with your credentials

### 2. Manage Databases
- **Upload**: Upload an existing SQLite database file
- **Create**: Create a new empty database

### 3. Query Your Data
- Type your question in natural language
- Example: "Show me all users who registered this month"
- Click "Run Query" to see the SQL and results

## Project Structure 📁

```
NL2SQL.AI/
├── backend/
│   ├── main.py          # FastAPI application
│   ├── auth.py          # JWT authentication
│   ├── models.py        # Database models
│   ├── mcp_server.py    # Google Gemini integration
│   ├── requirements.txt # Python dependencies
│   └── env.example      # Environment template
├── frontend/
│   ├── index.html       # Main HTML page
│   ├── script.js        # JavaScript functionality
│   └── style.css        # Styling
├── start.py             # Startup script
└── README.md            # This file
```

## API Endpoints 🛠️

### Authentication
- `POST /signup/` - Create new user account
- `POST /login/` - Login and get access token

### Database Management
- `POST /upload_db/` - Upload database file
- `POST /create_db/` - Create new database
- `POST /query/` - Execute natural language query

### Frontend
- `GET /` - Serve main application
- `GET /static/*` - Serve static files

## Security Features 🔒

- **Password Hashing**: Passwords encrypted with bcrypt
- **JWT Tokens**: Secure authentication tokens
- **User Isolation**: Each user has separate database workspace
- **Input Validation**: Comprehensive input validation and sanitization
- **Error Handling**: Proper error handling throughout the application

## Environment Variables 🔧

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | Required |
| `SECRET_KEY` | JWT secret key | `supersecretkey` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `30` |
| `DB_DIR` | Database storage directory | `backend/databases` |
| `USER_DB` | User database file | `backend/userdata.db` |

## Development 💻

### Running in Development Mode

The startup script automatically runs the server with hot reload enabled:

```bash
python start.py
```

### Manual Development Setup

1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```

2. Set environment variables:
   ```bash
   export GEMINI_API_KEY="your_key_here"
   ```

3. Run the server:
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Troubleshooting 🔧

### Common Issues

1. **"Module not found" errors**:
   - Make sure all dependencies are installed: `pip install -r backend/requirements.txt`

2. **Gemini API errors**:
   - Verify your API key is correct in `backend/.env`
   - Check your Google AI Studio account has sufficient credits
   - Ensure you've enabled the Gemini API in your Google Cloud Console

3. **Database errors**:
   - Ensure the `backend/databases` directory exists
   - Check file permissions for database uploads

4. **Frontend not loading**:
   - Make sure you're accessing `http://localhost:8000` (not the frontend files directly)
   - Check that static files are being served correctly

### Error Messages

- **"Invalid token"**: Your session has expired, please login again
- **"Database not found"**: Make sure you've uploaded or created a database first
- **"Query cannot be empty"**: Enter a natural language query before clicking "Run Query"

## Contributing 🤝

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License 📄

This project is open source and available under the MIT License.

## Support 💬

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Review the error messages in your browser console
3. Ensure all setup steps were completed correctly

## Changelog 📝

### Latest Version
- ✅ Migrated from OpenAI to Google Gemini API
- ✅ Enhanced SQLite-specific SQL generation
- ✅ Added secure password hashing
- ✅ Improved error handling throughout the application
- ✅ Added comprehensive input validation
- ✅ Environment variable configuration
- ✅ Static file serving for frontend
- ✅ Automated setup script
- ✅ Database schema-aware query generation

---

**Happy querying!** 🎉
