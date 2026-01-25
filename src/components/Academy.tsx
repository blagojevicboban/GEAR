import React, { useState } from 'react';

const Academy: React.FC = () => {
    const [activeCategory, setActiveCategory] = useState<'basics' | 'creation' | 'pedagogy'>('basics');

    const VIDEOS = {
        basics: [
            { id: 1, title: 'Installing GEAR Locally', duration: '5:20', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Deploying Docker containers in schools.' },
            { id: 2, title: 'Navigating the 3D Repo', duration: '3:15', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Finding and filtering VET models.' },
        ],
        creation: [
            { id: 3, title: 'Creating Your First Lesson', duration: '8:45', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Using the Workbook Editor.' },
            { id: 4, title: 'Adding Interactive Hotspots', duration: '4:30', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Attaching media to 3D parts.' },
        ],
        pedagogy: [
            { id: 5, title: 'Bloom\'s Taxonomy in VR', duration: '12:00', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: 'Structuring learning outcomes.' },
            { id: 6, title: 'Flipped Classroom with GEAR', duration: '9:10', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', desc: ' assigning VR homework.' },
        ]
    };

    return (
        <div className="max-w-7xl mx-auto px-6 py-12">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">GEAR Academy</h1>
                <p className="text-slate-400 max-w-2xl mx-auto">
                    Master the platform and upgrade your teaching methodology.
                    The MOOC Suite provides certified training for VET educators.
                </p>
            </div>

            {/* Category Tabs */}
            <div className="flex justify-center gap-4 mb-12">
                {(['basics', 'creation', 'pedagogy'] as const).map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-6 py-2 rounded-full font-bold capitalize transition-all ${activeCategory === cat
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/25 scale-105'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                    >
                        {cat === 'basics' ? '🛠️ Platform Basics' : cat === 'creation' ? '🎨 Content Creation' : '🎓 Pedagogy'}
                    </button>
                ))}
            </div>

            {/* Video Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {VIDEOS[activeCategory].map(video => (
                    <div key={video.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors group">
                        <div className="aspect-video relative bg-black">
                            <iframe
                                src={video.url}
                                title={video.title}
                                className="w-full h-full"
                                allowFullScreen
                                frameBorder="0"
                            ></iframe>
                        </div>
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-bold text-lg group-hover:text-indigo-400 transition-colors">{video.title}</h3>
                                <span className="text-xs font-mono bg-slate-800 px-2 py-1 rounded text-slate-400">{video.duration}</span>
                            </div>
                            <p className="text-sm text-slate-500">{video.desc}</p>

                            <button className="mt-4 w-full py-2 bg-slate-800/50 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-sm font-bold transition-all border border-slate-700 hover:border-indigo-500">
                                Mark as Completed
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Certification Banner */}
            <div className="mt-16 p-8 bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h3 className="text-2xl font-bold mb-2">Get Certified</h3>
                    <p className="text-slate-400">Complete all modules to receive your official Erasmus+ VET Digital Educator certificate.</p>
                </div>
                <button className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors shadow-lg">
                    Check My Progress
                </button>
            </div>
        </div>
    );
};

export default Academy;
