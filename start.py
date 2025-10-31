#!/usr/bin/env python3
"""
NL2SQL.AI Startup Script
This script helps you set up and run the NL2SQL.AI application.
"""

import os
import sys
import subprocess
port = int(os.environ.get("PORT", 8000))

def check_requirements():
    """Check if required packages are installed."""
    try:
        import fastapi
        import uvicorn
        import google.generativeai as genai
        import passlib
        import jose
        print("OK - All required packages are installed")
        return True
    except ImportError as e:
        print(f"ERROR - Missing required package: {e}")
        return False

def install_requirements():
    """Install requirements from requirements.txt."""
    print("Installing requirements...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "backend/requirements.txt"])
        print("OK - Requirements installed successfully")
        return True
    except subprocess.CalledProcessError:
        print("ERROR - Failed to install requirements")
        return False

def check_env_file():
    """Check if .env file exists and contains Gemini API key."""
    env_path = "backend/.env"
    if not os.path.exists(env_path):
        print("ERROR - .env file not found")
        print("  Please copy backend/env.example to backend/.env and add your Gemini API key")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
        if "your_gemini_api_key_here" in content:
            print("ERROR - Please update your Gemini API key in backend/.env")
            print("  Get your API key from: https://makersuite.google.com/app/apikey")
            return False
    
        print("OK - Environment configuration looks good")
    return True

def start_server():
    """Start the FastAPI server."""
    print("Starting NL2SQL.AI server...")
    print("Frontend will be available at: http://localhost:8000/")
    print("API will be available at: http://localhost:8000/docs")
    print("\nPress Ctrl+C to stop the server")
    
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "backend.main:app", 
            "--host", "0.0.0.0", 
            "--port", str(port), 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\nServer stopped")

def main():
    print("NL2SQL.AI Setup and Startup")
    print("=" * 40)
    
    # Check if requirements are installed
    if not check_requirements():
        print("\nInstalling requirements...")
        if not install_requirements():
            print("ERROR - Setup failed. Please install requirements manually:")
            print("   pip install -r backend/requirements.txt")
            return
    
    # Check environment configuration
    if not check_env_file():
        print("ERROR - Please configure your environment variables first")
        return
    
    print("\nSetup complete! Starting server...")
    start_server()

if __name__ == "__main__":
    main()

