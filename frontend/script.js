// Global variables
// Pick API automatically: use local backend when running on localhost, otherwise use production URL.
const DEFAULT_PROD_API = "https://nl2sql-ai.onrender.com"; // change to your real prod URL when deployed
const locHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : null;
const API = (locHost === 'localhost' || locHost === '127.0.0.1' || locHost === '' || locHost === null)
    ? "http://localhost:8000"
    : DEFAULT_PROD_API;
let token = null;
let currentUser = null;
let currentDatabase = null;

// Page management
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });
    document.getElementById(pageId).classList.remove('hidden');
}

function showModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Landing page functions
function showLogin() {
    hideModal('registerModal');
    showModal('loginModal');
}

function showRegister() {
    hideModal('loginModal');
    showModal('registerModal');
}

function hideLogin() {
    hideModal('loginModal');
}

function hideRegister() {
    hideModal('registerModal');
}

// Authentication functions
async function login(username, password) {
    try {
        const form = new FormData();
        form.append("username", username);
        form.append("password", password);
        
        const response = await fetch(API + "/login/", {
            method: "POST",
            body: form
        });
        
        const data = await response.json();
        
  if (data.access_token) {
    token = data.access_token;
            currentUser = username;
            hideModal('loginModal');
            showDashboard();
            loadDatabases();
            return true;
        } else {
            showError(data.error || "Login failed");
            return false;
        }
    } catch (error) {
        showError("Network error: " + error.message);
        return false;
    }
}

async function register(username, password) {
    try {
        const form = new FormData();
        form.append("username", username);
        form.append("password", password);
        
        const response = await fetch(API + "/signup/", {
            method: "POST",
            body: form
        });
        
        const data = await response.json();
        
        if (response.status === 200 || response.status === 201) {
            // Successful creation (201) or OK with created message
            showSuccess("Registration successful! Please login.");
            hideModal('registerModal');
            showLogin();
            return true;
        } else {
            showError(data.detail || data.msg || "Registration failed");
            return false;
        }
    } catch (error) {
        showError("Network error: " + error.message);
        return false;
    }
}

function logout() {
    token = null;
    currentUser = null;
    currentDatabase = null;
    showPage('landingPage');
}

// Dashboard functions
function showDashboard() {
    showPage('dashboardPage');
    document.getElementById('userName').textContent = currentUser;
}

async function loadDatabases() {
    try {
        const response = await fetch(API + "/databases/", {
            headers: { Authorization: "Bearer " + token }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            displayDatabases(data.uploaded, 'uploadedDatabases', 'uploaded');
            displayDatabases(data.created, 'createdDatabases', 'created');
        } else {
            showError("Failed to load databases");
        }
    } catch (error) {
        showError("Network error loading databases: " + error.message);
    }
}

function displayDatabases(databases, containerId, type) {
    const container = document.getElementById(containerId);
    
    if (databases.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">${type === 'uploaded' ? '📁' : '🗄️'}</div>
                <p>No ${type} databases yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = databases.map(db => `
        <div class="database-item" onclick="openChat('${db.name}', '${type === 'uploaded' ? 'Uploaded' : 'Created'}')">
            <div class="database-info">
                <div class="database-name">${db.name}</div>
                <div class="database-meta">
                    Size: ${formatFileSize(db.size)} | 
                    Modified: ${new Date(db.modified * 1000).toLocaleDateString()}
                </div>
            </div>
            <div class="database-actions">
                <button class="btn btn-small btn-primary" onclick="event.stopPropagation(); openChat('${db.name}', '${type === 'uploaded' ? 'Uploaded' : 'Created'}')">
                    Chat
                </button>
            </div>
        </div>
    `).join('');
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showUploadModal() {
    showModal('uploadModal');
}

function hideUploadModal() {
    hideModal('uploadModal');
}

function showCreateModal() {
    showModal('createModal');
}

function hideCreateModal() {
    hideModal('createModal');
}

async function uploadDatabase(file) {
    try {
        const formData = new FormData();
  formData.append("file", file);
        
        const response = await fetch(API + "/upload_db/", {
            method: "POST",
            body: formData,
            headers: { Authorization: "Bearer " + token }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess("Database uploaded successfully!");
            hideUploadModal();
            loadDatabases();
            return true;
        } else {
            showError(data.detail || "Upload failed");
            return false;
        }
    } catch (error) {
        showError("Network error: " + error.message);
        return false;
    }
}

async function createDatabase(name) {
    try {
        const form = new FormData();
  form.append("name", name);
        
        const response = await fetch(API + "/create_db/", {
            method: "POST",
            body: form,
            headers: { Authorization: "Bearer " + token }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showSuccess("Database created successfully!");
            hideCreateModal();
            loadDatabases();
            return true;
        } else {
            showError(data.detail || "Database creation failed");
            return false;
        }
    } catch (error) {
        showError("Network error: " + error.message);
        return false;
    }
}

function openChat(databaseName, databaseType) {
    // If switching database, clear chat
    if (currentDatabase !== databaseName) {
        clearChatMessages();
    }

    currentDatabase = databaseName;

    document.getElementById('currentDbName').textContent = databaseName;
    document.getElementById('currentDbType').textContent = databaseType;

    showPage('chatPage');
}


function goToDashboard() {
    showPage('dashboardPage');
    currentDatabase = null;
}

// Chat functions
function clearChatMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                <p>Hello! I'm your SQL assistant. Ask me anything about your database in natural language.</p>
                <p><strong>Examples:</strong></p>
                <ul>
                    <li>"Show me all users"</li>
                    <li>"Find orders from this month"</li>
                    <li>"Count products by category"</li>
                </ul>
            </div>
        </div>
    `;
}

function addMessage(content, isUser = false) {
    const messagesContainer = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    messageDiv.innerHTML = `
        <div class="message-content">
            ${content}
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage(message) {
    if (!currentDatabase) {
        showError("No database selected");
        return;
    }
    
    // Add user message
    addMessage(message, true);
    
    // Show loading
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message bot-message';
    loadingDiv.innerHTML = `
        <div class="message-content">
            <div class="loading"></div> Processing your query...
        </div>
    `;
    document.getElementById('chatMessages').appendChild(loadingDiv);
    
    try {
        const form = new FormData();
        form.append("nl_query", message);
        form.append("db_name", currentDatabase);
        
        const response = await fetch(API + "/query/", {
            method: "POST",
            body: form,
            headers: { Authorization: "Bearer " + token }
        });
        
        const data = await response.json();
        
        // Remove loading message
        loadingDiv.remove();
        
        if (response.ok) {
            // Show SQL query
            addMessage(`<strong>Generated SQL:</strong><br><code>${data.sql}</code>`);
            
            // Show results
            if (data.results && data.results.length > 0) {
                let resultsHtml = '<strong>Results:</strong><br>';
                resultsHtml += '<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">';
                
                // Header
                resultsHtml += '<tr style="background: #f7fafc;">';
                Object.keys(data.results[0]).forEach(key => {
                    resultsHtml += `<th style="border: 1px solid #e2e8f0; padding: 8px; text-align: left;">${key}</th>`;
                });
                resultsHtml += '</tr>';
                
                // Rows
                data.results.forEach(row => {
                    resultsHtml += '<tr>';
                    Object.values(row).forEach(value => {
                        resultsHtml += `<td style="border: 1px solid #e2e8f0; padding: 8px;">${value}</td>`;
                    });
                    resultsHtml += '</tr>';
                });
                
                resultsHtml += '</table>';
                addMessage(resultsHtml);
                

            } else {
                addMessage('<em>No results found</em>');
            }
        } else {
            addMessage(`<strong>Error:</strong> ${data.detail || "Query execution failed"}`);
        }
    } catch (error) {
        loadingDiv.remove();
        addMessage(`<strong>Error:</strong> Network error - ${error.message}`);
    }
}

// Utility functions
function showError(message) {
    // Remove existing error messages
    document.querySelectorAll('.error-message').forEach(el => el.remove());
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    
    // Insert at the top of the current page
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(errorDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }
}

function showSuccess(message) {
    // Remove existing success messages
    document.querySelectorAll('.success-message').forEach(el => el.remove());
    
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    
    // Insert at the top of the current page
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(successDiv, container.firstChild);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Login form
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        if (username && password) {
            await login(username, password);
        }
    });
    
    // Register form
    document.getElementById('registerForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('registerUsername').value;
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (password !== confirmPassword) {
            showError("Passwords do not match");
            return;
        }
        
        if (username && password) {
            await register(username, password);
        }
    });
    
    // Upload form
    document.getElementById('uploadForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const file = document.getElementById('dbFile').files[0];
        
        if (file) {
            await uploadDatabase(file);
        }
    });
    
    // Create form
    document.getElementById('createForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('dbName').value;
        
        if (name) {
            await createDatabase(name);
        }
    });
    
    // Chat form
    document.getElementById('chatForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const message = document.getElementById('chatInput').value;
        
        if (message) {
            document.getElementById('chatInput').value = '';
            await sendMessage(message);
        }
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    // Show landing page by default
    showPage('landingPage');
    

});





