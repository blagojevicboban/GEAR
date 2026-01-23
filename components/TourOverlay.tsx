import React, { useEffect, useState, useRef } from 'react';
import { TourStep } from '../types';

interface TourOverlayProps {
    steps: TourStep[];
    currentStepIndex: number;
    isOpen: boolean;
    onNext: () => void;
    onPrev: () => void;
    onClose: () => void;
}

const TourOverlay: React.FC<TourOverlayProps> = ({ steps, currentStepIndex, isOpen, onNext, onPrev, onClose }) => {
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
    const currentStep = steps[currentStepIndex];
    const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updatePosition = () => {
        if (!currentStep) return;

        const element = document.getElementById(currentStep.targetId);
        if (element) {
            const rect = element.getBoundingClientRect();
            // If the element is hidden or zero size, retry briefly
            if (rect.width === 0 && rect.height === 0) {
                // Retry logic could go here
            } else {
                setTargetRect(rect);
            }
        } else {
            // If element not found, we might want to wait a bit (e.g. for view transition)
            setTargetRect(null);
        }
    };

    useEffect(() => {
        if (isOpen) {
            // Update immediately
            updatePosition();

            // And keep updating on resize/scroll
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);

            // Also set an interval to check for the element (useful during view transitions)
            const interval = setInterval(updatePosition, 500);

            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
                clearInterval(interval);
            };
        }
    }, [isOpen, currentStepIndex, currentStep]);


    if (!isOpen || !currentStep) return null;

    // Calculate Tooltip Position
    let tooltipStyle: React.CSSProperties = {};
    if (targetRect) {
        if (currentStep.position === 'center') {
            tooltipStyle = {
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            };
        } else {
            // Default offset
            const gap = 12;

            // Basic logic - can be improved with Popper.js
            if (currentStep.position === 'bottom') {
                tooltipStyle = {
                    top: targetRect.bottom + gap,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translateX(-50%)'
                };
            } else if (currentStep.position === 'top') {
                tooltipStyle = {
                    top: targetRect.top - gap,
                    left: targetRect.left + targetRect.width / 2,
                    transform: 'translate(-50%, -100%)'
                };
            } else if (currentStep.position === 'right') {
                tooltipStyle = {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.right + gap,
                    transform: 'translateY(-50%)'
                };
            } else if (currentStep.position === 'left') {
                tooltipStyle = {
                    top: targetRect.top + targetRect.height / 2,
                    left: targetRect.left - gap,
                    transform: 'translate(-100%, -50%)'
                };
            } else {
                // Fallback to center if unspecified
                tooltipStyle = {
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                };
            }
        }
    } else {
        // Fallback if element not found yet
        tooltipStyle = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }


    return (
        <div className="fixed inset-0 z-[100] pointer-events-auto">
            {/* Backdrop with hole using mix-blend-mode or SVG clip path is complex. 
                 Using a simpler Approach: Semi-transparent background everywhere, 
                 High z-index target? No, that requires modifying target styles.
                 Better: Render 4 divs around the target rect to create the dim effect.
             */}

            {/* Dimming Layer */}
            <div className="absolute inset-0 bg-black/70 transition-all duration-300" style={{
                maskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 1.5}px, black ${Math.max(targetRect.width, targetRect.height) / 1.4}px)` : 'none',
                WebkitMaskImage: targetRect ? `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${(Math.max(targetRect.width, targetRect.height) / 2)}px, black ${(Math.max(targetRect.width, targetRect.height) / 2) + 20}px)` : 'none'
            }} />

            {/* Spotlight Halo (Optional visual flair) */}
            {targetRect && (
                <div
                    className="absolute border-2 border-indigo-500/50 rounded-lg shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out pointer-events-none"
                    style={{
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                    }}
                />
            )}

            {/* Tooltip Card */}
            <div
                className="absolute w-80 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 transition-all duration-300"
                style={tooltipStyle}
            >
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl font-bold text-white">{currentStep.title}</h3>
                    <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-1 rounded-full">
                        {currentStepIndex + 1} / {steps.length}
                    </span>
                </div>

                <p className="text-slate-400 mb-6 text-sm leading-relaxed">
                    {currentStep.content}
                </p>

                <div className="flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Skip
                    </button>

                    <div className="flex gap-2">
                        {currentStepIndex > 0 && (
                            <button
                                onClick={onPrev}
                                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-bold transition-all"
                            >
                                Back
                            </button>
                        )}
                        <button
                            onClick={onNext}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all"
                        >
                            {currentStepIndex === steps.length - 1 ? 'Finish' : 'Next'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TourOverlay;
