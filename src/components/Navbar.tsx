import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { 
    LayoutDashboard, 
    HardHat, 
    Settings, 
    HelpCircle, 
    LogOut, 
    Menu, 
    X, 
    Terminal,
    User,
    ChevronDown,
    Globe,
    Download
} from 'lucide-react';
import { AppView, User as UserType } from '../types';

interface NavbarProps {
    currentView: AppView;
    setView: (view: AppView) => void;
    currentUser: UserType | null;
    onLogout: () => void;
}

import { useConfig } from '../context/ConfigContext';

const Navbar: React.FC<NavbarProps> = ({ currentView, setView, currentUser, onLogout }) => {
    const { t, i18n } = useTranslation();
    const { config } = useConfig();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showLangDropdown, setShowLangDropdown] = useState(false);
    
    // Separate refs to avoid collision between desktop and mobile versions
    const langRefDesktop = useRef<HTMLDivElement>(null);
    const langRefMobile = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'sr', name: 'Srpski' },
        { code: 'it', name: 'Italiano' },
        { code: 'el', name: 'Ελληνικά' },
        { code: 'pt', name: 'Português' },
        { code: 'tr', name: 'Türkçe' }
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const clickedInsideDesktop = langRefDesktop.current?.contains(target);
            const clickedInsideMobile = langRefMobile.current?.contains(target);
            
            if (!clickedInsideDesktop && !clickedInsideMobile) {
                setShowLangDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (code: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        i18n.changeLanguage(code);
        setShowLangDropdown(false);
    };

    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        const handler = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const navItems: { view: AppView; label: string; icon: any; id?: string }[] = [
        { view: 'gallery', label: t('nav.library'), icon: HardHat, id: 'nav-repo' },
        { view: 'lessons', label: t('nav.lessons'), icon: Terminal, id: 'nav-lessons' },
        { view: 'academy', label: t('nav.academy'), icon: LayoutDashboard, id: 'nav-academy' },
        { view: 'help', label: t('nav.help'), icon: HelpCircle, id: 'nav-help' },
    ];

    if (currentUser?.role === 'admin') {
        navItems.push({ view: 'admin-settings', label: t('nav.user_menu.admin_settings'), icon: Settings, id: 'nav-admin-settings' });
    }

    const currentLangCode = i18n.language?.split('-')[0] || 'en';
    const currentLang = languages.find(l => l.code === currentLangCode) || languages[0];

    return (
        <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-8">
                        <button 
                            onClick={() => setView('home')}
                            className="flex items-center gap-2 group text-left"
                            id="nav-logo"
                        >
                            <div 
                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                                style={{ backgroundColor: 'var(--brand-primary)' }}
                            >
                                <HardHat className="text-white w-5 h-5" />
                            </div>
                            <span 
                                id="navbar-logo-text"
                                className="text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent"
                            >
                                {config.brand_name || 'THE GEAR'}
                            </span>
                        </button>

                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <button
                                    key={item.view}
                                    id={item.id}
                                    onClick={() => setView(item.view)}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                                        currentView === item.view
                                            ? 'bg-slate-800 text-white border border-slate-700'
                                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4">
                        {deferredPrompt && (
                            <button
                                onClick={handleInstallClick}
                                className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors animate-pulse"
                            >
                                <Download className="w-4 h-4" />
                                {t('nav.install_app')}
                            </button>
                        )}
                        {/* Language Selector Dropdown (Desktop) */}
                        <div className="relative" ref={langRefDesktop}>
                            <button
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
                                className="flex items-center gap-2 text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1.5 rounded border border-slate-700 hover:border-slate-500 transition-all uppercase min-w-[60px] justify-between"
                                title={t('nav.language')}
                            >
                                <span className="flex items-center gap-1.5">
                                    <Globe className="w-3.5 h-3.5" />
                                    {currentLang.code}
                                </span>
                                <ChevronDown className={`w-3 h-3 transition-transform ${showLangDropdown ? 'rotate-180' : ''}`} />
                            </button>

                            {showLangDropdown && (
                                <div className="absolute right-0 mt-2 w-40 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[60] origin-top-right">
                                    <div className="py-1">
                                        {languages.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={(e) => handleLanguageChange(lang.code, e)}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${
                                                    currentLang.code === lang.code
                                                        ? 'bg-blue-600/20 text-blue-400 font-bold'
                                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                }`}
                                            >
                                                <span>{lang.name}</span>
                                                <span className="text-[10px] opacity-50 uppercase">{lang.code}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {currentUser ? (
                            <>
                                <button
                                    onClick={() => setView('profile')}
                                    className={`p-2 transition-colors ${
                                        currentView === 'profile' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
                                    }`}
                                    title={t('nav.profile')}
                                    id="nav-profile"
                                >
                                    <User className="w-5 h-5" />
                                </button>

                                <button
                                    onClick={onLogout}
                                    className="bg-slate-800 text-slate-300 hover:bg-red-900/30 hover:text-red-400 p-2 rounded-lg border border-slate-700 transition-all group"
                                    title={t('nav.logout')}
                                >
                                    <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                </button>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setView('login')}
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
                                    id="nav-login"
                                >
                                    {t('nav.login')}
                                </button>
                                <button
                                    onClick={() => setView('register')}
                                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                                    id="nav-register"
                                >
                                    {t('nav.register')}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="md:hidden flex items-center gap-4">
                        {/* Mobile Language Selector */}
                        <div className="relative" ref={langRefMobile}>
                            <button
                                onClick={() => setShowLangDropdown(!showLangDropdown)}
                                className="flex items-center gap-1.5 text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700 uppercase"
                            >
                                <Globe className="w-3 h-3" />
                                {currentLang.code}
                                <ChevronDown className="w-2.5 h-2.5" />
                            </button>
                            
                            {showLangDropdown && (
                                <div className="absolute right-0 mt-2 w-32 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-[70]">
                                    {languages.map((lang) => (
                                        <button
                                            key={lang.code}
                                            onClick={(e) => handleLanguageChange(lang.code, e)}
                                            className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
                                        >
                                            {lang.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-slate-400 hover:text-white transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden bg-slate-900 border-t border-slate-800 shadow-2xl">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.view}
                                onClick={() => {
                                    setView(item.view);
                                    setIsMenuOpen(false);
                                }}
                                className={`flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                                    currentView === item.view
                                        ? 'bg-slate-800 text-white'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            >
                                <item.icon className="w-5 h-5" />
                                {item.label}
                            </button>
                        ))}
                        {currentUser ? (
                            <>
                                <button
                                    onClick={() => {
                                        setView('profile');
                                        setIsMenuOpen(false);
                                    }}
                                    className={`flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium ${
                                        currentView === 'profile' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <User className="w-5 h-5" />
                                    {t('nav.profile')}
                                </button>
                                <button
                                    onClick={() => {
                                        onLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-red-400 hover:bg-red-900/20"
                                >
                                    <LogOut className="w-5 h-5" />
                                    {t('nav.logout')}
                                </button>
                            </>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 p-2">
                                <button
                                    onClick={() => {
                                        setView('login');
                                        setIsMenuOpen(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 rounded-lg transition-colors border border-slate-700"
                                >
                                    {t('auth.login')}
                                </button>
                                <button
                                    onClick={() => {
                                        setView('register');
                                        setIsMenuOpen(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
                                >
                                    {t('auth.register')}
                                </button>
                            </div>
                        )}
                        {deferredPrompt && (
                            <button
                                onClick={() => {
                                    handleInstallClick();
                                    setIsMenuOpen(false);
                                }}
                                className="flex w-full items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-indigo-400 hover:bg-indigo-900/20"
                            >
                                <Download className="w-5 h-5" />
                                {t('nav.install_app')}
                            </button>
                        )}
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
