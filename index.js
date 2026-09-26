require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { Ollama } = require('ollama');
const { getChunker, formatChunkForReview } = require('./utils/chunker');
const { generateRepoStats } = require('./utils/crawler');
const { setupIndex, indexChunk, searchRelevantContext, saveIndex, clearIndex } = require('./local_vector_db');

const app = express();
const port = 3001; 

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

// Initialize Elasticsearch index
setupIndex();

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Compact Backend is running!');
});

// API route to select a folder natively (Windows)
app.get('/api/select-folder', (req, res) => {
    try {
        const { execSync } = require('child_process');
        const psScript = `
        Add-Type -AssemblyName System.windows.forms
        $form = New-Object System.Windows.Forms.Form
        $form.TopMost = $true
        $f = New-Object System.Windows.Forms.FolderBrowserDialog
        $f.ShowNewFolderButton = $false
        if($f.ShowDialog($form) -eq 'OK') {
            $f.SelectedPath
        }
        `;
        const result = execSync(`powershell -Command "${psScript.replace(/\n/g, '; ')}"`).toString().trim();
        if (result) {
            res.json({ path: result });
        } else {
            res.status(400).json({ error: "No folder selected" });
        }
    } catch (err) {
        console.error("Folder selection error:", err);
        res.status(500).json({ error: "Failed to open folder dialog" });
    }
});

// API route to list files in a folder for the UI explorer
app.post('/api/list-folder', (req, res) => {
    try {
        const { repoPath } = req.body;
        if (!repoPath || repoPath === '.') return res.json({ files: [] });
        
        const fs = require('fs');
        const items = fs.readdirSync(repoPath, { withFileTypes: true });
        
        const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.venv', '__pycache__']);
        
        const files = items
            .filter(item => !IGNORE_DIRS.has(item.name) && !item.name.endsWith('.lock'))
            .map(item => ({
                name: item.name,
                isDirectory: item.isDirectory()
            }))
            .sort((a, b) => {
                if (a.isDirectory && !b.isDirectory) return -1;
                if (!a.isDirectory && b.isDirectory) return 1;
                return a.name.localeCompare(b.name);
            });
        
        res.json({ files });
    } catch (e) {
        console.error("List folder error:", e);
        res.status(500).json({ error: e.message });
    }
});

// API route to scan and index a repository
app.post('/api/scan', async (req, res) => {
    try {
        const { repoPath } = req.body;
        if (!repoPath) return res.status(400).json({ error: "repoPath is required." });

        console.log(`Starting scan for repository: ${repoPath}`);
        const { files, fileCount, totalLines } = generateRepoStats(repoPath);
        console.log(`Found ${fileCount} files with ${totalLines} total lines to index.`);
        
        // Clear the DB before a fresh scan
        clearIndex();
        
        let totalChunks = 0;

        for (const file of files) {
            const chunker = getChunker(file);
            let chunks = chunker.chunkFile(file);
            
            // If the file shouldn't be fully chunked, just take the first result
            if (!chunker.shouldChunk(file) && chunks.length > 1) {
                chunks = [chunks[0]];
            }

            for (const chunk of chunks) {
                let embedding = null;
                try {
                    // Generate vector embedding via Ollama
                    const embedResponse = await ollama.embeddings({
                        model: 'nomic-embed-text',
                        prompt: chunk.content,
                        options: { num_ctx: 8192 }
                    });
                    embedding = embedResponse.embedding;
                } catch (err) {
                    console.warn(`Failed to embed chunk in ${file}:`, err.message);
                }

                await indexChunk(chunk, embedding);
                totalChunks++;
            }
        }
        
        // Save the index to disk
        saveIndex();

        res.json({ 
            message: "Scan and indexing complete.", 
            stats: {
                filesIndexed: fileCount, 
                totalLines,
                totalChunks 
            }
        });
    } catch (error) {
        console.error("Error during scan:", error);
        res.status(500).json({ error: "Failed to scan and index repository." });
    }
});

// API route to handle chat
app.post('/api/chat', async (req, res) => {
    try {
        const { messages, model, useRAG } = req.body;
        // Default model to 'codegemma' if not provided
        const targetModel = model || 'llama3.2:1b'; 
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Messages array is required." });
        }

        // Apply RAG if requested and context is needed
        if (useRAG && messages.length > 0) {
            const lastMessage = messages[messages.length - 1].content;
            let embedding = null;
            
            try {
                // Generate vector embedding for the search query
                const embedResponse = await ollama.embeddings({
                    model: 'nomic-embed-text',
                    prompt: lastMessage
                });
                embedding = embedResponse.embedding;
            } catch (err) {
                console.warn(`Failed to embed query, falling back to text search:`, err.message);
            }

            const contextChunks = await searchRelevantContext(lastMessage, embedding, 5); 
            
            if (contextChunks && contextChunks.length > 0) {
                let contextStr = "Here is some relevant context from the repository:\n\n";
                contextChunks.forEach((chunk, index) => {
                    contextStr += formatChunkForReview(chunk, contextChunks.length, index + 1) + "\n";
                });
                
                // Prepend context to the last message
                messages[messages.length - 1].content = `${contextStr}\nBased on the above context, answer the following request:\n${lastMessage}`;
            }
        }

        // Send streaming response
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Transfer-Encoding', 'chunked');

        const stream = await ollama.chat({
            model: targetModel,
            messages: messages,
            stream: true,
        });

        for await (const chunk of stream) {
            res.write(chunk.message.content);
        }

        res.end();
    } catch (error) {
        console.error("Error during chat:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to communicate with LLM" });
        } else {
            res.end("\n[Error communicating with LLM]");
        }
    }
});

// API route to review the repository after scan
app.post('/api/review-repo', async (req, res) => {
    try {
        const { model } = req.body;
        const targetModel = model || 'llama3.2:1b';
        
        let embedding = null;
        try {
            const embedResponse = await ollama.embeddings({
                model: 'nomic-embed-text',
                prompt: 'security vulnerabilities, code smells, hardcoded secrets, inefficient code, errors, bugs'
            });
            embedding = embedResponse.embedding;
        } catch (err) {}

        const contextChunks = await searchRelevantContext("security issues", embedding, 5); 
        
        if (!contextChunks || contextChunks.length === 0) {
            return res.json({ findings: [] });
        }

        let contextStr = "Code snippets from the repository:\n\n";
        contextChunks.forEach((chunk, index) => {
            contextStr += formatChunkForReview(chunk, contextChunks.length, index + 1) + "\n";
        });

        const prompt = `${contextStr}\nReview the above code snippets and provide a comprehensive file-by-file analysis in the EXACT format below. Do NOT use JSON. Use pure markdown text.

Format:
Detailed Analysis
Repository Review

Repository: [Extract Repo Name from context or use unknown]
Branch: main
Files selected: [Count]

Starting file-by-file analysis…

Progress

Analyzing file 1/[Count]: [Filename]
Risk: [low | medium | high | critical]
Issues: 
• [Issue 1]
• [Issue 2]
Suggested Fixes: 
• [Fix 1]
• [Fix 2]
File Content:
[Brief snippet or summary]

(Repeat for all files with issues)

---
Finalizing
Generating overall summary...
---
Repository Summary
[Overall summary]
Suggestions
[Markdown table or list of suggestions]`;

        const response = await ollama.chat({
            model: targetModel,
            messages: [{ role: 'user', content: prompt }],
            stream: false,
            options: { num_ctx: 8192 }
        });

        res.json({ findings: response.message.content.trim() });
    } catch (error) {
        console.error("Error during repo review:", error);
        res.status(500).json({ error: "Failed to perform review" });
    }
});

// API route to list available local models
app.get('/api/models', async (req, res) => {
    try {
         const response = await ollama.list();
         res.json(response);
    } catch (error) {
         console.error("Error fetching models:", error);
         res.status(500).json({ error: "Failed to fetch models" });
    }
});

// --- GitHub OAuth & Clone Routes ---

// 1. Redirect to GitHub for login
app.get('/api/auth/github', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const redirectUri = 'http://localhost:3001/api/auth/github/callback';
    const scope = 'repo'; // request repo scope to access private repos
    res.redirect(`https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}`);
});

// 2. Handle callback from GitHub
app.get('/api/auth/github/callback', async (req, res) => {
    const code = req.query.code;
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    try {
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                client_id: clientId,
                client_secret: clientSecret,
                code: code
            })
        });
        
        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
            // Redirect back to frontend with the token
            res.redirect(`http://localhost:5173/?github_token=${tokenData.access_token}`);
        } else {
            res.redirect(`http://localhost:5173/?error=github_auth_failed`);
        }
    } catch (err) {
        console.error('GitHub Auth Error:', err);
        res.redirect(`http://localhost:5173/?error=github_auth_error`);
    }
});

// 3. Get user repositories using the token
app.post('/api/github/repos', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ error: "Token required" });

    try {
        const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            return res.status(response.status).json({ error: "Failed to fetch repositories" });
        }
        
        const repos = await response.json();
        // Return only what we need
        const formattedRepos = repos.map(r => ({
            id: r.id,
            name: r.name,
            full_name: r.full_name,
            private: r.private,
            clone_url: r.clone_url
        }));
        
        res.json({ repos: formattedRepos });
    } catch (err) {
        console.error('Fetch repos error:', err);
        res.status(500).json({ error: "Server error fetching repos" });
    }
});

// 4. Clone repository
app.post('/api/github/clone', (req, res) => {
    const { token, cloneUrl, repoName } = req.body;
    if (!token || !cloneUrl) return res.status(400).json({ error: "Token and cloneUrl required" });

    // Insert the token into the clone URL for authentication
    const authUrl = cloneUrl.replace('https://', `https://oauth2:${token}@`);

    const tempDir = path.join(__dirname, 'temp_repos');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir);
    }
    
    // Generate a unique folder name to avoid collisions
    const folderName = `${repoName.replace('/', '_')}_${crypto.randomBytes(4).toString('hex')}`;
    const clonePath = path.join(tempDir, folderName);

    console.log(`Cloning repository into ${clonePath}`);
    
    const { exec } = require('child_process');
    exec(`git clone ${authUrl} "${clonePath}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error cloning repo: ${error.message}`);
            return res.status(500).json({ error: "Failed to clone repository." });
        }
        res.json({ message: "Repository cloned successfully", path: clonePath });
    });
});

app.listen(port, () => {
    console.log(`Backend sidecar server running on http://localhost:${port}`);
});
