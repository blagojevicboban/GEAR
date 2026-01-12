
import React, { useState, useRef } from 'react';
import { User } from '../types';

interface ProfileFormProps {
  user: User;
  onUpdateSuccess: (user: User) => void;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ user, onUpdateSuccess, onCancel }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    institution: user.institution || '',
    bio: user.bio || '',
    profilePicUrl: user.profilePicUrl || ''
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profilePicUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    
    // Simulate API update
    setTimeout(() => {
      onUpdateSuccess({
        ...user,
        username: formData.username,
        email: formData.email,
        institution: formData.institution,
        bio: formData.bio,
        profilePicUrl: formData.profilePicUrl
      });
      setIsUpdating(false);
    }, 1200);
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
        
        <div className="flex flex-col sm:flex-row items-center justify-between mb-10 gap-6">
          <div className="text-center sm:text-left">
            <h2 className="text-3xl font-bold text-white">Edit Profile</h2>
            <p className="text-slate-500 text-sm">Manage your account and institutional details.</p>
          </div>
          
          <div className="relative group">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 bg-indigo-600 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-xl shadow-indigo-500/20 overflow-hidden relative"
            >
              {formData.profilePicUrl ? (
                <img src={formData.profilePicUrl} alt="Preview" className="w-full h-full object-cover transition-opacity group-hover:opacity-75" />
              ) : (
                <span>{formData.username.charAt(0).toUpperCase()}</span>
              )}
              
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
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
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center mt-2">Update Photo</p>
          </div>
        </div>

        {isUpdating ? (
          <div className="py-20 text-center">
             <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-slate-400 font-bold animate-pulse">Updating Profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Username</label>
                <input 
                  required
                  type="text" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  placeholder="Your display name"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Email Address</label>
                <input 
                  required
                  type="email" 
                  disabled
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-slate-500 cursor-not-allowed"
                  value={formData.email}
                  placeholder="name@institution.edu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Institution / School</label>
              <input 
                type="text" 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white"
                value={formData.institution}
                onChange={e => setFormData({...formData, institution: e.target.value})}
                placeholder="e.g., Technical School Pirot"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-slate-500 tracking-widest">Short Bio</label>
              <textarea 
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 focus:border-indigo-500 outline-none transition-all text-white resize-none"
                value={formData.bio}
                onChange={e => setFormData({...formData, bio: e.target.value})}
                placeholder="Briefly describe your role or focus (e.g., Mechatronics Teacher)..."
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-800">
               <button 
                type="button"
                onClick={onCancel}
                className="flex-1 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[2] py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-xl shadow-indigo-600/20 transition-all active:scale-[0.98]"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfileForm;
