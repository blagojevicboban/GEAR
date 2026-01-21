
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, VETModel, User } from './types';
import { INITIAL_MODELS } from './constants';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ModelGallery from './components/ModelGallery';
import ModelUploadForm from './components/ModelUploadForm';
import ModelEditForm from './components/ModelEditForm';
import VRViewer from './components/VRViewer';
import PDBViewer from './components/PDBViewer';
import FileDownloadViewer from './components/FileDownloadViewer';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import ProfileForm from './components/ProfileForm';

import UserManagement from './components/UserManagement';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [models, setModels] = useState<VETModel[]>(INITIAL_MODELS); // Initialize with constants
  const [selectedModel, setSelectedModel] = useState<VETModel | null>(null);
  const [modelToEdit, setModelToEdit] = useState<VETModel | null>(null);
  const [isWorkshopMode, setIsWorkshopMode] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gear_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    fetch('/api/models')
      .then(res => res.json())
      .then(data => {
        // Merge API models with INITIAL_MODELS (dev/test models)
        // Avoid duplicates if IDs collide (API takes precedence)
        const apiIds = new Set(data.map((m: VETModel) => m.id));
        const filteredInitial = INITIAL_MODELS.filter(m => !apiIds.has(m.id));
        setModels([...filteredInitial, ...data]);
      })
      .catch(err => console.error("Failed to fetch models", err));
  }, []);

  // Sync user state changes to localStorage (cover login and profile update)
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('gear_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('gear_user');
    }
  }, [currentUser]);

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
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.username || ''
        },
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
        headers: {
          'Content-Type': 'application/json',
          'X-User-Name': currentUser?.username || ''
        },
        body: JSON.stringify(updatedModel)
      });
      if (res.ok) {
        setModels(prev => prev.map(m => m.id === updatedModel.id ? updatedModel : m));
        setCurrentView('gallery');
        setModelToEdit(null);
      } else {
        const err = await res.json();
        alert(`Update failed: ${err.error}`);
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

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setCurrentView('home');
    localStorage.removeItem('gear_user');
  }, []);

  // Session Timeout: 15 minutes of inactivity
  useEffect(() => {
    if (!currentUser) return;

    const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes
    let timeoutId: NodeJS.Timeout;

    const doLogout = () => {
      handleLogout();
      alert("Session expired due to inactivity.");
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(doLogout, INACTIVITY_LIMIT);
    };

    // Events to monitor for activity
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

    // Set initial timer
    resetTimer();

    // Attach listeners
    events.forEach(event => document.addEventListener(event, resetTimer));

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [currentUser, handleLogout]);

  const protectedSetView = (view: AppView) => {
    if ((view === 'upload' || view === 'edit' || view === 'profile' || view === 'users') && !currentUser) {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
  };

  const getFeaturedModels = () => {
    const featured = models.filter(m => m.isFeatured);
    return featured.length > 0 ? featured : models.slice(0, 3);
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
            featuredModels={getFeaturedModels()}
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
                const res = await fetch(`/api/models/${id}`, {
                  method: 'DELETE',
                  headers: {
                    'X-User-Name': currentUser?.username || ''
                  }
                });
                if (res.ok) {
                  setModels(prev => prev.filter(m => m.id !== id));
                } else {
                  const err = await res.json();
                  alert(`Delete failed: ${err.error}`);
                }
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
            userRole={currentUser?.role || 'student'}
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

        {currentView === 'users' && currentUser && (
          <UserManagement currentUser={currentUser} models={models} />
        )}

        {currentView === 'viewer' && selectedModel && (
          (selectedModel.modelUrl.toLowerCase().endsWith('.pdb') || selectedModel.modelUrl.includes('#pdb')) ? (
            <PDBViewer
              pdbUrl={selectedModel.modelUrl.replace('#pdb', '')}
              onExit={handleExitViewer}
            />
          ) : (selectedModel.modelUrl.toLowerCase().endsWith('.stp') || selectedModel.modelUrl.toLowerCase().endsWith('.step') || selectedModel.modelUrl.includes('#step')) ? (
            <FileDownloadViewer
              fileUrl={selectedModel.modelUrl.replace('#step', '')}
              onExit={handleExitViewer}
              fileName={selectedModel.name + (selectedModel.modelUrl.toLowerCase().endsWith('.step') ? '.step' : '.stp')}
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
