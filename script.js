// ============= CONFIGURATION =============
// REPLACE with your actual GitHub username and repository name
const GITHUB_USERNAME = 'nzioker'; // e.g., 'nzioker'
const REPO_NAME = 'ai-email-assistant';
const BRANCH = 'main';

// IMPORTANT: For a PUBLIC portfolio demo, we can use a LIMITED approach.
// We'll use the GitHub API without authentication for READ operations (fetching results).
// For WRITE operations (posting queries), we'll use a GitHub Actions workflow dispatch.
// This is more secure than embedding a token in frontend code.
// =========================================

// API Endpoints
const API_BASE = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents`;
const RAW_BASE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/${BRANCH}`;

// Workflow file name (from your .github/workflows/ directory)
const WORKFLOW_FILE = 'search.yml';

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
async function performSearch() {
    const query = queryInput.value.trim();
    
    if (!query) {
        showStatus('Please enter a search query.', 'error');
        return;
    }
    
    // Reset UI
    resultsArea.style.display = 'none';
    resultsArea.innerHTML = '';
    
    // Show searching status
    showStatus(`<i class="fas fa-cog fa-spin"></i> Writing query to repository and triggering search...`, 'info');
    
    // Disable button during search
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-cog fa-spin"></i> Processing...';
    
    try {
        // 1. Write the query to data/user_query.txt
        await writeQueryToRepo(query);
        
        // 2. Trigger the GitHub Actions workflow
        await triggerWorkflow();
        
        // 3. Poll for results (check every 3 seconds, max 60 seconds)
        await pollForResults(query);
        
    } catch (error) {
        console.error('Search failed:', error);
        showStatus(`Error: ${error.message}`, 'error');
    } finally {
        // Re-enable button
        searchBtn.disabled = false;
        searchBtn.innerHTML = '<i class="fas fa-search"></i> Search Virtual Inbox';
    }
}

async function writeQueryToRepo(query) {
    // Encode the query for the file
    const content = btoa(unescape(encodeURIComponent(query)));
    
    // First, get the current file SHA (required for update)
    const fileInfo = await fetch(`${API_BASE}/data/user_query.txt`, {
        headers: { 'Accept': 'application/vnd.github.v3+json' }
    }).then(r => r.ok ? r.json() : { sha: null });
    
    // Prepare the update request
    const updateData = {
        message: `docs: update search query [skip ci]`,
        content: content,
        sha: fileInfo.sha, // If sha is null, GitHub will create the file
        branch: BRANCH
    };
    
    // Note: This write operation requires authentication.
    // For a public site, we need an alternative approach.
    // For now, we'll simulate or use a backend proxy.
    showStatus(`Query ready: "${query}" (Write requires auth setup)`, 'info');
    // We'll implement a secure method in the next step
    return Promise.resolve();
}

async function triggerWorkflow() {
    // Instead of direct file write, we can trigger a workflow_dispatch event
    // This requires a PAT with repo scope, which should NOT be in frontend code.
    showStatus('Triggering search engine... (setup in progress)', 'info');
    // We'll set up a separate endpoint or use a different trigger method
    return Promise.resolve();
}

async function pollForResults(query) {
    showStatus(`<i class="fas fa-cog fa-spin"></i> AI model is searching your emails...`, 'info');
    
    let attempts = 0;
    const maxAttempts = 20; // 20 attempts * 3 seconds = 60 seconds total
    
    while (attempts < maxAttempts) {
        attempts++;
        
        try {
            // Fetch the latest results file
            const response = await fetch(`${RAW_BASE}/data/search_results.json?t=${Date.now()}`);
            
            if (response.ok) {
                const results = await response.json();
                
                // Check if results are fresh (could add timestamp check)
                if (results && results.length > 0) {
                    displayResults(results, query);
                    showStatus(`✅ Search completed! Found ${results.length} emails.`, 'success');
                    return;
                }
            }
        } catch (error) {
            console.log(`Attempt ${attempts} failed:`, error.message);
        }
        
        // Wait 3 seconds before trying again
        await new Promise(resolve => setTimeout(resolve, 3000));
        showStatus(`<i class="fas fa-cog fa-spin"></i> Still searching... (${attempts * 3}s)`, 'info');
    }
    
    throw new Error('Search timeout. The AI engine might be taking longer than expected.');
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