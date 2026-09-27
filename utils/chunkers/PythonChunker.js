const FileChunker = require('./FileChunker');
const CodeChunk = require('./CodeChunk');

class PythonChunker extends FileChunker {
    constructor(maxChunkLines, smallFileThreshold) {
        super(maxChunkLines, smallFileThreshold);
        this.FUNCTION_RE = /^(?:async\s+)?def\s+(\w+)\s*\(/g;
        this.CLASS_RE = /^class\s+(\w+)(?:\([^)]*\))?\s*:/g;
    }

    _chunkByStructure(filePath, lines) {
        const chunks = [];
        const content = lines.join('');
        const structures = [];
        
        let match;
        while ((match = this.CLASS_RE.exec(content)) !== null) {
            const className = match[1];
            const startPos = match.index;
            const lineNum = content.slice(0, startPos).split('\n').length;
            const endLine = this._findIndentedBlockEnd(lines, lineNum);
            structures.push({ name: className, startLine: lineNum, endLine, type: 'class' });
        }
        
        while ((match = this.FUNCTION_RE.exec(content)) !== null) {
            const funcName = match[1];
            const startPos = match.index;
            const lineNum = content.slice(0, startPos).split('\n').length;
            
            const insideClass = structures.some(s => s.type === 'class' && s.startLine < lineNum && lineNum <= s.endLine);
            if (!insideClass) {
                const endLine = this._findIndentedBlockEnd(lines, lineNum);
                structures.push({ name: funcName, startLine: lineNum, endLine, type: 'function' });
            }
        }
        
        structures.sort((a, b) => a.startLine - b.startLine);
        
        if (structures.length === 0) return this._chunkByLines(filePath, lines);

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
                    contextEnd = struct.endLine + Math.min(10, nextStart - struct.endLine - 1);
                }
                chunks.push(new CodeChunk({
                    filePath, startLine: struct.startLine, endLine: contextEnd,
                    content: lines.slice(struct.startLine - 1, contextEnd).join(''),
                    chunkType: struct.type, name: struct.name
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
}

module.exports = PythonChunker;
