import sqlite3, os
from google import genai   
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_DIR = os.getenv("DB_DIR", "backend/databases")
os.makedirs(DB_DIR, exist_ok=True)

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")


client = genai.Client(api_key=gemini_api_key)


def get_database_schema(db_name, username=None):
    """
    Get database schema information to provide context for SQL generation
    """
    try:
        if username is None:
            users = os.listdir(DB_DIR) if os.path.exists(DB_DIR) else []
            for user in users:
                user_folder = os.path.join(DB_DIR, user)
                if os.path.isdir(user_folder):
                    db_path = os.path.join(user_folder, db_name)
                    if os.path.exists(db_path):
                        username = user
                        break
        
        if username:
            user_folder = os.path.join(DB_DIR, username)
            db_path = os.path.join(user_folder, db_name)
        else:
            db_path = os.path.join(DB_DIR, db_name)
        
        if not os.path.exists(db_path):
            return "Database not found or not accessible"
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        schema_info = []
        for table in tables:
            table_name = table[0]
            if table_name.startswith('sqlite_'):
                continue
                
            cursor.execute(f"PRAGMA table_info({table_name});")
            columns = cursor.fetchall()
            
            table_info = table_name + " ("
            column_info = []
            for col in columns:
                column_info.append(f"{col[1]} {col[2]}")
            table_info += ", ".join(column_info) + ")"
            schema_info.append(table_info)
        
        conn.close()
        return "\n".join(schema_info) if schema_info else "No tables found"
        
    except Exception as e:
        return f"Error reading schema: {str(e)}"


def nl_to_sql(nl_query, db_name, username=None):
    """
    Convert natural language query to SQL using Gemini
    """
    try:
        schema = get_database_schema(db_name, username)
        
        prompt = f"""You are an expert SQLite SQL generator. Convert natural language to proper SQLite SQL queries.

CONTEXT:
Database: {db_name}
Schema: {schema}

USER QUERY: {nl_query}

SQLITE-SPECIFIC GUIDELINES:
1. Return ONLY the SQL query, no explanations
2. Always end with semicolon (;)
3. Use valid SQLite syntax only

Generate SQLite query:"""

     
        response = client.models.generate_content(
            model="gemini-flash-latest",
            contents=prompt
        )

        sql = response.text.strip()
        
        # Clean SQL
        lines = sql.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('```') and not line.startswith('#'):
                cleaned_lines.append(line)
        
        sql = ' '.join(cleaned_lines).strip()
        sql = sql.replace('```sql', '').replace('```', '').strip()

        if sql and not sql.endswith(';'):
            sql += ';'
        
        if not sql.upper().startswith(('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP')):
            return "SELECT 'Invalid query generated. Please rephrase.' as error;"
            
        return sql

    except Exception as e:
        return f"SELECT 'Error generating SQL: {str(e)}' as error;"


def execute_sql(sql, db_name, username):
    """
    Execute SQL on user's database
    """
    user_folder = os.path.join(DB_DIR, username)
    os.makedirs(user_folder, exist_ok=True)
    db_path = os.path.join(user_folder, db_name)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        cursor.execute(sql)

        if sql.strip().lower().startswith(("insert", "update", "delete", "create", "drop", "alter")):
            conn.commit()

        if cursor.description:
            cols = [desc[0] for desc in cursor.description]
            rows = [dict(zip(cols, row)) for row in cursor.fetchall()]
            return rows
        else:
            return [{"message": "Query executed successfully"}]

    except Exception as e:
        return [{"error": str(e)}]

    finally:
        conn.close()
