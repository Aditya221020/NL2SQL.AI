// Global variables
// Pick API automatically: use local backend when running on localhost, otherwise use production URL.
const DEFAULT_PROD_API = "https://nl2sql-ai.onrender.com";
const locHost = (typeof window !== 'undefined' && window.location && window.location.hostname) ? window.location.hostname : null;
const API = (locHost === 'localhost' || locHost === '127.0.0.1' || locHost === '' || locHost === null)
    ? "http://localhost:8000"
    : DEFAULT_PROD_API;

let token = null;
let currentUser = null;
let currentDatabase = null;

// ✅ ADDED: Store chat history per database
let chatHistory = {};


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
        <div class="database-item"
            onclick="openChat('${db.name}', '${type === 'uploaded' ? 'Uploaded' : 'Created'}')">

            <div class="database-info">
                <div class="database-name">${db.name}</div>
                <div class="database-meta">
                    Size: ${formatFileSize(db.size)} |
                    Modified: ${new Date(db.modified * 1000).toLocaleDateString()}
                </div>
            </div>

            <div class="database-actions">
                <button class="btn btn-small btn-primary"
                    onclick="event.stopPropagation(); openChat('${db.name}', '${type === 'uploaded' ? 'Uploaded' : 'Created'}')">
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


// Database actions
function openChat(databaseName, databaseType) {

    // ✅ Save previous chat
    if (currentDatabase) {
        chatHistory[currentDatabase] =
            document.getElementById('chatMessages').innerHTML;
    }

    currentDatabase = databaseName;

    document.getElementById('currentDbName').textContent = databaseName;
    document.getElementById('currentDbType').textContent = databaseType;

    const container = document.getElementById('chatMessages');

    // ✅ Restore chat if exists
    if (chatHistory[databaseName]) {
        container.innerHTML = chatHistory[databaseName];
    } else {
        clearChatMessages();
    }

    showPage('chatPage');
}

function goToDashboard() {

    if (currentDatabase) {
        chatHistory[currentDatabase] =
            document.getElementById('chatMessages').innerHTML;
    }

    showPage('dashboardPage');

    currentDatabase = null;
}


// Chat functions
function clearChatMessages() {

    document.getElementById('chatMessages').innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                <p>Hello! I'm your SQL assistant. Ask me anything about your database.</p>
            </div>
        </div>
    `;
}

function addMessage(content, isUser = false) {

    const messagesContainer = document.getElementById('chatMessages');

    const messageDiv = document.createElement('div');

    messageDiv.className =
        `message ${isUser ? 'user-message' : 'bot-message'}`;

    messageDiv.innerHTML =
        `<div class="message-content">${content}</div>`;

    messagesContainer.appendChild(messageDiv);

    messagesContainer.scrollTop = messagesContainer.scrollHeight;

    // ✅ Save chat per database
    if (currentDatabase) {
        chatHistory[currentDatabase] =
            messagesContainer.innerHTML;
    }
}


// sendMessage function unchanged (works perfectly)
async function sendMessage(message) {

    if (!currentDatabase) {
        showError("No database selected");
        return;
    }

    addMessage(message, true);

    const loadingDiv = document.createElement('div');

    loadingDiv.className = 'message bot-message';

    loadingDiv.innerHTML =
        `<div class="message-content证明">Processing...</div>`;

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

        loadingDiv.remove();

        if (response.ok) {

            addMessage(`<strong>Generated SQL:</strong><br><code>${data.sql}</code>`);

            if (data.results && data.results.length > 0) {

                let html = "<strong>Results:</strong><br><table border='1'>";

                html += "<tr>";

                Object.keys(data.results[0]).forEach(col => {
                    html += `<th>${col}</th>`;
                });

                html += "</tr>";

                data.results.forEach(row => {

                    html += "<tr>";

                    Object.values(row).forEach(val => {
                        html += `<td>${val}</td>`;
                    });

                    html += "</tr>";
                });

                html += "</table>";

                addMessage(html);

            } else {

                addMessage("<em>No results found</em>");
            }

        } else {

            addMessage(`<strong>Error:</strong> ${data.detail}`);
        }

    } catch (error) {

        loadingDiv.remove();

        addMessage(`<strong>Error:</strong> ${error.message}`);
    }
}
