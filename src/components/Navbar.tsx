
import React, { useState } from 'react';
import { AppView, User } from '../types';
import { fixAssetUrl } from '../utils/urlUtils';

interface NavbarProps {
  currentView: AppView;
  setView: (view: AppView) => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, currentUser, onLogout }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 flex items-center justify-between">
      <div id="nav-logo" className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-xl italic text-white shadow-lg shadow-indigo-500/20">
          G
        </div>
        <div className="hidden sm:block">
          <span className="text-xl font-bold tracking-tight text-white block leading-none">THE GEAR</span>
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Global Educational AR/VR Hub</span>
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-8">
        <button
          id="nav-repo"
          onClick={() => setView('gallery')}
          className={`text-sm font-medium transition-colors ${currentView === 'gallery' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
        >
          Repository
        </button>

        <button
          id="nav-lessons"
          onClick={() => setView('lessons')}
          className={`text-sm font-medium transition-colors ${currentView === 'lessons' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
        >
          Lessons
        </button>

        <button
          id="nav-help"
          onClick={() => setView('help')}
          className={`text-sm font-medium transition-colors ${currentView === 'help' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
        >
          Help
        </button>

        <button
          id="nav-academy"
          onClick={() => setView('academy')}
          className={`text-sm font-medium transition-colors ${currentView === 'academy' ? 'text-indigo-400' : 'text-slate-400 hover:text-white'}`}
        >
          Academy
        </button>

        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'teacher') && (
          <button
            id="nav-upload"
            onClick={() => setView('upload')}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${currentView === 'upload'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
          >
            + Upload
          </button>
        )}





        {currentUser ? (
          <div className="relative">
            <button
              id="nav-profile"
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-full border border-slate-700 transition-all"
            >
              <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white uppercase overflow-hidden">
                {currentUser.profilePicUrl ? (
                  <img src={fixAssetUrl(currentUser.profilePicUrl)} alt={currentUser.username} className="w-full h-full object-cover" />
                ) : (
                  currentUser.username.charAt(0)
                )}
              </div>
              <span className="text-sm font-medium text-slate-200 hidden md:block">{currentUser.username}</span>
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-2 border-b border-slate-800 mb-1">
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Institution</p>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded uppercase font-bold">{currentUser.role}</span>
                  </div>
                  <p className="text-sm text-slate-300 truncate">{currentUser.institution || 'Independent'}</p>
                </div>

                <button
                  onClick={() => { setView('my-projects'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors"
                >
                  My Models
                </button>
                <button
                  onClick={() => { setView('my-lessons'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors"
                >
                  My Lessons
                </button>
                <button
                  onClick={() => { setView('profile'); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors"
                >
                  Edit Profile
                </button>
                {(currentUser.role === 'admin' || currentUser.role === 'teacher') && (
                  <button
                    onClick={() => { setView('teacher-dashboard'); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors"
                  >
                    Teacher Dashboard
                  </button>
                )}
                {currentUser.role === 'admin' && (
                  <button
                    onClick={() => { setView('users'); setShowDropdown(false); }}
                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-indigo-600/10 hover:text-indigo-400 transition-colors"
                  >
                    Users
                  </button>
                )}
                <button
                  onClick={() => { onLogout(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              id="nav-login"
              onClick={() => setView('login')}
              className="text-sm font-semibold text-slate-400 hover:text-white px-3 py-2"
            >
              Login
            </button>
            <button
              id="nav-register"
              onClick={() => setView('register')}
              className="text-sm font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 px-4 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
            >
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
