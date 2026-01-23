import React, { useState } from 'react';

interface InfoTooltipProps {
    content: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ content }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div
            className="relative inline-block ml-2"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            <div className="w-4 h-4 rounded-full border border-slate-500 text-slate-500 flex items-center justify-center text-[10px] cursor-help hover:border-indigo-400 hover:text-indigo-400 transition-colors">
                ?
            </div>

            {isVisible && (
                <div className="absolute z-50 w-64 p-3 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs text-slate-300 left-1/2 -translate-x-1/2 bottom-full mb-2 pointer-events-none animate-in fade-in slide-in-from-bottom-1">
                    {content}
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-2 h-2 bg-slate-900 border-r border-b border-slate-700 rotate-45 -mt-1"></div>
                </div>
            )}
        </div>
    );
};

export default InfoTooltip;
