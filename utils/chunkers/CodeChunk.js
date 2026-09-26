class CodeChunk {
    constructor({ filePath, startLine, endLine, content, chunkType, name = null }) {
        this.filePath = filePath;
        this.startLine = startLine;
        this.endLine = endLine;
        this.content = content;
        this.chunkType = chunkType;
        this.name = name;
    }

    get lineCount() {
        return this.endLine - this.startLine + 1;
    }
}

module.exports = CodeChunk;
