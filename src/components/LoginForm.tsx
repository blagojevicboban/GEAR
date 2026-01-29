import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';

interface LoginFormProps {
    onLogin: (user: User) => void;
    onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({
    onLogin,
    onSwitchToRegister,
}) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.email,
                    password: formData.password,
                }),
            });

            if (!res.ok) {
                alert(t('auth.error_credentials'));
                setLoading(false);
                return;
            }

            const user = await res.json();
            onLogin(user);
        } catch (err) {
            console.error('Login failed', err);
            alert(t('auth.error_server'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-20 px-6 py-12">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-cyan-500"></div>

                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/30">
                        <svg
                            className="w-8 h-8 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {t('auth.login_title')}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {t('auth.login_subtitle')}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                            {t('auth.email')}
                        </label>
                        <input
                            required
                            type="email"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    email: e.target.value,
                                })
                            }
                            placeholder={t('auth.placeholder_email')}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                            {t('auth.password')}
                        </label>
                        <input
                            required
                            type="password"
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                            value={formData.password}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    password: e.target.value,
                                })
                            }
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            t('auth.sign_in')
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center border-t border-slate-800 pt-6">
                    <p className="text-slate-500 text-sm">
                        {t('auth.no_account')}{' '}
                        <button
                            onClick={onSwitchToRegister}
                            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors"
                        >
                            {t('auth.sign_up')}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
