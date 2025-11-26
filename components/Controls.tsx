import React from 'react';
import { Mic } from 'lucide-react';
import clsx from 'clsx';

interface ControlsProps {
  onMainClick: () => void;
  isRecording: boolean;
}

const Controls: React.FC<ControlsProps> = ({ 
  onMainClick, 
  isRecording,
}) => {
  
  return (
    <div className="flex items-center justify-center mt-8">
        
        {/* Main Action Button (Big) */}
        <div className="flex flex-col items-center gap-2">
            <button
                onMouseDown={onMainClick}
                onTouchStart={onMainClick} // Simple touch support
                className={clsx(
                    "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 shadow-[0_6px_0_rgb(153,27,27)] active:shadow-none active:translate-y-[6px] border-4",
                    isRecording 
                        ? "bg-red-500 border-red-400 text-white animate-pulse shadow-[0_6px_0_rgb(120,20,20)]" 
                        : "bg-gradient-to-br from-red-500 to-red-600 border-red-400 text-white hover:brightness-110"
                )}
            >
                <div className={clsx("transition-transform", isRecording ? "scale-110" : "scale-100")}>
                    {isRecording ? (
                        <div className="w-8 h-8 bg-white rounded-sm animate-pulse" /> // Stop icon
                    ) : (
                        <Mic size={32} fill="white" className="drop-shadow-md" />
                    )}
                </div>
            </button>
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">
                {isRecording ? "Stop" : "Talk"}
            </span>
        </div>

    </div>
  );
};

export default Controls;