import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import { fixAssetUrl } from '../utils/urlUtils';

interface ProfileFormProps {
    user: User;
    onUpdateSuccess: (user: User) => void;
    onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({
    user,
    onUpdateSuccess,
    onCancel,
}) => {
    const { t } = useTranslation();
    const [isUpdating, setIsUpdating] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [formData, setFormData] = useState({
        username: user.username,
        email: user.email,
        institution: user.institution || '',
        bio: user.bio || '',
        profilePicUrl: user.profilePicUrl || '',
        language: user.language || 'en',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [showPasswordSection, setShowPasswordSection] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData((prev) => ({
                    ...prev,
                    profilePicUrl: reader.result as string,
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);

        try {
            let finalProfilePicUrl = formData.profilePicUrl;

            // Upload image if selected
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append('file', selectedFile);
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadData,
                });
                if (!uploadRes.ok)
                    throw new Error(t('profile.form.errors.upload_failed'));
                const uploadJson = await uploadRes.json();
                finalProfilePicUrl = uploadJson.url;
            }

            // Update Profile
            const res = await fetch(`/api/users/${user.id}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: formData.username,
                    institution: formData.institution,
                    bio: formData.bio,
                    profilePicUrl: finalProfilePicUrl,
                    language: formData.language,
                }),
            });

            if (!res.ok)
                throw new Error(t('profile.form.errors.update_failed'));
            const updatedUser = await res.json();

            // Change Password if requested
            if (showPasswordSection && passwordData.currentPassword) {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    throw new Error(t('profile.password.error_mismatch'));
                }

                const pwdRes = await fetch(`/api/users/${user.id}/password`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        currentPassword: passwordData.currentPassword,
                        newPassword: passwordData.newPassword,
                    }),
                });

                if (!pwdRes.ok) {
                    const pwdErr = await pwdRes.json();
                    throw new Error(pwdErr.error || 'Password update failed');
                }
            }

            onUpdateSuccess({
                ...user,
                ...updatedUser,
            });
            alert(t('profile.form.errors.update_failed').replace('Failed', 'Success').replace('to update profile', 'Profile Updated')); // Quick hack for success msg, or rely on parent
        } catch (err: any) {
            console.error(err);
            alert(err.message || t('profile.form.errors.update_failed'));
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto px-6 py-12">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
                    <div className="text-center sm:text-left">
                        <h2 className="text-3xl font-bold text-white">
                            {t('profile.form.title')}
                        </h2>
                        <p className="text-slate-500 text-sm">
                            {t('profile.form.subtitle')}
                        </p>
                    </div>

                    <div className="relative group">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/20 overflow-hidden relative"
                        >
                            {formData.profilePicUrl ? (
                                <img
                                    src={fixAssetUrl(formData.profilePicUrl)}
                                    alt="Preview"
                                    className="w-full h-full object-cover transition-opacity group-hover:opacity-75"
                                />
                            ) : (
                                <span>
                                    {formData.username.charAt(0).toUpperCase()}
                                </span>
                            )}

                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg
                                    className="w-6 h-6 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                    />
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                                    />
                                </svg>
                            </div>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageChange}
                        />
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center mt-2">
                            {t('profile.form.update_photo')}
                        </p>
                    </div>
                </div>

                {isUpdating ? (
                    <div className="py-20 text-center">
                        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-slate-400 font-bold animate-pulse">
                            {t('profile.form.updating')}
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                    {t('profile.form.username')}
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            username: e.target.value,
                                        })
                                    }
                                    placeholder={t(
                                        'profile.form.username_placeholder'
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                    {t('profile.form.email')}
                                </label>
                                <input
                                    required
                                    type="email"
                                    disabled
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-slate-500 cursor-not-allowed"
                                    value={formData.email}
                                    placeholder={t(
                                        'profile.form.email_placeholder'
                                    )}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                {t('profile.form.institution')}
                            </label>
                            <input
                                type="text"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                                value={formData.institution}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        institution: e.target.value,
                                    })
                                }
                                placeholder={t(
                                    'profile.form.institution_placeholder'
                                )}
                            />
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                {t('nav.language')}
                            </label>
                            <select
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                                value={formData.language}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        language: e.target.value,
                                    })
                                }
                            >
                                <option value="en">English</option>
                                <option value="sr">Srpski</option>
                                <option value="it">Italiano</option>
                                <option value="el">Eλληνικά</option>
                                <option value="pt">Português</option>
                                <option value="tr">Türkçe</option>
                            </select>
                        </div>
                        
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                {t('profile.form.bio')}
                            </label>
                            <textarea
                                rows={3}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white resize-none"
                                value={formData.bio}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        bio: e.target.value,
                                    })
                                }
                                placeholder={t('profile.form.bio_placeholder')}
                            />
                        </div>

                        <div className="border-t border-slate-800 pt-6">
                            <button
                                type="button"
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                                className="text-indigo-400 text-sm font-bold hover:text-indigo-300 flex items-center gap-2"
                            >
                                <svg
                                    className={`w-4 h-4 transition-transform ${showPasswordSection ? 'rotate-180' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M19 9l-7 7-7-7"
                                    />
                                </svg>
                                {t('profile.password.title')}
                            </button>

                            {showPasswordSection && (
                                <div className="mt-4 space-y-4 bg-slate-950/50 p-6 rounded-xl border border-slate-800">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                            {t('profile.password.current')}
                                        </label>
                                        <input
                                            type="password"
                                            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                                            value={passwordData.currentPassword}
                                            onChange={(e) =>
                                                setPasswordData({
                                                    ...passwordData,
                                                    currentPassword: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                                {t('profile.password.new')}
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                                                value={passwordData.newPassword}
                                                onChange={(e) =>
                                                    setPasswordData({
                                                        ...passwordData,
                                                        newPassword: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">
                                                {t('profile.password.confirm')}
                                            </label>
                                            <input
                                                type="password"
                                                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                                                value={passwordData.confirmPassword}
                                                onChange={(e) =>
                                                    setPasswordData({
                                                        ...passwordData,
                                                        confirmPassword: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 pt-4 border-t border-slate-800">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                type="submit"
                                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
                            >
                                {t('profile.form.save_btn')}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ProfileForm;
