// Global variables
// Pick API automatically: use local backend when running on localhost, otherwise use production URL.
const DEFAULT_PROD_API = "https://nl2sql-ai.onrender.com";
const locHost = (typeof window !== 'undefined' && window.location && window.location.hostname)
    ? window.location.hostname : null;

const API = (locHost === 'localhost' || locHost === '127.0.0.1' || locHost === '' || locHost === null)
    ? "http://localhost:8000"
    : DEFAULT_PROD_API;

let token = null;
let currentUser = null;
let currentDatabase = null;

// ✅ Chat history per database
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

            showError(data.detail || "Registration failed");
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

        showError("Network error loading databases");

    }
}

function displayDatabases(databases, containerId, type) {

    const container = document.getElementById(containerId);

    if (databases.length === 0) {

        container.innerHTML = `<p>No databases</p>`;
        return;

    }

    container.innerHTML = databases.map(db => `

        <div class="database-item"
            onclick="openChat('${db.name}', '${type}')">

            <div>${db.name}</div>

            <button onclick="event.stopPropagation(); openChat('${db.name}', '${type}')">
                Chat
            </button>

        </div>

    `).join('');
}


// Chat open function (with chat restore)
function openChat(databaseName, databaseType) {

    // Save previous database chat
    if (currentDatabase) {

        chatHistory[currentDatabase] =
            document.getElementById('chatMessages').innerHTML;

    }

    currentDatabase = databaseName;

    document.getElementById('currentDbName').textContent = databaseName;
    document.getElementById('currentDbType').textContent = databaseType;

    const container = document.getElementById('chatMessages');

    // Restore chat if exists
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

}


// Chat functions
function clearChatMessages() {

    document.getElementById('chatMessages').innerHTML = `
        <div class="message bot-message">
            <div class="message-content">
                Hello! I'm your SQL assistant.
            </div>
        </div>
    `;
}

function addMessage(content, isUser = false) {

    const container = document.getElementById('chatMessages');

    const div = document.createElement('div');

    div.className = isUser
        ? 'message user-message'
        : 'message bot-message';

    div.innerHTML =
        `<div class="message-content">${content}</div>`;

    container.appendChild(div);

    container.scrollTop = container.scrollHeight;

    // Save chat history
    if (currentDatabase) {

        chatHistory[currentDatabase] = container.innerHTML;

    }
}


async function sendMessage(message) {

    if (!currentDatabase) {

        showError("No database selected");
        return;

    }

    addMessage(message, true);

    const loadingDiv = document.createElement('div');

    loadingDiv.className = 'message bot-message';

    loadingDiv.innerHTML =
        `<div class="message-content">Processing...</div>`;

    document.getElementById('chatMessages')
        .appendChild(loadingDiv);

    try {

        const form = new FormData();

        form.append("nl_query", message);
        form.append("db_name", currentDatabase);

        const response = await fetch(API + "/query/", {

            method: "POST",

            body: form,

            headers: {
                Authorization: "Bearer " + token
            }

        });

        const data = await response.json();

        loadingDiv.remove();

        if (response.ok) {

            addMessage(`<strong>SQL:</strong><br>${data.sql}`);

        } else {

            addMessage(`<strong>Error:</strong> ${data.detail}`);

        }

    } catch (error) {

        loadingDiv.remove();

        addMessage(`<strong>Error:</strong> ${error.message}`);

    }
}


// Utility
function showError(msg) {

    alert(msg);

}

function showSuccess(msg) {

    alert(msg);

}


// Init
document.addEventListener('DOMContentLoaded', function () {

    showPage('landingPage');

});
