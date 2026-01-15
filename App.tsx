
import React, { useState, useEffect } from 'react';
import { AppView, VETModel, User } from './types';
import { INITIAL_MODELS } from './constants';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ModelGallery from './components/ModelGallery';
import ModelUploadForm from './components/ModelUploadForm';
import ModelEditForm from './components/ModelEditForm';
import VRViewer from './components/VRViewer';
import PDBViewer from './components/PDBViewer';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProfileForm from './components/ProfileForm';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [models, setModels] = useState<VETModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<VETModel | null>(null);
  const [modelToEdit, setModelToEdit] = useState<VETModel | null>(null);
  const [isWorkshopMode, setIsWorkshopMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => setModels(data))
      .catch(err => console.error("Failed to fetch models", err));
  }, []);

  // Deep linking: check for modelId in URL on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modelId = params.get('modelId');
    if (modelId) {
      const foundModel = models.find(m => m.id === modelId);
      if (foundModel) {
        setSelectedModel(foundModel);
        setCurrentView('viewer');
      }
    }
  }, [models]);

  const handleViewModel = (model: VETModel, workshop: boolean = false) => {
    setSelectedModel(model);
    setIsWorkshopMode(workshop);
    setCurrentView('viewer');
  };

  const handleEditRequest = (model: VETModel) => {
    setModelToEdit(model);
    setCurrentView('edit');
  };

  const handleUpload = async (newModel: VETModel) => {
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModel)
      });
      if (res.ok) {
        const savedModel = await res.json();
        setModels(prev => [savedModel, ...prev]);
        setCurrentView('gallery');
      }
    } catch (err) {
      console.error("Failed to upload model", err);
    }
  };

  const handleUpdate = async (updatedModel: VETModel) => {
    try {
      const res = await fetch(`/api/models/${updatedModel.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedModel)
      });
      if (res.ok) {
        setModels(prev => prev.map(m => m.id === updatedModel.id ? updatedModel : m));
        setCurrentView('gallery');
        setModelToEdit(null);
      }
    } catch (err) {
      console.error("Failed to update model", err);
    }
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setCurrentView('home');
  };

  const handleExitViewer = () => {
    setCurrentView('gallery');
    setSelectedModel(null);
    setIsWorkshopMode(false);
    // Clear URL params without reloading
    const url = new URL(window.location.href);
    url.searchParams.delete('modelId');
    window.history.replaceState({}, '', url);
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentView('home');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('home');
  };

  const protectedSetView = (view: AppView) => {
    if ((view === 'upload' || view === 'edit' || view === 'profile') && !currentUser) {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-200">
      {currentView !== 'viewer' && (
        <Navbar
          currentView={currentView}
          setView={protectedSetView}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
      )}

      <main className="flex-1">
        {currentView === 'home' && (
          <Dashboard
            modelsCount={models.length}
            onGetStarted={() => setCurrentView('gallery')}
            latestModels={models.slice(0, 3)}
            onViewModel={(m) => handleViewModel(m)}
          />
        )}

        {currentView === 'gallery' && (
          <ModelGallery
            models={models}
            currentUser={currentUser}
            onViewModel={(m) => handleViewModel(m)}
            onEnterWorkshop={(m) => handleViewModel(m, true)}
            onEditModel={handleEditRequest}
            onDeleteModel={async (id) => {
              if (!confirm('Are you sure you want to delete this model?')) return;
              try {
                await fetch(`/api/models/${id}`, { method: 'DELETE' });
                setModels(prev => prev.filter(m => m.id !== id));
              } catch (err) {
                console.error("Failed to delete", err);
              }
            }}
          />
        )}

        {currentView === 'upload' && (
          <ModelUploadForm
            onUploadSuccess={handleUpload}
            userName={currentUser?.username || 'Guest'}
          />
        )}

        {currentView === 'edit' && modelToEdit && (
          <ModelEditForm
            model={modelToEdit}
            onUpdateSuccess={handleUpdate}
            userName={currentUser?.username || 'Guest'}
            onCancel={() => { setCurrentView('gallery'); setModelToEdit(null); }}
          />
        )}

        {currentView === 'profile' && currentUser && (
          <ProfileForm
            user={currentUser}
            onUpdateSuccess={handleProfileUpdate}
            onCancel={() => setCurrentView('home')}
          />
        )}

        {currentView === 'viewer' && selectedModel && (
          (selectedModel.modelUrl.toLowerCase().endsWith('.pdb') || selectedModel.modelUrl.includes('#pdb')) ? (
            <PDBViewer
              pdbUrl={selectedModel.modelUrl.replace('#pdb', '')}
              onExit={handleExitViewer}
            />
          ) : (
            <VRViewer
              model={selectedModel}
              workshopMode={isWorkshopMode}
              onExit={handleExitViewer}
            />
          )
        )}

        {currentView === 'login' && (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setCurrentView('register')}
          />
        )}

        {currentView === 'register' && (
          <RegisterForm
            onRegister={handleLogin}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
      </main>

      {currentView !== 'viewer' && (
        <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
          <p>&copy; 2026 THE GEAR - Open Source VET WebXR Platform. Optimized for Meta Quest.</p>
        </footer>
      )}
    </div>
  );
};

export default App;
