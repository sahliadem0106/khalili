
import React, { useState, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from './ui/Button';

export interface TourStep {
  targetId: string;
  title: string;
  content: string;
}

interface GuidedTourProps {
  isOpen: boolean;
  steps: TourStep[];
  onClose: () => void;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, steps, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Reset when opening and Lock Scroll
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsReady(true);
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      setIsReady(false);
      // Unlock body scroll
      document.body.style.overflow = '';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Update position when step changes or resize
  useLayoutEffect(() => {
    if (!isOpen || !isReady) return;

    const updatePosition = () => {
      const step = steps[currentStep];
      if (!step) return;

      const element = document.getElementById(step.targetId);
      if (element) {
        // Scroll into view first
        element.scrollIntoView({ behavior: 'auto', block: 'center', inline: 'center' });
        
        // Then get rect
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
      } else {
        console.warn(`Tour target #${step.targetId} not found`);
        setTargetRect(null); 
      }
    };

    // Small delay to allow scroll to finish/layout to stabilize
    const timer = setTimeout(updatePosition, 150);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      clearTimeout(timer);
    };
  }, [currentStep, isOpen, isReady, steps]);

  if (!isOpen || !isReady) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  let arrowClass = "";

  if (targetRect) {
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const tooltipHeight = 180; // Approximate max height

    // Default to below, switch to above if not enough space below AND more space above
    if (spaceBelow < tooltipHeight && spaceAbove > spaceBelow) {
       // Place above
       tooltipStyle = {
         bottom: (window.innerHeight - targetRect.top) + 12,
         left: Math.max(16, Math.min(targetRect.left + (targetRect.width / 2) - 150, window.innerWidth - 316)),
       };
       arrowClass = "-bottom-2 left-1/2 -translate-x-1/2 border-t-white border-b-transparent";
    } else {
       // Place below
       tooltipStyle = {
         top: targetRect.bottom + 12,
         left: Math.max(16, Math.min(targetRect.left + (targetRect.width / 2) - 150, window.innerWidth - 316)),
       };
       arrowClass = "-top-2 left-1/2 -translate-x-1/2 border-b-white border-t-transparent";
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] animate-in fade-in duration-300">
      
      {/* Spotlight Overlay */}
      {targetRect && (
        <div 
          className="absolute inset-0 transition-all duration-500 ease-in-out"
          style={{
            // The box-shadow trick to dim everything except the target
            boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.75)`,
            borderRadius: '16px',
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
          }}
        />
      )}
      
      {/* Clickable backdrop */}
      <div className="absolute inset-0 pointer-events-auto" onClick={(e) => e.stopPropagation()} />

      {/* Tooltip Card */}
      {targetRect && (
        <div 
          className="absolute w-[300px] bg-white rounded-2xl shadow-2xl p-5 transition-all duration-500 ease-in-out z-[10000]"
          style={tooltipStyle}
        >
          {/* Arrow */}
          <div className={`absolute w-4 h-4 border-8 border-x-transparent ${arrowClass}`} />

          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-2">
               <span className="bg-brand-forest text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                 {currentStep + 1} / {steps.length}
               </span>
               <h3 className="font-bold text-neutral-primary text-sm">{step.title}</h3>
            </div>
            <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
              <X size={16} />
            </button>
          </div>
          
          <p className="text-xs text-neutral-muted mb-5 leading-relaxed">
            {step.content}
          </p>

          <div className="flex justify-between items-center">
            <button 
               onClick={handlePrev} 
               disabled={currentStep === 0}
               className={`text-neutral-400 hover:text-brand-forest transition-colors ${currentStep === 0 ? 'opacity-0 cursor-default' : 'opacity-100'}`}
            >
               <ChevronLeft size={20} />
            </button>
            
            <div className="flex space-x-2">
              <button onClick={onClose} className="text-xs font-medium text-neutral-400 hover:text-neutral-600 px-3 py-2">
                Skip
              </button>
              <Button size="sm" onClick={handleNext} className="px-4 h-8 text-xs">
                {isLast ? 'Finish' : 'Next'} {isLast ? null : <ChevronRight size={14} className="ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
