const fs = require('fs');
const path = require('path');

// Store the database inside the project directory
const DB_PATH = path.join(__dirname, 'vector_db.json');

let vectorStore = [];

function setupIndex() {
    if (fs.existsSync(DB_PATH)) {
        try {
            const data = fs.readFileSync(DB_PATH, 'utf-8');
            vectorStore = JSON.parse(data);
            console.log(`Loaded ${vectorStore.length} chunks from local vector database.`);
        } catch (e) {
            console.error("Failed to load local DB:", e.message);
            vectorStore = [];
        }
    } else {
        console.log("Initialized empty local vector database.");
        vectorStore = [];
    }
}

async function indexChunk(chunk, embedding = null) {
    const doc = {
        filePath: chunk.filePath,
        startLine: chunk.startLine,
        endLine: chunk.endLine,
        content: chunk.content,
        chunkType: chunk.chunkType,
        embedding: embedding
    };
    
    vectorStore.push(doc);
}

function saveIndex() {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify(vectorStore));
        console.log(`Saved ${vectorStore.length} chunks to local vector database.`);
    } catch (e) {
        console.error("Failed to save local DB:", e.message);
    }
}

function clearIndex() {
    vectorStore = [];
}

// Compute mathematical cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function searchRelevantContext(queryText, queryEmbedding = null, topK = 5) {
    if (vectorStore.length === 0) {
        return [];
    }

    if (!queryEmbedding) {
        // Basic fallback: simple text matching
        const lowerQuery = queryText.toLowerCase();
        return vectorStore
            .filter(doc => doc.content.toLowerCase().includes(lowerQuery))
            .slice(0, topK);
    }

    // Perform vector similarity search
    const results = [];
    for (const doc of vectorStore) {
        if (!doc.embedding) continue;
        const score = cosineSimilarity(queryEmbedding, doc.embedding);
        results.push({ doc, score });
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    // Return the docs of the top K results
    return results.slice(0, topK).map(r => r.doc);
}

module.exports = {
    setupIndex,
    indexChunk,
    searchRelevantContext,
    saveIndex,
    clearIndex
};
