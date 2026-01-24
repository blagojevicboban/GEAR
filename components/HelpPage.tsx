import React, { useEffect, useState } from 'react';

interface HelpPageProps {
    onStartTour?: () => void;
}

const HelpPage: React.FC<HelpPageProps> = ({ onStartTour }) => {
    const [xrSupported, setXrSupported] = useState<boolean | null>(null);
    const [isSecure, setIsSecure] = useState<boolean>(false);
    const [browserName, setBrowserName] = useState<string>('');

    useEffect(() => {
        // Check Secure Context (HTTPS or localhost)
        // Fallback to checking protocol if isSecureContext is false but protocol is https
        const isHttps = window.location.protocol === 'https:';
        const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        setIsSecure(window.isSecureContext || isHttps || isLocal);

        // Check Browser Name
        const userAgent = navigator.userAgent;
        if (userAgent.match(/OculusBrowser/i)) {
            setBrowserName('Meta Quest Browser');
        } else if (userAgent.match(/Chrome/i)) {
            setBrowserName('Chrome / Chromium');
        } else if (userAgent.match(/Firefox/i)) {
            setBrowserName('Firefox');
        } else if (userAgent.match(/Safari/i)) {
            setBrowserName('Safari');
        } else {
            setBrowserName('Unknown Browser');
        }

        // Check WebXR Support
        if ('xr' in navigator) {
            // @ts-ignore
            navigator.xr.isSessionSupported('immersive-vr')
                .then((supported: boolean) => setXrSupported(supported))
                .catch(() => setXrSupported(false));
        } else {
            setXrSupported(false);
        }
    }, []);

    return (
        <div className="max-w-4xl mx-auto px-6 py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    How to use THE GEAR
                </h1>
                <p className="text-xl text-slate-400 mb-8">
                    Your guide to the ultimate WebXR VET experience.
                </p>
                {onStartTour && (
                    <button
                        onClick={onStartTour}
                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-indigo-500/30 text-indigo-400 font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/10 flex items-center gap-2 mx-auto"
                    >
                        <span>🎬</span> Start Interactive Tour
                    </button>
                )}
            </div>

            <div className="space-y-12">
                {/* Section 0: System Diagnostics */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">🩺</span>
                        System Diagnostics
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-xl border ${isSecure ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-rose-500/10 border-rose-500/30'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold ${isSecure ? 'text-emerald-400' : 'text-rose-400'}`}>Connection</span>
                                <span>{isSecure ? '✅' : '❌'}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {isSecure ? 'Secure context active (HTTPS/Localhost).' : 'Insecure connection. WebXR requires HTTPS.'}
                            </p>
                        </div>

                        <div className={`p-4 rounded-xl border ${xrSupported ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <span className={`font-bold ${xrSupported ? 'text-emerald-400' : 'text-amber-400'}`}>WebXR Support</span>
                                <span>{xrSupported ? '✅' : '⚠️'}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {xrSupported === true && 'Your browser supports immersive VR.'}
                                {xrSupported === false && 'WebXR not detected.'}
                                {xrSupported === null && 'Checking support...'}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl border bg-slate-800/50 border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-slate-300">Browser</span>
                                <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">{browserName}</span>
                            </div>
                            <p className="text-xs text-slate-400">
                                {browserName === 'Meta Quest Browser' ? 'Optimized for THE GEAR.' : 'For best VR results, use Meta Quest Browser.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section 1: Quick Start (VR) */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">🥽</span>
                        VR Mode Quick Start
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="tex-lg font-bold text-indigo-400">Requirements</h3>
                            <ul className="list-disc list-inside text-slate-400 space-y-2">
                                <li>Meta Quest 2, 3, or Pro headset</li>
                                <li>Stable Wi-Fi connection</li>
                                <li>Use the built-in <strong>Meta Quest Browser</strong></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h3 className="tex-lg font-bold text-indigo-400">How to Enter VR</h3>
                            <ol className="list-decimal list-inside text-slate-400 space-y-2">
                                <li>Open <strong>the-gear.app</strong> in your headset</li>
                                <li>Select a model from the Repository</li>
                                <li>Click the <span className="text-white px-2 py-0.5 bg-indigo-600 rounded text-xs">Enter VR</span> button</li>
                                <li>Allow "Immersive Mode" if prompted</li>
                            </ol>
                        </div>
                    </div>
                </div>

                {/* Section 2: Controls */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">🎮</span>
                        Controls & Navigation
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-white mb-4">In Desktop / Mobile Mode</h3>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Left Click + Drag:</span> Rotate model
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Right Click + Drag:</span> Pan camera
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Scroll:</span> Zoom in/out
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">In VR Mode (Touch Controllers)</h3>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Thumbstick:</span> Teleport / Move
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Grip Button:</span> Grab objects / UI
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Trigger:</span> Interact with buttons
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Section 3: User Roles & Features */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">👥</span>
                        Features & Roles
                    </h2>
                    <div className="space-y-6 text-slate-400">
                        <div>
                            <strong className="text-white block mb-1">Students</strong>
                            Explore the entire repository, view models in 3D/VR, download standard CAD files (STEP), and join workshops hosted by teachers.
                        </div>
                        <div>
                            <strong className="text-white block mb-1">Teachers & Admins</strong>
                            Upload new models (GLB), set up educational hotspots, host multi-user workshops, and manage the repository.
                        </div>
                        <div>
                            <strong className="text-white block mb-1">Collaborative Workshops</strong>
                            Teachers can spawn a "Room" where multiple students can join in VR. Everyone sees the same model and can interact with it together in real-time.
                        </div>
                    </div>
                </div>

                {/* Section 4: Gamified Learning */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">🎓</span>
                        Interactive & Gamified Learning
                    </h2>
                    <div className="space-y-6 text-slate-400">
                        <div>
                            <strong className="text-white block mb-1">Guided Lessons</strong>
                            Take step-by-step lessons created by teachers. Split-screen view allows you to read instructions while interacting with the 3D equipment.
                        </div>
                        <div>
                            <strong className="text-white block mb-1">Quizzes</strong>
                            Test your knowledge with built-in multiple choice questions. Receive instant feedback on your answers.
                        </div>
                        <div>
                            <strong className="text-white block mb-1">"Find the Part" Challenges</strong>
                            Put your skills to the test in the 3D environment. You'll be asked to locate specific components (e.g., "Find the Emergency Stop Button") and confirm by clicking on the actual 3D mesh.
                        </div>
                        <div>
                            <strong className="text-white block mb-1">Progress Tracking</strong>
                            Your progress is automatically saved. Teachers can monitor class performance via the **Teacher Dashboard**.
                        </div>
                    </div>
                </div>

                {/* Section 5: Offline & Installation */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">📱</span>
                        Install App (Offline Mode)
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold text-white mb-4">How to Install</h3>
                            <ul className="space-y-3 text-slate-400">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Desktop (Chrome/Edge):</span> Click the install icon (Computer with Down Arrow) in the right of the address bar.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">Android (Chrome):</span> Tap the menu (⋮) → "Install App" or "Add to Home Screen".
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-200">iOS (Safari):</span> Tap the Share button → "Add to Home Screen".
                                </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-4">Offline Capabilities</h3>
                            <p className="text-slate-400 mb-4">
                                Once installed, the app works even without an internet connection.
                            </p>
                            <ul className="list-disc list-inside text-slate-400 space-y-2">
                                <li>Launch the app instantly from your home screen.</li>
                                <li>View previously opened models and lessons.</li>
                                <li>Navigate the interface and dashboard.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="text-center pt-8">
                    <p className="text-slate-500 mb-4">Still have questions?</p>
                    <a href="mailto:support@thegear.app" className="text-indigo-400 hover:text-indigo-300 font-bold hover:underline">
                        Contact Support
                    </a>
                </div>
            </div>
        </div>
    );
};

export default HelpPage;
