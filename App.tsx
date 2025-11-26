import React, { useState, useEffect, useRef } from 'react';
import RobotFace from './components/RobotFace';
import WorkshopBackground from './components/WorkshopBackground';
import { RobotMode, EyeExpression, ScreenMode, ChatMessage } from './types';
import { generateRobotResponse } from './services/geminiService';
import { decodeAudioData } from './utils/audioUtils';
import clsx from 'clsx';

const App: React.FC = () => {
  // State
  const [powerStatus, setPowerStatus] = useState<'OFF' | 'BOOTING' | 'ON'>('OFF');
  const [mode, setMode] = useState<RobotMode>(RobotMode.IDLE);
  const [screenMode, setScreenMode] = useState<ScreenMode>(ScreenMode.HOME);
  const [expression, setExpression] = useState<EyeExpression>(EyeExpression.NORMAL);
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState<number>(0.6);
  const [brightness, setBrightness] = useState<number>(1.0);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  
  // Power State
  const [isCharging, setIsCharging] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(65);
  const [batteryApiSupported, setBatteryApiSupported] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  // Initialize Volume
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(volume, audioContextRef.current.currentTime, 0.1);
    }
  }, [volume]);

  // Real Battery API Integration
  useEffect(() => {
    let batteryManager: any = null;

    const updateBatteryStatus = () => {
      if (batteryManager) {
        setBatteryLevel(Math.floor(batteryManager.level * 100));
        setIsCharging(batteryManager.charging);
      }
    };

    const initBattery = async () => {
      // Check if the browser supports the Battery Status API
      if ('getBattery' in navigator) {
        try {
          batteryManager = await (navigator as any).getBattery();
          setBatteryApiSupported(true);
          
          // Initial read
          updateBatteryStatus();

          // Event listeners for changes
          batteryManager.addEventListener('chargingchange', updateBatteryStatus);
          batteryManager.addEventListener('levelchange', updateBatteryStatus);
        } catch (e) {
          console.log("Battery API detected but failed to initialize:", e);
          setBatteryApiSupported(false);
        }
      } else {
        setBatteryApiSupported(false);
      }
    };

    initBattery();

    return () => {
      if (batteryManager) {
        batteryManager.removeEventListener('chargingchange', updateBatteryStatus);
        batteryManager.removeEventListener('levelchange', updateBatteryStatus);
      }
    };
  }, []);

  // Charging Simulation Loop (Fallback for unsupported browsers)
  useEffect(() => {
    // If we have real battery data, do NOT run the simulation
    if (batteryApiSupported) return;

    let interval: any;
    if (isCharging) {
        // Simulate charging up to 100%
        interval = setInterval(() => {
            setBatteryLevel(prev => {
                if (prev >= 100) return 100;
                return prev + 1;
            });
        }, 800);
    }
    return () => clearInterval(interval);
  }, [isCharging, batteryApiSupported]);

  // Idle Animation
  useEffect(() => {
    const idleTimer = setInterval(() => {
      // Only run idle animation if powered ON
      if (powerStatus === 'ON' && mode === RobotMode.IDLE && screenMode === ScreenMode.HOME && !isCharging) {
        // Low Battery Logic (<20%) - Robot becomes predominantly Sleepy/Low Energy
        if (batteryLevel < 20) {
            setExpression(EyeExpression.SLEEPING);
            return;
        }

        // Randomly pick an expression: Happy, Wide, or Speechless (Sleeping)
        const expressions = [
          EyeExpression.HAPPY,
          EyeExpression.WIDE,
          EyeExpression.SLEEPING // Speechless / Bored
        ];
        
        const randomExpr = expressions[Math.floor(Math.random() * expressions.length)];
        setExpression(randomExpr);
        
        // Return to normal after 3 seconds
        setTimeout(() => setExpression(EyeExpression.NORMAL), 3000);
      }
    }, 10000); // Trigger every 10 seconds
    return () => clearInterval(idleTimer);
  }, [mode, screenMode, isCharging, batteryLevel, powerStatus]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const gainNode = ctx.createGain();
      gainNode.gain.value = volume;
      gainNode.connect(ctx.destination);
      audioContextRef.current = ctx;
      gainNodeRef.current = gainNode;
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  };

  const handlePowerOn = () => {
    initAudioContext(); // Initialize audio context on user interaction (power on)
    setPowerStatus('BOOTING');
    
    // Simulate boot sequence time
    setTimeout(() => {
      setPowerStatus('ON');
      setMode(RobotMode.IDLE);
    }, 2500);
  };

  const handlePowerOff = () => {
    stopAudioPlayback();
    if (isRecording) {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
    }
    setPowerStatus('OFF');
    setMode(RobotMode.OFF);
    setScreenMode(ScreenMode.HOME);
    setExpression(EyeExpression.NORMAL);
  };

  const handleToggleRecording = () => {
    initAudioContext();

    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
  };

  const startRecording = async () => {
    stopAudioPlayback();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setMode(RobotMode.LISTENING);
      setExpression(EyeExpression.LISTENING); 
    } catch (err) {
      console.error("Mic access denied", err);
    }
  };

  const handleAIInteraction = async (input: string | Blob) => {
    setMode(RobotMode.THINKING);
    setExpression(EyeExpression.LOADING);

    // Add User Message to History
    const userText = typeof input === 'string' ? input : '🎤 Voice Message';
    setChatHistory(prev => [...prev, { role: 'user', text: userText }]);

    const result = await generateRobotResponse(input);
    
    // Add Model Message to History
    if (result.text) {
       setChatHistory(prev => [...prev, { role: 'model', text: result.text }]);
    }

    if (result.audioBase64) {
      playAudioResponse(result.audioBase64);
    } else {
      setMode(RobotMode.IDLE);
      setExpression(EyeExpression.NORMAL);
    }
  };

  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      setIsRecording(false);
      
      handleAIInteraction(audioBlob);
    };

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
  };

  const playAudioResponse = async (base64: string) => {
    if (!audioContextRef.current || !gainNodeRef.current) return;
    const ctx = audioContextRef.current;

    try {
      const audioBuffer = await decodeAudioData(base64, ctx);
      stopAudioPlayback();

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(gainNodeRef.current);
      
      source.onended = () => {
        setMode(RobotMode.IDLE);
        setExpression(EyeExpression.NORMAL);
      };

      audioSourceRef.current = source;
      source.start();
      
      setMode(RobotMode.SPEAKING);
      setExpression(EyeExpression.HAPPY);
    } catch (e) {
      console.error("Audio playback error", e);
      setMode(RobotMode.IDLE);
      setExpression(EyeExpression.NORMAL);
    }
  };

  const stopAudioPlayback = () => {
    if (audioSourceRef.current) {
      try { audioSourceRef.current.stop(); } catch(e) {}
      audioSourceRef.current = null;
    }
  };

  // Click Face to Open Menu
  const handleScreenClick = () => {
    if (powerStatus !== 'ON') return; // Do nothing if not powered on

    if (screenMode === ScreenMode.HOME) {
        initAudioContext();
        setScreenMode(ScreenMode.MENU);
    }
  };

  // Click Eyes to trigger Wide expression (Interaction)
  const handleEyeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (powerStatus !== 'ON') return;
    
    setExpression(EyeExpression.WIDE);
    setTimeout(() => setExpression(EyeExpression.NORMAL), 2000);
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center p-4 relative overflow-hidden font-nunito selection:bg-cyan-500/30">
      
      {/* Workshop Background */}
      <WorkshopBackground />

      {/* Type-C Simulation Control (Visible ONLY if real API is unsupported) */}
      {!batteryApiSupported && (
          <button 
            onClick={() => setIsCharging(!isCharging)}
            className={clsx(
                "fixed bottom-4 right-4 z-50 px-4 py-2 rounded-full font-bold text-xs transition-all shadow-lg flex items-center gap-2",
                isCharging ? "bg-green-500 text-black shadow-green-500/50" : "bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700"
            )}
          >
            <span className={clsx("w-2 h-2 rounded-full", isCharging ? "bg-black animate-pulse" : "bg-gray-500")}></span>
            {isCharging ? "Type-C Connected (Sim)" : "Connect Type-C (Sim)"}
          </button>
      )}

      {/* Main Container */}
      <div className="z-10 w-full max-w-lg flex flex-col items-center">
        
        {/* SHARK BOO BODY (3D Volumetric) */}
        <div className="relative group transition-transform duration-500 hover:-translate-y-2">
            
            {/* Top Fin (Behind) */}
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[30px] border-l-transparent border-r-[30px] border-r-transparent border-b-[90px] border-b-blue-500 rounded-t-lg rotate-[-6deg] z-0 drop-shadow-xl"></div>

            {/* Arms/Fins (Behind) - Elongated */}
            <div className="absolute -left-16 top-32 w-32 h-44 bg-blue-500 rounded-[20%_0_0_90%] origin-right rotate-[-25deg] shadow-[-5px_10px_15px_rgba(0,0,0,0.3)] z-0 border-l border-white/5 transition-transform hover:rotate-[-30deg]"></div>
            <div className="absolute -right-16 top-32 w-32 h-44 bg-blue-500 rounded-[0_20%_90%_0] origin-left rotate-[25deg] shadow-[5px_10px_15px_rgba(0,0,0,0.3)] z-0 border-r border-white/5 transition-transform hover:rotate-[30deg]"></div>

            {/* Legs (Behind) - Elongated & Fin-like */}
            <div className="absolute -bottom-8 left-16 w-20 h-32 bg-blue-500 rounded-b-[4rem] rounded-tl-3xl shadow-lg z-0 rotate-[10deg]"></div>
            <div className="absolute -bottom-8 right-16 w-20 h-32 bg-blue-500 rounded-b-[4rem] rounded-tr-3xl shadow-lg z-0 rotate-[-10deg]"></div>

            {/* Body Structure Wrapper */}
            <div className="relative w-80 h-[26rem]">
                
                {/* EYES (Physical - Top of Head, Symmetrical) */}
                <div className="absolute top-4 left-20 w-8 h-8 bg-black rounded-full shadow-[inset_3px_3px_6px_rgba(255,255,255,0.4),0_5px_10px_rgba(0,0,0,0.4)] z-20"></div>
                <div className="absolute top-4 right-20 w-8 h-8 bg-black rounded-full shadow-[inset_3px_3px_6px_rgba(255,255,255,0.4),0_5px_10px_rgba(0,0,0,0.4)] z-20"></div>

                {/* MAIN SKIN (Clipped Content) */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 rounded-[45%_45%_45%_45%_/_55%_55%_45%_45%] shadow-[inset_-20px_-20px_60px_rgba(0,0,0,0.5),inset_10px_10px_40px_rgba(255,255,255,0.3),0_30px_60px_rgba(0,0,0,0.6)] z-10 overflow-hidden">
                    
                    {/* Wrapped White Belly */}
                    {/* Full width at bottom, curved top to look like underbelly */}
                    <div className="absolute bottom-0 left-0 w-full h-[45%] bg-gradient-to-t from-gray-50 to-gray-100 rounded-t-[50%] shadow-[inset_0_5px_15px_rgba(0,0,0,0.05)]"></div>

                    {/* Shark Patch */}
                    <div className="absolute bottom-16 right-10 bg-red-600 text-white font-black text-[10px] px-3 py-1 rotate-[-12deg] border border-white/50 shadow-md tracking-[0.2em] rounded z-20 opacity-90 transform hover:scale-105 transition-transform">
                        SHARK
                    </div>
                </div>

                {/* THE MOUTH / SCREEN (On Top of Skin) */}
                <div 
                  className="absolute top-12 left-1/2 -translate-x-1/2 w-[85%] h-[42%] bg-black rounded-[40%_40%_45%_45%_/_50%_50%_50%_50%] border-[12px] border-red-600 shadow-[inset_0_0_30px_rgba(0,0,0,1),0_5px_0_rgba(0,0,0,0.1)] z-30 overflow-hidden ring-1 ring-black/20 transition-all duration-300 cursor-pointer"
                  style={{ filter: `brightness(${brightness})` }}
                  onClick={handleScreenClick}
                >
                   <RobotFace 
                     expression={expression} 
                     mode={mode}
                     screenMode={screenMode}
                     onScreenChange={setScreenMode}
                     audioLevel={isRecording ? 100 : 0} 
                     volume={volume}
                     onVolumeChange={setVolume}
                     brightness={brightness}
                     onBrightnessChange={setBrightness}
                     chatHistory={chatHistory}
                     onSendMessage={handleAIInteraction}
                     isRecording={isRecording}
                     onToggleRecording={handleToggleRecording}
                     isCharging={isCharging}
                     batteryLevel={batteryLevel}
                     onEyeClick={handleEyeClick}
                     powerStatus={powerStatus}
                     onPowerOn={handlePowerOn}
                     onPowerOff={handlePowerOff}
                   />
                </div>

            </div>
        </div>
        
      </div>
    </div>
  );
};

export default App;