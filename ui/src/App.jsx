import React, { useState, useEffect } from 'react';
import { auth, githubProvider } from './firebase';
import { onAuthStateChanged, signOut, signInWithPopup, linkWithPopup, GithubAuthProvider } from 'firebase/auth';
import Auth from './Auth';
import compactLogo from './assets/compact_logo.png';
import { 
  FolderGit2, 
  Search, 
  ShieldAlert, 
  Settings, 
  Terminal, 
  MessageSquare,
  Play,
  FileCode2,
  ChevronRight,
  ChevronDown,
  Download,
  Activity,
  Cpu,
  User
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [model, setModel] = useState('qwen2.5-coder:7b');
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [repoPath, setRepoPath] = useState('.');
  const [folderItems, setFolderItems] = useState([]);
  const [chatMessages, setChatMessages] = useState([
    { role: 'agent', content: "Hello! I am your local AI Code Reviewer. Select a folder and run a full audit to begin." }
  ]);
  const [scanStats, setScanStats] = useState({ files: 0, lines: 0, chunks: 0 });
  const [consoleLogs, setConsoleLogs] = useState([{ time: new Date().toLocaleTimeString(), type: 'INFO', text: 'System initialized. Waiting for commands...' }]);
  const [findings, setFindings] = useState([]);
  const [isReviewing, setIsReviewing] = useState(false);

  const addLog = (type, text) => {
    setConsoleLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), type, text }]);
  };
  const [inputValue, setInputValue] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isHotspotsOpen, setIsHotspotsOpen] = useState(true);

  const [githubToken, setGithubToken] = useState(null);
  const [githubRepos, setGithubRepos] = useState([]);
  
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    let token = urlParams.get('github_token');
    const error = urlParams.get('error');
    
    if (token) {
      localStorage.setItem('github_token', token);
      window.history.replaceState({}, document.title, "/");
    } else {
      token = localStorage.getItem('github_token');
    }

    if (token) {
      setGithubToken(token);
      fetch('http://localhost:3001/api/github/repos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      .then(res => res.json())
      .then(data => {
        if (data.repos) setGithubRepos(data.repos);
      })
      .catch(err => console.error('Error fetching repos:', err));
    } else if (error) {
      console.error('GitHub Auth Error:', error);
      addLog('ERROR', 'Failed to authenticate with GitHub.');
    }
  }, []);

  const handleGithubLink = async () => {
    try {
      let credential;
      try {
        let result;
        if (auth.currentUser) {
          result = await linkWithPopup(auth.currentUser, githubProvider);
        } else {
          result = await signInWithPopup(auth, githubProvider);
        }
        credential = GithubAuthProvider.credentialFromResult(result);
      } catch (err) {
        if (err.code === 'auth/credential-already-in-use' || err.code === 'auth/provider-already-linked') {
          const result = await signInWithPopup(auth, githubProvider);
          credential = GithubAuthProvider.credentialFromResult(result);
        } else {
          throw err;
        }
      }

      if (credential && credential.accessToken) {
        localStorage.setItem('github_token', credential.accessToken);
        setGithubToken(credential.accessToken);
        
        fetch('http://localhost:3001/api/github/repos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: credential.accessToken })
        })
        .then(res => res.json())
        .then(data => {
          if (data.repos) setGithubRepos(data.repos);
          addLog('SUCCESS', 'GitHub account linked successfully.');
        })
        .catch(err => console.error('Error fetching repos:', err));
      }
    } catch (error) {
      console.error("Github linking error:", error);
      addLog('ERROR', `Failed to link GitHub account: ${error.message || error.code || 'Unknown error'}`);
    }
  };

  const handleCloneRepo = async (cloneUrl, repoName) => {
    if (!githubToken || !cloneUrl) return;
    setIsScanning(true);
    addLog('INFO', `Cloning GitHub repository: ${repoName}...`);
    try {
      const response = await fetch('http://localhost:3001/api/github/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken, cloneUrl, repoName })
      });
      const data = await response.json();
      if (data.path) {
        setRepoPath(data.path);
        addLog('SUCCESS', `Repository cloned successfully.`);
      } else {
        addLog('ERROR', data.error || 'Failed to clone repository.');
      }
    } catch (err) {
      console.error("Clone error:", err);
      addLog('ERROR', 'Error communicating with backend during clone.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSelectFolder = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/select-folder');
      const data = await response.json();
      if (data.path) {
        setRepoPath(data.path);
      }
    } catch (err) {
      console.error("Failed to select folder:", err);
    }
  };

  React.useEffect(() => {
    if (repoPath !== '.') {
      fetch('http://localhost:3001/api/list-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath })
      })
      .then(res => res.json())
      .then(data => {
        if (data.files) setFolderItems(data.files);
      })
      .catch(err => console.error(err));
    } else {
      setFolderItems([]);
    }
  }, [repoPath]);

  const handleRunAudit = async () => {
    setIsScanning(true);
    addLog('INFO', `Starting full audit on ${repoPath}...`);
    try {
      const response = await fetch('http://localhost:3001/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoPath: repoPath })
      });
      const data = await response.json();
      setScanStats({ files: data.stats.filesIndexed, lines: data.stats.totalLines, chunks: data.stats.totalChunks });
      addLog('SUCCESS', `Scan complete. Indexed ${data.stats.filesIndexed} files and ${data.stats.totalChunks} chunks.`);
      
      setIsReviewing(true);
      addLog('INFO', `Analyzing codebase for vulnerabilities using AI...`);
      const reviewResponse = await fetch('http://localhost:3001/api/review-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: model })
      });
      
      if (!reviewResponse.ok) {
        addLog('ERROR', "Analysis request failed.");
        throw new Error('Analysis request failed');
      }

      const reader = reviewResponse.body.getReader();
      const decoder = new TextDecoder();
      setFindings('');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkText = decoder.decode(value, { stream: true });
        setFindings(prev => prev + chunkText);
      }
      
      addLog('SUCCESS', `Analysis complete.`);
    } catch (error) {
      console.error("Scan error:", error);
      addLog('ERROR', "Error running audit. Make sure the backend is running.");
    } finally {
      setIsScanning(false);
      setIsReviewing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const newUserMessage = { role: 'user', content: inputValue };
    const newMessages = [...chatMessages, newUserMessage];
    setChatMessages(newMessages);
    setInputValue('');
    
    setChatMessages(prev => [...prev, { role: 'agent', content: '' }]);

    try {
      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, model: model, useRAG: true })
      });

      if (!response.ok) throw new Error('Network error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let agentContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        agentContent += decoder.decode(value, { stream: true });
        
        setChatMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'agent', content: agentContent };
          return updated;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'agent', content: 'Error communicating with the backend.' };
        return updated;
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#10b981] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={() => {}} />;
  }

  return (
    <div className="flex h-screen w-full bg-[#0a0a0a] text-[#f3f4f6] font-sans selection:bg-[#ffffff]/10">
      
      {/* COLUMN 1: LEFT SIDEBAR */}
      <div className={`flex border-r border-[#222222] bg-[#111111] z-10 flex-shrink-0 transition-[width] duration-300 ease-in-out ${isExplorerOpen ? 'w-80' : 'w-14'} overflow-hidden`}>
        
        {/* Activity Bar */}
        <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 border-r border-[#222222] bg-[#0a0a0a] z-20">
          <div className="flex flex-col gap-6 flex-1">
            <button 
              onClick={() => setIsExplorerOpen(!isExplorerOpen)}
              className={`transition-colors ${isExplorerOpen ? 'text-[#f3f4f6]' : 'text-[#9ca3af] hover:text-[#f3f4f6]'}`}
            >
              <FolderGit2 size={24} strokeWidth={1.5} />
            </button>
            <button className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"><Search size={24} strokeWidth={1.5} /></button>
            <button className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors relative">
              <ShieldAlert size={24} strokeWidth={1.5} />
              <span className="absolute -top-1 -right-1 bg-[#f3f4f6] text-[#0a0a0a] text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">3</span>
            </button>
            <button className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"><Activity size={24} strokeWidth={1.5} /></button>
          </div>
          <div className="flex flex-col gap-6">
            <button className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors" title="Settings"><Settings size={24} strokeWidth={1.5} /></button>
            <button onClick={() => { localStorage.removeItem('github_token'); signOut(auth); }} className="text-[#9ca3af] hover:text-red-400 transition-colors" title="Sign Out"><User size={24} strokeWidth={1.5} /></button>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="w-[264px] flex flex-col flex-shrink-0">
          <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#9ca3af] border-b border-[#222222] flex justify-between items-center">
            Explorer
            <span className="bg-[#161616] text-[#9ca3af] text-[10px] px-2 py-0.5 rounded capitalize font-medium border border-[#222222]">Safe</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            <div className="mb-2">
              <div className="flex items-center text-sm text-[#f3f4f6] font-medium py-1 px-2 hover:bg-[#222222] rounded cursor-pointer group">
                <ChevronDown size={16} className="mr-1 text-[#9ca3af] group-hover:text-white transition-colors" />
                <span className="truncate" title={repoPath}>
                  {repoPath !== '.' ? repoPath.split('\\').pop().toUpperCase() : 'NO FOLDER SELECTED'}
                </span>
              </div>
              <div className="pl-6 flex flex-col mt-1">
                {folderItems.length > 0 ? (
                  folderItems.map((item, idx) => (
                    <FileItem 
                      key={idx} 
                      name={item.name} 
                      type={item.isDirectory ? 'folder' : 'file'} 
                      icon={!item.isDirectory ? <FileCode2 size={14} className="text-[#9ca3af]" /> : null} 
                    />
                  ))
                ) : (
                  <div className="text-xs text-[#6b7280] py-2">Select a folder to view files</div>
                )}
              </div>
            </div>
            
            <div className="mt-6">
              <div 
                className="flex items-center text-sm text-[#f3f4f6] font-medium py-1 px-2 hover:bg-[#222222] rounded cursor-pointer group"
                onClick={() => setIsHotspotsOpen(!isHotspotsOpen)}
              >
                {isHotspotsOpen ? (
                  <ChevronDown size={16} className="mr-1 text-[#9ca3af]" />
                ) : (
                  <ChevronRight size={16} className="mr-1 text-[#9ca3af]" />
                )}
                <span>Security Hotspots</span>
              </div>
              {isHotspotsOpen && (
                <div className="pl-6 flex flex-col mt-1 space-y-1">
                  <IssueItem title="Hardcoded Secret in auth.ts" severity="high" />
                  <IssueItem title="Unsanitized Input in search" severity="medium" />
                  <IssueItem title="Inefficient React render" severity="low" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Top Header / Breadcrumbs */}
        <div className="h-12 border-b border-[#222222] flex items-center px-4 justify-between bg-[#111111] gap-4">
          <div className="flex items-center text-sm text-[#9ca3af] min-w-0 flex-1">
            <span className="truncate flex-shrink-0 max-w-[200px]">{repoPath !== '.' ? repoPath.split(/[\\/]/).pop() : 'No Project Selected'}</span>
            {repoPath !== '.' && (
              <>
                <ChevronRight size={14} className="mx-1 flex-shrink-0" />
                <span className="text-[#f3f4f6] text-xs truncate flex-1">{repoPath}</span>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-3 flex-shrink-0">
            {!githubToken ? (
              <button 
                onClick={handleGithubLink}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#161616] text-[#9ca3af] hover:bg-[#222222] border border-[#222222] transition-colors rounded text-sm font-medium"
              >
                <FolderGit2 size={14} />
                Login to GitHub
              </button>
            ) : (
              <select 
                onChange={(e) => {
                  const repo = githubRepos.find(r => r.clone_url === e.target.value);
                  if (repo) handleCloneRepo(repo.clone_url, repo.full_name);
                }}
                className="px-3 py-1.5 bg-[#161616] text-[#9ca3af] hover:bg-[#222222] border border-[#222222] transition-colors rounded text-sm font-medium max-w-[200px]"
                defaultValue=""
              >
                <option value="" disabled>Select GitHub Repo...</option>
                {githubRepos.map(repo => (
                  <option key={repo.id} value={repo.clone_url}>{repo.full_name}</option>
                ))}
              </select>
            )}
            <button 
              onClick={handleSelectFolder}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#161616] text-[#9ca3af] hover:bg-[#222222] border border-[#222222] transition-colors rounded text-sm font-medium"
            >
              <FolderGit2 size={14} />
              Open Folder
            </button>
            <button 
              onClick={handleRunAudit}
              disabled={isScanning || repoPath === '.'}
              className={`flex items-center gap-2 px-3 py-1.5 ${isScanning || repoPath === '.' ? 'bg-[#10b981]/10 text-[#10b981]/50 cursor-not-allowed' : 'bg-[#161616] text-[#9ca3af] hover:bg-[#10b981]/20'} border border-[#222222] transition-colors rounded text-sm font-medium`}
            >
              <Play size={14} fill="currentColor" className={isScanning ? 'animate-pulse' : ''} />
              {isScanning ? 'Auditing...' : 'Run Full Audit'}
            </button>
            <button className="p-1.5 text-[#9ca3af] hover:text-[#f3f4f6] rounded border border-[#222222] hover:border-[#9ca3af] transition-all">
              <Download size={16} />
            </button>
            <div className="w-[1px] h-4 bg-[#222222] mx-1"></div>
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex items-center justify-center w-7 h-7 rounded border transition-colors ${isChatOpen ? 'bg-[#222222] text-[#f3f4f6] border-[#222222]' : 'bg-[#161616] border-[#222222] text-[#9ca3af] hover:text-[#f3f4f6] hover:border-[#9ca3af]'}`}
              title="Toggle AI Agent Panel"
            >
              <MessageSquare size={14} />
            </button>
            <button className="flex items-center justify-center w-7 h-7 rounded-full bg-[#161616] border border-[#222222] text-[#9ca3af] hover:text-[#f3f4f6]">
              <User size={14} />
            </button>
          </div>
        </div>

        {/* Editor Tabs */}
        <div className="flex border-b border-[#222222] bg-[#0a0a0a] overflow-x-auto hide-scrollbar">
          <Tab active title="Dashboard" icon={<Activity size={14} className="text-[#f3f4f6]" />} />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto space-y-6">
            
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3 text-[#f3f4f6]">
                  <img src={compactLogo} alt="Compact Logo" className="w-9 h-9 object-contain" /> 
                  Compact Security Audit
                </h1>
                <p className="text-[#9ca3af]">Local-First AI Code Review • Analysis completed in 1.2s</p>
              </div>
              <div className="flex gap-4">
                <MetricCard title="Files Scanned" value={scanStats.files} color="text-[#f3f4f6]" />
                <MetricCard title="Lines of Code" value={scanStats.lines} color="text-[#f3f4f6]" />
                <MetricCard title="Chunks Indexed" value={scanStats.chunks} color="text-[#f3f4f6]" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-md overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between bg-[#111111]">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-[#f3f4f6]">
                  <ShieldAlert className="text-[#f3f4f6]" size={18} />
                  Critical Findings
                </h3>
                <div className="flex items-center gap-3">
                  {typeof findings === 'string' && findings.length > 0 && (
                    <button 
                      onClick={() => {
                        const blob = new Blob([findings], { type: 'text/markdown' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'Audit_Report.md';
                        a.click();
                      }}
                      className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981]/20 border border-[#10b981]/20 transition-colors rounded text-xs font-medium flex items-center gap-1"
                    >
                      <Download size={12} /> Download Report
                    </button>
                  )}
                  {isReviewing && <span className="text-[#9ca3af] text-sm animate-pulse">AI is analyzing...</span>}
                </div>
              </div>
              
              {typeof findings === 'string' && findings.length > 0 ? (
                <div className="p-6 bg-[#0a0a0a] text-sm text-[#f3f4f6] font-mono whitespace-pre-wrap max-h-[600px] overflow-y-auto leading-relaxed">
                  {findings}
                </div>
              ) : Array.isArray(findings) && findings.length > 0 ? (
                <div className="flex flex-col">
                  {findings.map((f, i) => (
                    <FindingItem key={i} file={f.file} line={f.line} issue={f.issue} suggestion={f.suggestion} severity={f.severity || 'high'} />
                  ))}
                </div>
              ) : (
                <div className="p-6 text-sm text-[#9ca3af] text-center">
                  {isReviewing ? "Waiting for AI analysis to complete..." : "No critical findings detected yet. Click 'Run Full Audit' to begin."}
                </div>
              )}
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-md p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[#f3f4f6]">
                <Terminal size={18} className="text-[#9ca3af]" />
                System Console
              </h3>
              <div className="bg-[#0a0a0a] p-4 rounded border border-[#222222] font-mono text-sm text-[#9ca3af] space-y-1 h-48 overflow-y-auto">
                {consoleLogs.map((log, i) => (
                  <p key={i}>[{log.time}] <span className={log.type === 'SUCCESS' ? 'text-[#10b981]' : log.type === 'ERROR' ? 'text-red-500' : 'text-[#9ca3af]'}>{log.type}</span> {log.text}</p>
                ))}
                <p className="text-[#f3f4f6] animate-pulse">_</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* COLUMN 3: RIGHT AGENT PANEL */}
      <div className={`bg-[#111111] flex flex-col z-10 flex-shrink-0 transition-[width,border] duration-300 ease-in-out ${isChatOpen ? 'w-96 border-l border-[#222222]' : 'w-0 border-l-0'} overflow-hidden`}>
        <div className="w-96 flex flex-col h-full flex-shrink-0">
          <div className="px-5 py-4 border-b border-[#222222] flex justify-between items-center bg-[#111111]">
          <div className="flex items-center gap-2">
            <img src={compactLogo} alt="Compact Logo" className="w-5 h-5 object-contain" />
            <span className="font-semibold text-sm tracking-wide text-[#f3f4f6]">Compact AI Agent</span>
          </div>
          
          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-2 text-xs border border-[#222222] bg-[#161616] px-2 py-1 rounded text-[#9ca3af] hover:border-[#9ca3af] hover:text-[#f3f4f6] transition-colors">
              <Cpu size={12} />
              {model}
              <ChevronDown size={12} />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg, index) => (
            <ChatMessage 
              key={index}
              role={msg.role} 
              message={msg.content} 
            />
          ))}
        </div>

        <div className="p-4 border-t border-[#222222] bg-[#111111]">
          <div className="relative">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about your codebase..." 
              className="w-full bg-[#161616] border border-[#222222] rounded-md pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-[#9ca3af] transition-all text-[#f3f4f6] placeholder-[#9ca3af]"
            />
            <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors">
              <Play size={16} className="rotate-90" />
            </button>
          </div>
          <div className="flex justify-between items-center mt-2 px-1 text-[10px] text-[#9ca3af]">
            <span>Local Inference Active</span>
            <span className="flex items-center gap-1 text-[#9ca3af]"><div className="w-1.5 h-1.5 rounded-full bg-[#9ca3af] animate-pulse"></div> Ollama Online</span>
          </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Subcomponents for cleaner code
const FileItem = ({ name, type, icon, nested }) => (
  <div className={`flex items-center gap-2 py-1 px-2 text-sm text-[#9ca3af] hover:bg-[#222222] hover:text-[#f3f4f6] rounded cursor-pointer ${nested ? 'ml-3 border-l border-[#222222] pl-2' : ''}`}>
    {icon ? icon : (type === 'folder' ? <ChevronRight size={14} /> : <div className="w-3.5" />)}
    <span className="truncate">{name}</span>
  </div>
);

const IssueItem = ({ title, severity }) => (
  <div className="flex items-center justify-between py-1.5 px-2 text-xs text-[#9ca3af] hover:bg-[#222222] rounded cursor-pointer border-l-2 border-transparent hover:border-[#222222] transition-all">
    <span className="truncate pr-2">{title}</span>
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${severity === 'high' ? 'bg-[#f3f4f6]' : severity === 'medium' ? 'bg-[#9ca3af]' : 'bg-[#4b5563]'}`} />
  </div>
);

const Tab = ({ active, title, icon }) => (
  <div className={`flex items-center gap-2 px-4 py-2 border-r border-[#222222] cursor-pointer text-sm transition-colors ${active ? 'bg-[#111111] text-[#f3f4f6] border-t-2 border-t-[#f3f4f6]' : 'text-[#9ca3af] hover:bg-[#161616] hover:text-[#f3f4f6] border-t-2 border-t-transparent'}`}>
    {icon}
    {title}
  </div>
);

const MetricCard = ({ title, value, color }) => (
  <div className="bg-[#161616] border border-[#222222] rounded p-3 min-w-[120px]">
    <div className="text-xs text-[#9ca3af] mb-1">{title}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

const FindingItem = ({ file, line, issue, suggestion, severity }) => (
  <div className="border-b border-[#222222] p-4 last:border-b-0 hover:bg-[#161616] transition-colors">
    <div className="flex items-start justify-between mb-2">
      <div className="flex items-center gap-2 text-sm font-mono text-[#9ca3af]">
        <FileCode2 size={14} />
        {file} <span className="text-[#6b7280]">:{line}</span>
      </div>
      <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#161616] text-[#f3f4f6] border border-[#222222]">
        High Severity
      </span>
    </div>
    <div className="text-[#f3f4f6] font-medium text-sm mb-1">{issue}</div>
    <div className="text-sm text-[#9ca3af]">{suggestion}</div>
  </div>
);

const ChatMessage = ({ role, message }) => (
  <div className={`flex gap-3 ${role === 'user' ? 'flex-row-reverse' : ''}`}>
    <div className={`w-8 h-8 flex-shrink-0 rounded flex items-center justify-center ${role === 'agent' ? 'bg-[#161616] border border-[#222222] text-[#f3f4f6]' : 'bg-[#222222] text-[#f3f4f6]'}`}>
      {role === 'agent' ? <img src={compactLogo} alt="Agent" className="w-4 h-4 object-contain opacity-80" /> : <User size={16} />}
    </div>
    <div className={`flex-1 rounded p-3 text-sm ${role === 'agent' ? 'bg-[#161616] border border-[#222222] text-[#f3f4f6]' : 'bg-[#222222] text-[#f3f4f6]'}`}>
      <div className="whitespace-pre-wrap leading-relaxed">{message}</div>
    </div>
  </div>
);
