const FileChunker = require('./FileChunker');
const CodeChunk = require('./CodeChunk');

class JSChunker extends FileChunker {
    constructor(maxChunkLines, smallFileThreshold) {
        super(maxChunkLines, smallFileThreshold);
        this.FUNCTION_RE = /^(?:async\s+)?(?:export\s+)?(?:function\s+|const\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]+)\s*=>|let\s+\w+\s*=\s*(?:async\s+)?(?:\([^)]*\)|[^=]+)\s*=>)/m;
        this.CLASS_RE = /^(?:export\s+)?(?:default\s+)?class\s+(\w+)/m;
    }

    _chunkByStructure(filePath, lines) {
        const chunks = [];
        const content = lines.join('');
        const structures = [];

        // Simplified JS parsing using regex for top-level structures
        const functionRegex = new RegExp(this.FUNCTION_RE, 'g');
        const classRegex = new RegExp(this.CLASS_RE, 'g');
        
        let match;
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const startPos = match.index;
            const lineNum = content.slice(0, startPos).split('\n').length;
            const endLine = this._findBraceEnd(lines, lineNum);
            
            structures.push({ name: className, startLine: lineNum, endLine, type: 'class' });
        }
        
        while ((match = functionRegex.exec(content)) !== null) {
            const funcName = match[0].match(/function\s+(\w+)|(?:const|let)\s+(\w+)/);
            const name = funcName ? (funcName[1] || funcName[2]) : 'anonymous';
            const startPos = match.index;
            const lineNum = content.slice(0, startPos).split('\n').length;
            
            const insideClass = structures.some(s => s.type === 'class' && s.startLine < lineNum && lineNum <= s.endLine);
            
            if (!insideClass) {
                const endLine = this._findBraceEnd(lines, lineNum);
                structures.push({ name, startLine: lineNum, endLine, type: 'function' });
            }
        }
        
        structures.sort((a, b) => a.startLine - b.startLine);
        
        if (structures.length === 0) {
            return this._chunkByLines(filePath, lines);
        }

        if (structures[0].startLine > 1) {
            const headerContent = lines.slice(0, structures[0].startLine - 1).join('');
            if (headerContent.trim()) {
                chunks.push(new CodeChunk({
                    filePath, startLine: 1, endLine: structures[0].startLine - 1,
                    content: headerContent, chunkType: 'header', name: 'module_header'
                }));
            }
        }

        for (let i = 0; i < structures.length; i++) {
            const struct = structures[i];
            const structLines = lines.slice(struct.startLine - 1, struct.endLine);
            
            if (structLines.length > this.maxChunkLines * 2) {
                chunks.push(...this._splitLargeStructure(filePath, struct, structLines, struct.type));
            } else {
                let contextEnd = struct.endLine;
                if (i + 1 < structures.length) {
                    const nextStart = structures[i+1].startLine;
                    const contextLines = Math.min(10, nextStart - struct.endLine - 1);
                    contextEnd = struct.endLine + contextLines;
                }
                const chunkContent = lines.slice(struct.startLine - 1, contextEnd).join('');
                chunks.push(new CodeChunk({
                    filePath, startLine: struct.startLine, endLine: contextEnd,
                    content: chunkContent, chunkType: struct.type, name: struct.name
                }));
            }
        }
        
        const lastEnd = structures[structures.length - 1].endLine;
        if (lastEnd < lines.length) {
            const footerContent = lines.slice(lastEnd).join('');
            if (footerContent.trim()) {
                chunks.push(new CodeChunk({
                    filePath, startLine: lastEnd + 1, endLine: lines.length,
                    content: footerContent, chunkType: 'footer', name: 'module_footer'
                }));
            }
        }

        return chunks;
    }

    _findBraceEnd(lines, startLine) {
        let braceCount = 0;
        let inStructure = false;
        
        for (let i = startLine - 1; i < lines.length; i++) {
            const line = lines[i];
            for (const char of line) {
                if (char === '{') {
                    braceCount++;
                    inStructure = true;
                } else if (char === '}') {
                    braceCount--;
                    if (inStructure && braceCount === 0) {
                        return i + 1;
                    }
                }
            }
        }
        return Math.min(startLine + 100, lines.length);
    }
}

module.exports = JSChunker;
