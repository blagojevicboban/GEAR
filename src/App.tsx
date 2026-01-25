
import React, { useState, useEffect, useCallback } from 'react';
import { AppView, VETModel, User, TourStep, Lesson } from './types';
import { INITIAL_MODELS } from './constants';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ModelGallery from './components/ModelGallery';
import ModelUploadForm from './components/ModelUploadForm';
import ModelEditForm from './components/ModelEditForm';
import VRViewer from './components/VRViewer';
import PDBViewer from './components/PDBViewer';
import CADViewer from './components/CADViewer';
import FileDownloadViewer from './components/FileDownloadViewer';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import HelpPage from './components/HelpPage';
import ProfileForm from './components/ProfileForm';
import TourOverlay from './components/TourOverlay';
import LessonsList from './components/LessonsList';
import LessonViewer from './components/LessonViewer';
import WorkbookBuilder from './components/WorkbookBuilder';

import UserManagement from './components/UserManagement';
import UserProfileModal from './components/UserProfileModal';
import TeacherDashboard from './components/TeacherDashboard';
import Academy from './components/Academy';
import AdminSettings from './components/AdminSettings';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [models, setModels] = useState<VETModel[]>(INITIAL_MODELS); // Initialize with constants
  const [selectedModel, setSelectedModel] = useState<VETModel | null>(null);
  const [modelToEdit, setModelToEdit] = useState<VETModel | null>(null);
  const [isWorkshopMode, setIsWorkshopMode] = useState(false);
  const [activeWorkshopId, setActiveWorkshopId] = useState<string | undefined>();
  const [activeWorkshops, setActiveWorkshops] = useState<any[]>([]);
  const [sectors, setSectors] = useState<string[]>([]); // Dynamic sectors
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('gear_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [viewingProfileUser, setViewingProfileUser] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | undefined>(undefined);

  // Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const [tourStepIndex, setTourStepIndex] = useState(0);

  const TOUR_STEPS: TourStep[] = [
    {
      targetId: 'nav-logo',
      title: 'Welcome to THE GEAR',
      content: 'Your ultimate WebXR open-source repository for vocational training.',
      position: 'bottom',
      view: 'home'
    },
    {
      targetId: 'nav-repo',
      title: '3D Repository',
      content: 'Browse, filter, and upload new industrial models.',
      position: 'bottom',
      view: 'home'
    },
    {
      targetId: 'nav-lessons',
      title: 'Interactive Lessons',
      content: 'Explore guided 3D learning experiences designed by teachers.',
      position: 'bottom',
      view: 'home'
    },
    {
      targetId: 'nav-academy',
      title: 'GEAR Academy',
      content: 'Master the platform with video tutorials and pedagogy tips.',
      position: 'bottom',
      view: 'home'
    },
    {
      targetId: 'nav-help',
      title: 'Need Help?',
      content: 'Access tutorials, diagnostics, and support here anytime.',
      position: 'bottom',
      view: 'home'
    }
  ];

  // Dynamically add steps based on auth status
  if (!currentUser) {
    TOUR_STEPS.push(
      {
        targetId: 'nav-login',
        title: 'Login',
        content: 'Already have an account? Log in to access your projects.',
        position: 'bottom',
        view: 'home'
      },
      {
        targetId: 'nav-register',
        title: 'Sign Up',
        content: 'Create a new account to start uploading models and joining workshops.',
        position: 'bottom',
        view: 'home'
      }
    );
  } else {


    // Profile for all logged in users
    TOUR_STEPS.push({
      targetId: 'nav-profile',
      title: 'User Profile',
      content: 'Manage your settings, view your projects, or log out.',
      position: 'bottom',
      view: 'home'
    });
  }

  // Common steps at the end
  TOUR_STEPS.push(
    {
      targetId: 'dashboard-workshop',
      title: 'Active Workshops',
      content: 'Join live multi-user collaborative sessions in VR.',
      position: 'bottom',
      view: 'home'
    },
    {
      targetId: 'dashboard-featured',
      title: 'Featured Equipment',
      content: 'Check out the most popular and high-quality models selected for you.',
      position: 'top',
      view: 'home'
    }
  );

  const handleStartTour = () => {
    setIsTourActive(true);
    setTourStepIndex(0);
    setCurrentView('home');
  };

  const handleNextStep = () => {
    if (tourStepIndex < TOUR_STEPS.length - 1) {
      const nextStep = TOUR_STEPS[tourStepIndex + 1];
      if (nextStep.view && nextStep.view !== currentView) {
        setCurrentView(nextStep.view);
      }
      setTourStepIndex(prev => prev + 1);
    } else {
      setIsTourActive(false);
    }
  };

  const handlePrevStep = () => {
    if (tourStepIndex > 0) {
      setTourStepIndex(prev => prev - 1);
    }
  };

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

    // Fetch active workshops
    fetch('/api/workshops/active')
      .then(res => res.json())
      .then(data => setActiveWorkshops(data))
      .catch(err => console.error("Failed to fetch workshops", err));

    // Fetch sectors
    fetch('/api/sectors')
      .then(res => res.json())
      .then(data => {
        // Enforce uniqueness
        const unique = Array.from(new Set(data)) as string[];
        setSectors(unique);
      })
      .catch(err => console.error("Failed to fetch sectors", err));
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

  const handleViewModel = async (model: VETModel, workshop: boolean = false) => {
    setSelectedModel(model);
    setIsWorkshopMode(workshop);
    setCurrentView('viewer');

    if (workshop && currentUser) {
      try {
        const response = await fetch('/api/workshops', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelId: model.id, createdBy: currentUser.username })
        });
        const data = await response.json();
        setActiveWorkshopId(data.id);
      } catch (err) {
        console.error("Failed to create workshop", err);
      }
    } else {
      setActiveWorkshopId(undefined);
    }
  };

  const handleJoinWorkshop = (workshop: any) => {
    const model = models.find(m => m.id === workshop.modelId);
    if (model) {
      setSelectedModel(model);
      setIsWorkshopMode(true);
      setActiveWorkshopId(workshop.id);
      setCurrentView('viewer');
    }
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

        // Optimistically add new custom sector if it exists
        if (savedModel.sector) {
          setSectors(prev => {
            if (prev.includes(savedModel.sector)) return prev;
            return [...prev, savedModel.sector].sort();
          });
        }

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

        // Optimistically add new custom sector if it exists
        if (updatedModel.sector) {
          setSectors(prev => {
            if (prev.includes(updatedModel.sector)) return prev;
            return [...prev, updatedModel.sector].sort();
          });
        }

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

  const handleOptimizeModel = async (model: VETModel) => {
    if (!confirm(`Start AI Optimization for ${model.name}? This will generate a low-poly version.`)) return;

    // Optimistic UI update or Loading state could be here
    try {
      const res = await fetch(`/api/models/${model.id}/optimize`, {
        method: 'POST',
        headers: {
          'X-User-Name': currentUser?.username || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        // Update local state
        setModels(prev => prev.map(m => m.id === model.id ? {
          ...m,
          optimized: true,
          optimizedUrl: data.stats.output_path,
          optimizationStats: JSON.stringify(data.stats),
          aiAnalysis: data.ai
        } : m));
        alert(`Optimization Complete!\nReduction: ${data.stats.reduction_percentage}%\nAI Verdict: ${typeof data.ai === 'string' ? data.ai.substring(0, 100) : 'Analyzed'}`);
      } else {
        const err = await res.json();
        alert(`Optimization failed: ${err.error}`);
      }
    } catch (e) {
      console.error(e);
      alert("Network error starting optimization");
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
    if ((view === 'upload' || view === 'edit' || view === 'profile' || view === 'users' || view === 'my-projects' || view === 'admin-settings') && !currentUser) {
      setCurrentView('login');
    } else {
      setCurrentView(view);
    }
  };

  const getFeaturedModels = () => {
    const featured = models.filter(m => m.isFeatured);
    return featured.length > 0 ? featured : models.slice(0, 3);
  };

  const handeEditLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentView('lesson-edit');
  };

  const handleCreateLesson = () => {
    setSelectedLesson(undefined);
    setCurrentView('lesson-edit');
  };

  const handleViewLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
    setCurrentView('lesson-view');
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
            activeWorkshops={activeWorkshops}
            onViewModel={(m) => handleViewModel(m)}
            onViewUser={setViewingProfileUser}
            onJoinWorkshop={handleJoinWorkshop}
          />
        )}

        {currentView === 'gallery' && (
          <ModelGallery
            key="gallery"
            models={models}
            currentUser={currentUser}
            sectors={sectors}
            onViewModel={(m) => handleViewModel(m)}
            onViewUser={setViewingProfileUser}
            onEnterWorkshop={(m) => handleViewModel(m, true)}
            onUpload={() => setCurrentView('upload')}
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

        {currentView === 'my-projects' && currentUser && (
          <ModelGallery
            key="my-projects"
            models={models}
            currentUser={currentUser}
            sectors={sectors}
            initialUserFilter={currentUser.username}
            onViewModel={(m) => handleViewModel(m)}
            onViewUser={setViewingProfileUser}
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
            user={currentUser}
            sectors={sectors}
          />
        )}

        {currentView === 'edit' && modelToEdit && (
          <ModelEditForm
            model={modelToEdit}
            onUpdateSuccess={handleUpdate}
            userName={currentUser?.username || 'Guest'}
            userRole={currentUser?.role || 'student'}
            sectors={sectors}
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

        {currentView === 'admin-settings' && currentUser && (
          <AdminSettings currentUser={currentUser} models={models} />
        )}

        {currentView === 'teacher-dashboard' && currentUser && (
          <TeacherDashboard currentUser={currentUser} />
        )}

        {viewingProfileUser && (
          <UserProfileModal
            username={viewingProfileUser}
            models={models}
            onClose={() => setViewingProfileUser(null)}
          />
        )}

        {currentView === 'viewer' && selectedModel && (
          (selectedModel.modelUrl.toLowerCase().endsWith('.pdb') || selectedModel.modelUrl.includes('#pdb')) ? (
            <PDBViewer
              pdbUrl={selectedModel.modelUrl.replace('#pdb', '')}
              onExit={handleExitViewer}
            />
          ) : (selectedModel.modelUrl.toLowerCase().endsWith('.stp') || selectedModel.modelUrl.toLowerCase().endsWith('.step') || selectedModel.modelUrl.includes('#step')) ? (
            <CADViewer
              fileUrl={selectedModel.modelUrl.replace('#step', '')}
              onExit={handleExitViewer}
              fileName={selectedModel.name}
            />
          ) : (selectedModel.modelUrl.toLowerCase().endsWith?.('.stl') || selectedModel.modelUrl.includes('#stl')) ? (
            <VRViewer
              model={selectedModel}
              workshopMode={isWorkshopMode}
              workshopId={activeWorkshopId}
              user={currentUser}
              onExit={handleExitViewer}
            />
          ) : (
            <VRViewer
              model={selectedModel}
              workshopMode={isWorkshopMode}
              workshopId={activeWorkshopId}
              user={currentUser}
              onExit={handleExitViewer}
            />
          )
        )}

        {currentView === 'help' && (
          <HelpPage onStartTour={handleStartTour} />
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

        {currentView === 'academy' && (
          <Academy currentUser={currentUser} />
        )}
      </main>

      {(currentView === 'lessons' || (currentView === 'my-lessons' && currentUser)) && (
        <LessonsList
          currentUser={currentUser}
          onViewLesson={handleViewLesson}
          onEditLesson={handeEditLesson}
          onCreateLesson={handleCreateLesson}
          onViewUser={setViewingProfileUser}
          initialAuthorFilter={currentView === 'my-lessons' ? currentUser?.username : undefined}
        />
      )}

      {currentView === 'lesson-view' && selectedLesson && (
        <LessonViewer
          lessonId={selectedLesson.id}
          onExit={() => setCurrentView('lessons')}
          currentUser={currentUser}
        />
      )}

      {currentView === 'lesson-edit' && (
        <WorkbookBuilder
          lessonToEdit={selectedLesson}
          currentUser={currentUser}
          onSaveSuccess={() => setCurrentView('lessons')}
          onCancel={() => setCurrentView('lessons')}
          availableModels={models}
          availableSectors={sectors}
        />
      )}

      {currentView !== 'viewer' && (
        <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-500 text-sm">
          <p>&copy; 2026 THE GEAR - Open Source VET WebXR Platform. Optimized for Meta Quest.</p>
        </footer>
      )}

      {/* Tour Overlay */}
      <TourOverlay
        steps={TOUR_STEPS}
        currentStepIndex={tourStepIndex}
        isOpen={isTourActive}
        onNext={handleNextStep}
        onPrev={handlePrevStep}
        onClose={() => setIsTourActive(false)}
      />
    </div>
  );
};

export default App;
