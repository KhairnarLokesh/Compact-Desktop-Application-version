const path = require('path');
const CodeChunk = require('./chunkers/CodeChunk');
const FileChunker = require('./chunkers/FileChunker');
const JSChunker = require('./chunkers/JSChunker');
const PythonChunker = require('./chunkers/PythonChunker');

function getChunker(filePath, maxChunkLines = 50, smallFileThreshold = 50) {
    const ext = path.extname(filePath).toLowerCase();
    
    if (ext === '.js' || ext === '.jsx' || ext === '.ts' || ext === '.tsx') {
        return new JSChunker(maxChunkLines, smallFileThreshold);
    } else if (ext === '.py') {
        return new PythonChunker(maxChunkLines, smallFileThreshold);
    } else {
        return new FileChunker(maxChunkLines, smallFileThreshold);
    }
}

function formatChunkForReview(chunk, totalChunks, chunkNum) {
    let header = `=== CHUNK ${chunkNum}/${totalChunks}: ${chunk.filePath} ===\n`;
    if (chunk.name) {
        header += `[${chunk.chunkType}: ${chunk.name}]\n`;
    }
    header += `=== Lines ${chunk.startLine}-${chunk.endLine} (${chunk.lineCount} lines) ===\n\n`;
    return header + chunk.content;
}

module.exports = { FileChunker, getChunker, formatChunkForReview, CodeChunk };
