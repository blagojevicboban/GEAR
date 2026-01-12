
import React, { useState } from 'react';
import { User } from '../types';

interface RegisterFormProps {
  onRegister: (user: User) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({ 
    username: '', 
    email: '', 
    password: '',
    institution: '' 
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API delay
    setTimeout(() => {
      onRegister({
        id: 'user-' + Math.random(),
        username: formData.username,
        email: formData.email,
        institution: formData.institution
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="max-w-md mx-auto mt-10 mb-20 px-6 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
        
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-500 text-sm">Join the global VET repository</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Username</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.username}
              onChange={e => setFormData({...formData, username: e.target.value})}
              placeholder="johndoe"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Educational Email</label>
            <input 
              required
              type="email" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="john@school.edu"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Institution</label>
            <input 
              required
              type="text" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.institution}
              onChange={e => setFormData({...formData, institution: e.target.value})}
              placeholder="Polytechnic High School"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">Password</label>
            <input 
              required
              type="password" 
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <p className="text-slate-500 text-sm">
            Already have an account?{' '}
            <button 
              onClick={onSwitchToLogin}
              className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
