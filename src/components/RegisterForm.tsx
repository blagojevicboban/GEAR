import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';

interface RegisterFormProps {
  onRegister: (user: User) => void;
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegister, onSwitchToLogin }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    institution: '',
    role: 'student'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        alert(t('auth.error_register'));
        return;
      }

      const user = await res.json();
      onRegister(user);
    } catch (err) {
      console.error("Registration error", err);
      alert(t('auth.error_server'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 mb-20 px-6 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500"></div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">{t('auth.register_title')}</h2>
          <p className="text-slate-500 text-sm">{t('auth.register_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('auth.username')}</label>
            <input
              required
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.username}
              onChange={e => setFormData({ ...formData, username: e.target.value })}
              placeholder={t('auth.placeholder_username')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('auth.email')}</label>
            <input
              required
              type="email"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('auth.placeholder_email')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('auth.institution')}</label>
            <input
              required
              type="text"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.institution}
              onChange={e => setFormData({ ...formData, institution: e.target.value })}
              placeholder={t('auth.placeholder_institution')}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('auth.account_type')}</label>
            <select
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white appearance-none"
              value={formData.role}
              onChange={e => setFormData({ ...formData, role: e.target.value as 'student' | 'teacher' })}
            >
              <option value="student">{t('auth.student')}</option>
              <option value="teacher">{t('auth.teacher')}</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{t('auth.password')}</label>
            <input
              required
              type="password"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 focus:border-indigo-500 outline-none transition-all text-white"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
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
              t('auth.sign_up')
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-slate-800 pt-6">
          <p className="text-slate-500 text-sm">
            {t('auth.have_account')}{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
            >
              {t('auth.sign_in')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
