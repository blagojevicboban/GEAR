import React from 'react';

interface FileDownloadViewerProps {
    fileUrl: string;
    onExit: () => void;
    fileName?: string;
}

const FileDownloadViewer: React.FC<FileDownloadViewerProps> = ({
    fileUrl,
    onExit,
    fileName,
}) => {
    // Extract filename from URL if not provided
    const displayFileName =
        fileName || fileUrl.split('/').pop()?.split('?')[0] || 'Unknown File';

    // Clean URL for download (remove fragments like #step)
    const cleanUrl = fileUrl.split('#')[0];

    return (
        <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col">
            {/* Header */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-slate-900/90 to-transparent">
                <button
                    onClick={onExit}
                    className="bg-slate-800/80 backdrop-blur-md text-white px-6 py-2 rounded-full font-bold hover:bg-slate-700 transition-all border border-slate-600"
                >
                    ← Back to Gallery
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <div className="bg-slate-800/50 border border-slate-700 p-12 rounded-3xl max-w-2xl w-full backdrop-blur-sm shadow-2xl flex flex-col items-center">
                    <div className="w-32 h-32 bg-indigo-500/20 rounded-full flex items-center justify-center mb-8 border-2 border-indigo-500/50 shadow-[0_0_50px_rgba(99,102,241,0.3)]">
                        <svg
                            className="w-16 h-16 text-indigo-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="1.5"
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    </div>

                    <h2 className="text-3xl font-bold text-white mb-2">
                        {displayFileName}
                    </h2>
                    <div className="flex items-center gap-2 mb-8">
                        <span className="px-3 py-1 bg-slate-700 rounded-full text-xs font-bold text-slate-300 uppercase tracking-wider">
                            CAD Model
                        </span>
                        <span className="px-3 py-1 bg-slate-700 rounded-full text-xs font-bold text-slate-300 uppercase tracking-wider">
                            STEP / STP
                        </span>
                    </div>

                    <p className="text-slate-400 mb-8 max-w-md">
                        This is a specialized CAD file format used for
                        industrial design and engineering. It cannot be
                        previewed directly in the browser.
                    </p>

                    <div className="flex flex-col gap-4 w-full max-w-sm">
                        <a
                            href={cleanUrl}
                            download
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                                />
                            </svg>
                            Download File
                        </a>

                        <button
                            onClick={onExit}
                            className="w-full py-4 bg-transparent hover:bg-slate-700/50 text-slate-400 rounded-xl font-semibold transition-all"
                        >
                            Cancel
                        </button>
                    </div>

                    <div className="mt-8 pt-8 border-t border-slate-700 w-full">
                        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4">
                            Recommended Software
                        </h3>
                        <div className="flex gap-4 justify-center flex-wrap">
                            <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded text-slate-400">
                                Fusion 360
                            </span>
                            <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded text-slate-400">
                                SolidWorks
                            </span>
                            <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded text-slate-400">
                                FreeCAD
                            </span>
                            <span className="text-xs bg-slate-900 border border-slate-700 px-3 py-1 rounded text-slate-400">
                                Rhino
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileDownloadViewer;
