// src/script.js
// ============= CONFIGURATION =============
// REPLACE with your GitHub username and repository name
const GITHUB_USERNAME = 'nzioker';
const REPO_NAME = 'ai-email-assistant';
const BRANCH = 'main'; // or 'master'

// GitHub Personal Access Token (PAT)
// IMPORTANT: Store this as a secret in GitHub Actions, NOT here in production.
// For this demo prototype, we'll simulate the process.
// =========================================

// DOM Elements
const queryInput = document.getElementById('queryInput');
const searchBtn = document.getElementById('searchBtn');
const statusArea = document.getElementById('statusArea');
const resultsArea = document.getElementById('resultsArea');

// GitHub API URLs (For demonstration - real implementation uses GitHub Actions)
// In the real flow, the frontend would write to user_query.txt via GitHub API
// and then poll for search_results.json. For this demo, we'll simulate.

// Sample data for DEMONSTRATION (Replace with actual API calls in Phase 3)
const sampleResults = [
    {
        sender: "project@company.com",
        subject: "Weekly Budget Update",
        body: "The project budget is on track with last week's forecasts. We've allocated additional resources for the Q3 marketing campaign.",
        similarity_score: 0.87
    },
    {
        sender: "alex.j@design.com",
        subject: "Design Mockups Feedback",
        body: "Here are my comments on the latest mockups. Please review before Friday's meeting.",
        similarity_score: 0.72
    },
    {
        sender: "team@collab.com",
        subject: "Meeting Notes: Project Sync",
        body: "Action items: Alex to finalize designs, Sam to prepare budget review, Taylor to contact the client.",
        similarity_score: 0.68
    }
];

// ============= EVENT LISTENERS =============
searchBtn.addEventListener('click', performSearch);
queryInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') performSearch();
});

// ============= CORE FUNCTIONS =============
function performSearch() {
    const query = queryInput.value.trim();
    
    if (!query) {
        showStatus('Please enter a search query.', 'error');
        return;
    }
    
    // Reset UI
    resultsArea.style.display = 'none';
    resultsArea.innerHTML = '';
    
    // Show searching status
    showStatus(`<i class="fas fa-cog fa-spin"></i> Searching for: "${query}"...`, 'info');
    
    // Disable button during search
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processing...';
    
    // Simulate API delay (Replace with real GitHub API calls)
    setTimeout(() => {
        // In the REAL implementation, here you would:
        // 1. Write the query to data/user_query.txt via GitHub API
        // 2. Trigger the GitHub Actions workflow
        // 3. Poll for results in data/search_results.json
        
        // For this demo, we'll use sample results
        displayResults(sampleResults, query);
        
        // Re-enable button
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Search Virtual Inbox';
    }, 1500); // Simulate 1.5 second delay
}

function displayResults(results, query) {
    if (!results || results.length === 0) {
        showStatus(`No emails found for "${query}". Try different keywords.`, 'warning');
        return;
    }
    
    showStatus(`Found ${results.length} relevant emails for "${query}".`, 'success');
    
    // Build results HTML
    let resultsHTML = '<h2><i class="fas fa-envelope-open-text"></i> Search Results</h2>';
    
    results.forEach((email, index) => {
        const scorePercent = Math.round(email.similarity_score * 100);
        const bodyPreview = email.body.length > 150 ? email.body.substring(0, 150) + '...' : email.body;
        
        resultsHTML += `
        <div class="email-card">
            <div class="email-header">
                <div class="sender"><i class="fas fa-user-circle"></i> ${email.sender}</div>
                <div class="score">Relevance: ${scorePercent}%</div>
            </div>
            <div class="subject">${email.subject}</div>
            <div class="body-preview">${bodyPreview}</div>
            <div class="email-footer">
                <div class="match">Matched your query: "${query}"</div>
                <div class="demo-tag">Sample Result</div>
            </div>
        </div>
        `;
    });
    
    resultsArea.innerHTML = resultsHTML;
    resultsArea.style.display = 'block';
    
    // Scroll to results
    resultsArea.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function showStatus(message, type = 'info') {
    statusArea.style.display = 'block';
    
    // Type-based styling
    const colors = {
        'info': '#2196F3',
        'success': '#4CAF50',
        'warning': '#FF9800',
        'error': '#F44336'
    };
    
    statusArea.style.borderLeftColor = colors[type] || colors['info'];
    statusArea.innerHTML = `<p><i class="fas fa-info-circle"></i> ${message}</p>`;
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusArea.style.display = 'none';
        }, 5000);
    }
}

// ============= INITIALIZATION =============
// Set a sample query as placeholder
queryInput.value = "budget meeting notes from last week";