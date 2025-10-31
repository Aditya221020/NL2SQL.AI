import sqlite3, os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DB_DIR = os.getenv("DB_DIR", "backend/databases")
os.makedirs(DB_DIR, exist_ok=True)

# Configure Gemini API
gemini_api_key = os.getenv("GEMINI_API_KEY")
if not gemini_api_key:
    raise ValueError("GEMINI_API_KEY environment variable is required")
genai.configure(api_key=gemini_api_key)

# Initialize Gemini model
model = genai.GenerativeModel('gemini-2.0-flash')

def get_database_schema(db_name, username=None):
    """
    Get database schema information to provide context for SQL generation
    """
    try:
        if username is None:
            # If no username provided, try to find the database in any user folder
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
            db_path = os.path.join(DB_DIR, db_name)  # Fallback to root
        
        if not os.path.exists(db_path):
            return "Database not found or not accessible"
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Get all table names
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        
        schema_info = []
        for table in tables:
            table_name = table[0]
            # Skip system tables
            if table_name.startswith('sqlite_'):
                continue
                
            # Get table structure
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
    Convert natural language query to SQL using Google Gemini
    """
    try:
        # Get database schema to provide context
        schema = get_database_schema(db_name, username)
        
        prompt = f"""You are an expert SQLite SQL generator. Convert natural language to proper SQLite SQL queries.

CONTEXT:
Database: {db_name}
Schema: {schema}

USER QUERY: {nl_query}

SQLITE-SPECIFIC GUIDELINES:
1. Return ONLY the SQL query, no explanations or formatting
2. Always end with semicolon (;)
3. Use proper SQLite data types: TEXT, INTEGER, REAL, BLOB, NULL
4. For dates/times: Use strftime('%Y-%m-%d', column) or DATE() functions
5. String comparisons: Use LOWER() for case-insensitive matching
6. Patterns: Use % wildcard with LIKE for partial matches
7. Null handling: Use IS NULL or IS NOT NULL (not = NULL)
8. Aggregations: COUNT(*), SUM(), AVG(), MIN(), MAX() with GROUP BY when grouping
9. Ordering: Use ORDER BY column ASC/DESC
10. Concatenation: Use || operator (not CONCAT())
11. Subqueries: Properly nest SELECT statements when needed
12. Index hints: Don't use MySQL-style index hints

EXAMPLES:
- "show all users" → SELECT * FROM users;
- "count products" → SELECT COUNT(*) FROM products;
- "find john users" → SELECT * FROM users WHERE LOWER(name) LIKE '%john%';
- "today's orders" → SELECT * FROM orders WHERE DATE(order_date) = DATE('now');

Generate SQLite query:"""

        response = model.generate_content(prompt)
        sql = response.text.strip()
        
        # Clean up the SQL query
        lines = sql.split('\n')
        cleaned_lines = []
        for line in lines:
            line = line.strip()
            if line and not line.startswith('```') and not line.startswith('#'):
                cleaned_lines.append(line)
        
        sql = ' '.join(cleaned_lines).strip()
        
        # Remove any markdown formatting
        sql = sql.replace('```sql', '').replace('```', '').strip()
        
        # Ensure it ends with semicolon if it's not already there
        if sql and not sql.endswith(';'):
            sql += ';'
        
        # Basic validation - ensure it looks like SQL
        if not sql.upper().startswith(('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP')):
            return f"SELECT 'Invalid query generated: Please rephrase your question' as error;"
            
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

        # ✅ Commit if the query modifies data
        if sql.strip().lower().startswith(("insert", "update", "delete", "create", "drop", "alter")):
            conn.commit()

        # ✅ Return results if it's a SELECT
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

