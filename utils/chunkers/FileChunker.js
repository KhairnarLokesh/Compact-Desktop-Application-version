const fs = require('fs');
const CodeChunk = require('./CodeChunk');

class FileChunker {
    constructor(maxChunkLines = 500, smallFileThreshold = 800) {
        this.maxChunkLines = maxChunkLines;
        this.smallFileThreshold = smallFileThreshold;
    }

    shouldChunk(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n');
            return lines.length > this.smallFileThreshold;
        } catch (error) {
            return false;
        }
    }

    chunkFile(filePath) {
        let content;
        try {
            content = fs.readFileSync(filePath, 'utf-8');
        } catch (error) {
            return [new CodeChunk({
                filePath,
                startLine: 1,
                endLine: 1,
                content: `ERROR: Cannot read file: ${error.message}`,
                chunkType: 'error'
            })];
        }

        const lines = content.split(/(?<=\n)/);

        if (lines.length <= this.smallFileThreshold) {
            return [new CodeChunk({
                filePath,
                startLine: 1,
                endLine: lines.length,
                content,
                chunkType: 'full_file'
            })];
        }

        return this._chunkByStructure(filePath, lines);
    }

    _chunkByStructure(filePath, lines) {
        // Fallback for unspecialized languages
        return this._chunkByLines(filePath, lines);
    }

    _chunkByLines(filePath, lines) {
        const chunks = [];
        const numChunks = Math.ceil(lines.length / this.maxChunkLines);

        for (let i = 0; i < numChunks; i++) {
            const startIdx = i * this.maxChunkLines;
            const endIdx = Math.min((i + 1) * this.maxChunkLines, lines.length);
            const chunkContent = lines.slice(startIdx, endIdx).join('');
            
            chunks.push(new CodeChunk({
                filePath,
                startLine: startIdx + 1,
                endLine: endIdx,
                content: chunkContent,
                chunkType: 'line_chunk',
                name: `chunk_${i + 1}`
            }));
        }
        return chunks;
    }
    
    _findIndentedBlockEnd(lines, startLine) {
        if (startLine > lines.length) return lines.length;
        
        const defLine = lines[startLine - 1];
        const baseIndent = defLine.length - defLine.trimStart().length;
        
        for (let i = startLine; i < lines.length; i++) {
            const line = lines[i];
            const stripped = line.trimStart();
            
            if (!stripped || stripped.startsWith('//') || stripped.startsWith('#')) {
                continue;
            }
            
            const currentIndent = line.length - stripped.length;
            if (currentIndent <= baseIndent) {
                return i; // 1-indexed line number
            }
        }
        return lines.length;
    }

    _splitLargeStructure(filePath, struct, structLines, typeName) {
        const chunks = [];
        const numSubChunks = Math.ceil(structLines.length / this.maxChunkLines);
        
        for (let i = 0; i < numSubChunks; i++) {
            const startIdx = i * this.maxChunkLines;
            const endIdx = Math.min((i + 1) * this.maxChunkLines, structLines.length);
            
            const chunkContent = structLines.slice(startIdx, endIdx).join('');
            chunks.push(new CodeChunk({
                filePath,
                startLine: struct.startLine + startIdx,
                endLine: struct.startLine + endIdx - 1,
                content: chunkContent,
                chunkType: `${typeName}_part`,
                name: `${struct.name}_part${i+1}`
            }));
        }
        return chunks;
    }
}

module.exports = FileChunker;
