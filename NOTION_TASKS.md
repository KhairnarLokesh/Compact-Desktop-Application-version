# 📋 Compact - Group Work & Task Delegation (Notion Board)

Welcome to the Compact task tracking board! This document outlines the current sprint assignments for the team.

🔗 **GitHub Repository:** [KhairnarLokesh/Compact-Desktop-Application-version](https://github.com/KhairnarLokesh/Compact-Desktop-Application-version)
---

## 🎯 Current Sprint Assignments

### 🔐 Authentication & Database Operations
**👩‍💻 Vaishnavi Nikam (Authentication):**
- [ ] **Authentication Flow:** Implement secure user login, session management, and auth logic using Firebase Authentication.
- [ ] **Auth Security:** Ensure secure handling of authentication states and safe management of user sessions across the app.

**👩‍💻 Sneha More (Database):**
- [ ] **Database Setup:** Configure and implement the database using **Firebase** (Firestore/Realtime Database).
- [ ] **Data Security:** Ensure that Firebase Security Rules are properly configured and API keys are stored securely (e.g., via `.env`).
- [ ] **Database API Endpoints:** Write the frontend/backend services specifically for saving and retrieving user settings and past security audits from Firebase.

---

### 💬 Core Backend & Chat AI Integration
**Assignees:** 👨‍💻 Lokesh Khairnar & 👨‍💻 Kanhaiya Bagul

**Key Responsibilities:**
- [ ] **Chat Feature Implementation:** Build the backend logic to connect the React UI's AI Agent Chat panel with the local Ollama LLM.
- [ ] **Server Infrastructure:** Maintain the core Express.js backend server and manage Inter-Process Communication (IPC) bridging with Electron.
- [ ] **LLM Orchestration:** Set up the prompt templates, context handling, and Retrieval-Augmented Generation (RAG) pipelines for the chat feature.
- [ ] **System Integration:** Wire up the frontend API calls for chat, audit triggers, and real-time streaming back to the UI.

---

## 📌 Notes & Coordination
*   **Standups:** Ensure the frontend and backend implementations are aligned by communicating API contracts before coding.
*   **Git Workflow:** 
    *   Please make a **separate branch** for your work (e.g., `feat/auth-firebase` or `feat/chat-backend`). 
    *   Do **NOT** push directly to `main`. 
    *   Once your task is completed, push your branch and **raise a Pull Request (PR)** for review before merging.
