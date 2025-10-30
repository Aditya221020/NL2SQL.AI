from fastapi import FastAPI, UploadFile, Form, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import shutil, os, sqlite3
from dotenv import load_dotenv
from . import mcp_server, models, auth
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='[%(levelname)s] %(message)s')
logger = logging.getLogger(__name__)

app = FastAPI()

# Allow frontend → backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
models.init()  # initialize user DB

DB_DIR = os.getenv("DB_DIR", "backend/databases")

# Mount static files for frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

@app.get("/")
async def read_index():
    return FileResponse('frontend/index.html')

# --- AUTH ---

@app.post("/signup/")
async def signup(username: str = Form(...), password: str = Form(...)):
    logger.debug(f"Signup attempt: username={username}")
    result = models.create_user(username, password)
    logger.debug(f"Signup result: {result}")
    if result:
        return {"msg": "User created"}
    # creation failed - return 400 so frontend can detect failure
    raise HTTPException(status_code=400, detail="User already exists or creation failed")


@app.post("/login/")
async def login(username: str = Form(...), password: str = Form(...)):
    logger.debug(f"Login attempt: username={username}")
    user = models.authenticate(username, password)
    logger.debug(f"Login user found: {user}")
    if not user:
        return {"error": "Invalid credentials"}
    token = auth.create_access_token({"sub": username})
    return {"access_token": token, "token_type": "bearer"}

def get_user(token: str = Depends(oauth2_scheme)):
    username = auth.verify_token(token)
    if not username:
        raise HTTPException(status_code=401, detail="Invalid token")
    return username

# --- DB Actions ---
@app.post("/upload_db/")
async def upload_db(file: UploadFile, username: str = Depends(get_user)):
    if not file.filename.endswith('.db'):
        raise HTTPException(status_code=400, detail="Only .db files are allowed")
    
    user_folder = os.path.join(DB_DIR, username)
    os.makedirs(user_folder, exist_ok=True)
    path = os.path.join(user_folder, file.filename)
    
    try:
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return {"msg": "Database uploaded", "db_name": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload database: {str(e)}")

@app.post("/create_db/")
async def create_db(name: str = Form(...), username: str = Depends(get_user)):
    if not name.strip():
        raise HTTPException(status_code=400, detail="Database name cannot be empty")
    
    user_folder = os.path.join(DB_DIR, username)
    os.makedirs(user_folder, exist_ok=True)
    path = os.path.join(user_folder, f"{name}.db")
    
    try:
        conn = sqlite3.connect(path)
        conn.close()
        return {"msg": "Database created", "db_name": f"{name}.db"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create database: {str(e)}")

@app.get("/databases/")
async def list_databases(username: str = Depends(get_user)):
    """
    List all databases for the current user
    """
    try:
        user_folder = os.path.join(DB_DIR, username)
        if not os.path.exists(user_folder):
            return {"uploaded": [], "created": []}
        
        uploaded_dbs = []
        created_dbs = []
        
        for filename in os.listdir(user_folder):
            if filename.endswith('.db'):
                db_path = os.path.join(user_folder, filename)
                stat = os.stat(db_path)
                
                db_info = {
                    "name": filename,
                    "size": stat.st_size,
                    "created": stat.st_ctime,
                    "modified": stat.st_mtime
                }
                
                # Determine if it's uploaded or created based on size/content
                if stat.st_size > 0:
                    uploaded_dbs.append(db_info)
                else:
                    created_dbs.append(db_info)
        
        return {
            "uploaded": uploaded_dbs,
            "created": created_dbs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list databases: {str(e)}")

@app.post("/query/")
async def run_query(nl_query: str = Form(...), db_name: str = Form(...), username: str = Depends(get_user)):
    if not nl_query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    if not db_name.strip():
        raise HTTPException(status_code=400, detail="Database name cannot be empty")
    
    # Check if database exists
    user_folder = os.path.join(DB_DIR, username)
    db_path = os.path.join(user_folder, db_name)
    if not os.path.exists(db_path):
        raise HTTPException(status_code=404, detail="Database not found")
    
    try:
        sql = mcp_server.nl_to_sql(nl_query, db_name, username)
        results = mcp_server.execute_sql(sql, db_name, username)
        return {"sql": sql, "results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query execution failed: {str(e)}")
