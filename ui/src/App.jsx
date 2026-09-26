import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [model, setModel] = useState('codegemma:7b');
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(true);

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
            <button className="text-[#9ca3af] hover:text-[#f3f4f6] transition-colors"><Settings size={24} strokeWidth={1.5} /></button>
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
                <span className="truncate">COMPACT-DESKTOP-APP</span>
              </div>
              <div className="pl-6 flex flex-col mt-1">
                <FileItem name="src" type="folder" />
                <FileItem name="components" type="folder" nested />
                <FileItem name="App.tsx" type="file" icon={<FileCode2 size={14} className="text-[#9ca3af]" />} nested />
                <FileItem name="backend" type="folder" />
                <FileItem name="README.md" type="file" icon={<FileCode2 size={14} className="text-[#9ca3af]" />} />
                <FileItem name="package.json" type="file" icon={<FileCode2 size={14} className="text-[#9ca3af]" />} />
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex items-center text-sm text-[#f3f4f6] font-medium py-1 px-2 hover:bg-[#222222] rounded cursor-pointer group">
                <ChevronDown size={16} className="mr-1 text-[#9ca3af]" />
                <span>Security Hotspots</span>
              </div>
              <div className="pl-6 flex flex-col mt-1 space-y-1">
                <IssueItem title="Hardcoded Secret in auth.ts" severity="high" />
                <IssueItem title="Unsanitized Input in search" severity="medium" />
                <IssueItem title="Inefficient React render" severity="low" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COLUMN 2: MAIN WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#0a0a0a]">
        {/* Top Header / Breadcrumbs */}
        <div className="h-12 border-b border-[#222222] flex items-center px-4 justify-between bg-[#111111]">
          <div className="flex items-center text-sm text-[#9ca3af]">
            <span>compact-desktop-app</span>
            <ChevronRight size={14} className="mx-1" />
            <span>src</span>
            <ChevronRight size={14} className="mx-1" />
            <span className="text-[#f3f4f6]">App.tsx</span>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-[#161616] text-[#9ca3af] hover:bg-[#10b981]/20 border border-[#222222] transition-colors rounded text-sm font-medium">
              <Play size={14} fill="currentColor" />
              Run Full Audit
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
          <Tab active title="Dashboard.md" icon={<Activity size={14} className="text-[#f3f4f6]" />} />
          <Tab title="App.tsx" icon={<FileCode2 size={14} className="text-[#9ca3af]" />} />
          <Tab title="Security Report" icon={<ShieldAlert size={14} className="text-[#9ca3af]" />} />
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
                <MetricCard title="Health Score" value="84/100" color="text-[#f3f4f6]" />
                <MetricCard title="Vulnerabilities" value="3" color="text-[#f3f4f6]" />
                <MetricCard title="Code Smells" value="12" color="text-[#f3f4f6]" />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-md overflow-hidden">
              <div className="px-6 py-4 border-b border-[#222222] flex items-center justify-between bg-[#111111]">
                <h3 className="font-semibold text-lg flex items-center gap-2 text-[#f3f4f6]">
                  <ShieldAlert className="text-[#f3f4f6]" size={18} />
                  Critical Findings
                </h3>
              </div>
              <div className="p-0">
                <FindingItem 
                  file="src/auth/firebase.ts" 
                  line="L24" 
                  issue="Hardcoded API Key detected in source code."
                  suggestion="Move to environment variables (.env) and use import.meta.env.VITE_FIREBASE_KEY."
                  severity="high"
                />
                <FindingItem 
                  file="backend/db/query.js" 
                  line="L112" 
                  issue="Possible SQL Injection via unsanitized template literal."
                  suggestion="Use parameterized queries provided by the database driver."
                  severity="high"
                />
              </div>
            </div>

            <div className="bg-[#111111] border border-[#222222] rounded-md p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 text-[#f3f4f6]">
                <Terminal size={18} className="text-[#9ca3af]" />
                System Console
              </h3>
              <div className="bg-[#0a0a0a] p-4 rounded border border-[#222222] font-mono text-sm text-[#9ca3af] space-y-1">
                <p>[13:42:01] <span className="text-[#9ca3af]">INFO</span> Starting local Ollama engine...</p>
                <p>[13:42:02] <span className="text-[#9ca3af]">INFO</span> Connecting to Elasticsearch on port 9200...</p>
                <p>[13:42:02] <span className="text-[#f3f4f6]">SUCCESS</span> Elasticsearch connected. 248 documents indexed.</p>
                <p>[13:42:05] <span className="text-[#f3f4f6]">WARN</span> Rule engine found 3 critical vulnerabilities.</p>
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
          <ChatMessage 
            role="agent" 
            message="I've completed the security scan. I found 3 critical issues and some code smells. Would you like me to explain the hardcoded Firebase key issue?" 
          />
          <ChatMessage 
            role="user" 
            message="Yes, how do I fix it in React?" 
          />
          <ChatMessage 
            role="agent" 
            message="To secure your Firebase key in a Vite React app, you should:

1. Create a `.env.local` file in your root.
2. Add `VITE_FIREBASE_KEY=your_key_here`.
3. In your code, replace the string with `import.meta.env.VITE_FIREBASE_KEY`.

I can generate the patch for you if you'd like!" 
          />
        </div>

        <div className="p-4 border-t border-[#222222] bg-[#111111]">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask about your codebase..." 
              className="w-full bg-[#161616] border border-[#222222] rounded-md pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-[#9ca3af] transition-all text-[#f3f4f6] placeholder-[#9ca3af]"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[#9ca3af] hover:text-[#f3f4f6] transition-colors">
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
      {role === 'agent' ? <Cpu size={16} /> : <User size={16} />}
    </div>
    <div className={`flex-1 rounded p-3 text-sm ${role === 'agent' ? 'bg-[#161616] border border-[#222222] text-[#f3f4f6]' : 'bg-[#222222] text-[#f3f4f6]'}`}>
      <div className="whitespace-pre-wrap leading-relaxed">{message}</div>
    </div>
  </div>
);
