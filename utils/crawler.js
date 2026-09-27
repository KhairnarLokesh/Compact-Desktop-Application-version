const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.ai-code-reviewer', '__pycache__', '.venv', '.reviewer-log']);
const ALLOWED_EXTS = new Set([
    // JS/TS
    '.js', '.jsx', '.ts', '.tsx', 
    // Python
    '.py', 
    // C/C++
    '.c', '.cpp', '.h', '.hpp', '.cc', '.cxx', 
    // Java
    '.java', 
    // Other
    '.md', '.css', '.html', '.sh', '.bash', '.go', '.rs'
]);

const EXCLUDED_EXTS = new Set([
    '.in', '.ok', '.out', '.err', '.txt', '.log', '.dat', '.data',
    '.expected', '.actual', '.diff', '.orig', '.rej', '.bak',
    '.golden', '.baseline', '.result', '.output', '.input'
]);

function isGitIgnored(repoRoot, filePath) {
    if (filePath.includes('/.git/') || filePath === '.git') {
        return true;
    }
    try {
        execSync(`git -C "${repoRoot}" check-ignore -q "${filePath}"`, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

function countLines(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return content.split('\n').length;
    } catch (e) {
        return 0;
    }
}

function walkDirectory(dir, repoRoot = dir) {
    let files = [];
    let items;
    
    try {
        items = fs.readdirSync(dir);
    } catch (e) {
        console.warn(`Could not read directory ${dir}: ${e.message}`);
        return files;
    }

    for (const item of items) {
        const fullPath = path.join(dir, item);
        const relPath = path.relative(repoRoot, fullPath).replace(/\\/g, '/');
        
        if (IGNORE_DIRS.has(item) || item.startsWith('.')) {
            // Keep .github etc? We just ignore typical hidden folders for now.
            if (item !== '.github' && item !== '.vscode') {
                continue;
            }
        }

        if (isGitIgnored(repoRoot, relPath)) {
            continue;
        }

        try {
            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) {
                files = files.concat(walkDirectory(fullPath, repoRoot));
            } else {
                const ext = path.extname(item).toLowerCase();
                if (EXCLUDED_EXTS.has(ext)) {
                    continue;
                }
                
                if (ALLOWED_EXTS.has(ext) || item === 'Makefile' || item === 'Dockerfile') {
                    files.push(fullPath);
                }
            }
        } catch (e) {
            console.warn(`Skipping ${fullPath}: ${e.message}`);
        }
    }
    return files;
}

function generateRepoStats(dir) {
    const files = walkDirectory(dir);
    let totalLines = 0;
    let fileCount = files.length;
    
    files.forEach(file => {
        totalLines += countLines(file);
    });
    
    return { files, fileCount, totalLines };
}

module.exports = { walkDirectory, generateRepoStats, countLines };
