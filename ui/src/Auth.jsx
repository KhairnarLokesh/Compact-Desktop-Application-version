import React, { useState } from 'react';
import { auth, githubProvider } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GithubAuthProvider } from 'firebase/auth';
import compactLogo from './assets/compact_logo.png';
import { ShieldCheck, Zap, Code2 } from 'lucide-react';

const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
  </svg>
);

export default function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  const handleGithub = async () => {
    try {
      const result = await signInWithPopup(auth, githubProvider);
      const credential = GithubAuthProvider.credentialFromResult(result);
      if (credential && credential.accessToken) {
        localStorage.setItem('github_token', credential.accessToken);
      }
      if (onLogin) onLogin();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    }
  };

  return (
    <>
      <style>{`
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      <div className="w-full min-h-screen grid lg:grid-cols-2 bg-[#050505] text-white font-sans selection:bg-white/20">
        
        {/* LEFT PANEL - Branding & Features */}
        <div className="hidden lg:flex flex-col relative p-12 bg-[#0a0a0a] border-r border-[#222222] overflow-hidden">
          
          {/* Subtle Watermark Logo in Background */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 pointer-events-none flex items-center justify-center">
            <img src={compactLogo} alt="" className="w-full h-full object-contain filter grayscale" />
          </div>

          <div className="relative z-10 flex flex-col h-full">
            {/* Top Logo */}
            <div className="flex items-center gap-4">
              <img src={compactLogo} alt="Compact" className="w-12 h-12 object-contain" />
              <span className="font-semibold text-2xl tracking-tight">Compact AI.</span>
            </div>

            {/* Animated Content */}
            <div className="mt-auto mb-auto max-w-md">
              <h1 className="text-3xl font-semibold tracking-tight text-white mb-10 leading-snug">
                Analyze code locally. <br/> Fix vulnerabilities instantly.
              </h1>

              <div className="flex flex-col gap-12">
                {[
                  { icon: ShieldCheck, title: "100% Private Processing", desc: "Your proprietary code never leaves your local machine." },
                  { icon: Zap, title: "Lightning Fast Analysis", desc: "Powered by optimized local LLMs for immediate feedback." },
                  { icon: Code2, title: "Multi-Language Support", desc: "Analyze React, Python, Java, and dozens of other frameworks." },
                ].map((feature, i) => (
                  <div 
                    key={i} 
                    className="flex items-start gap-6 opacity-0 animate-[fade-in-up_0.6s_ease-out_forwards]"
                    style={{ animationDelay: `${0.2 + (i * 0.15)}s` }}
                  >
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-white shadow-lg mt-1">
                      <feature.icon size={26} strokeWidth={1.5} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl bg-clip-text text-transparent bg-[linear-gradient(110deg,#ffffff,45%,#52525b,55%,#ffffff)] bg-[length:250%_100%] animate-[shimmer_3s_linear_infinite]">{feature.title}</h3>
                      <p className="text-[#a1a1aa] text-base mt-2 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Bottom Footer Area */}
            <div className="text-sm text-[#71717a]">
              &copy; {new Date().getFullYear()} Compact AI. All rights reserved.
            </div>
          </div>
        </div>

        {/* RIGHT PANEL - Auth Form */}
        <div className="flex items-center justify-center p-8 bg-[#050505]">
          
          <div className="w-full max-w-[360px] flex flex-col">
            
            {/* Mobile Logo */}
            <div className="flex lg:hidden items-center gap-3 mb-12 self-start">
              <div className="bg-white p-1.5 rounded-md">
                <img src={compactLogo} alt="Compact" className="w-5 h-5 object-contain invert" />
              </div>
              <span className="font-semibold text-lg tracking-tight">Compact AI.</span>
            </div>

            <div className="flex flex-col text-center mb-8">
              <h1 className="text-2xl font-semibold tracking-tight text-white">
                {isLogin ? 'Login to your account' : 'Create an account'}
              </h1>
              <p className="text-sm text-[#a1a1aa] mt-2">
                {isLogin ? 'Enter your email below to login to your account' : 'Enter your email below to create your account'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-white">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#050505] border border-[#27272a] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-white placeholder-[#71717a]" 
                  placeholder="m@example.com"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-white">Password</label>
                  {isLogin && (
                    <a href="#" className="text-sm text-[#a1a1aa] hover:text-white transition-colors">
                      Forgot your password?
                    </a>
                  )}
                </div>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#050505] border border-[#27272a] rounded-md px-3 py-2.5 text-sm focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-all text-white placeholder-[#71717a]" 
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-red-400 text-sm mt-1">{error}</p>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-white text-black font-medium py-2.5 rounded-md hover:bg-[#e4e4e7] transition-colors mt-2 text-sm disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
              </button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#27272a]"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#050505] px-2 text-[#71717a]">Or continue with</span>
              </div>
            </div>

            <button 
              onClick={handleGithub}
              className="w-full bg-[#050505] border border-[#27272a] hover:bg-[#18181b] text-white font-medium py-2.5 rounded-md transition-colors flex justify-center items-center gap-2 text-sm"
            >
              <GithubIcon />
              {isLogin ? 'Login with GitHub' : 'Sign up with GitHub'}
            </button>

            <p className="text-center text-sm text-[#a1a1aa] mt-8">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-white hover:underline underline-offset-4"
              >
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </p>

          </div>
        </div>
      </div>
    </>
  );
}
