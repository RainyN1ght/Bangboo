import React, { useEffect, useState, useRef } from 'react';
import { EyeExpression, RobotMode, ScreenMode, ChatMessage, MusicTrack } from '../types';
import clsx from 'clsx';
import { 
  Volume2, SkipBack, SkipForward, Play, Pause, 
  Music, Clock, Wifi, Battery, MessageCircle, Mic, ArrowLeft, Layers, Lock, Check, ChevronRight,
  Calendar, Sun, ChevronUp, ChevronDown, ListMusic, Plus, Trash2, ToggleLeft, ToggleRight, Zap, Power, Upload
} from 'lucide-react';

interface RobotFaceProps {
  expression: EyeExpression;
  mode: RobotMode;
  screenMode: ScreenMode;
  onScreenChange: (mode: ScreenMode) => void;
  audioLevel?: number; // 0-100 for visualizer
  volume?: number;
  onVolumeChange?: (volume: number) => void;
  brightness?: number;
  onBrightnessChange?: (b: number) => void;
  chatHistory?: ChatMessage[];
  onSendMessage?: (text: string) => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
  isCharging?: boolean;
  batteryLevel?: number;
  onEyeClick?: (e: React.MouseEvent) => void;
  powerStatus: 'OFF' | 'BOOTING' | 'ON';
  onPowerOn: () => void;
  onPowerOff: () => void;
}

// Tooth Component for the Shark Mouth - Chunkier
const Tooth: React.FC<{ inverted?: boolean }> = ({ inverted = false }) => (
  <div className={clsx(
    "w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent",
    inverted ? "border-t-[18px] border-t-gray-100 drop-shadow-sm" : "border-b-[18px] border-b-gray-100 drop-shadow-sm"
  )}></div>
);

// Custom Interactive Slider Component
const InteractiveSlider: React.FC<{ 
  value: number; 
  onChange: (val: number) => void; 
  colorClass: string; 
  thumbColorClass: string;
  icon?: React.ReactNode;
}> = ({ value, onChange, colorClass, thumbColorClass, icon }) => {
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleInteraction = (clientX: number) => {
    if (sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      const newValue = Math.max(0, Math.min(1, x / width));
      onChange(newValue);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleInteraction(e.clientX);
    const handleMouseMove = (ev: MouseEvent) => {
      ev.preventDefault();
      handleInteraction(ev.clientX);
    };
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    handleInteraction(e.touches[0].clientX);
    const handleTouchMove = (ev: TouchEvent) => {
        ev.preventDefault(); 
        handleInteraction(ev.touches[0].clientX);
    };
    const handleTouchEnd = () => {
       document.removeEventListener('touchmove', handleTouchMove as any);
       document.removeEventListener('touchend', handleTouchEnd);
    };
    document.addEventListener('touchmove', handleTouchMove as any, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
  };

  return (
    <div 
      ref={sliderRef}
      className="relative w-full h-6 flex items-center justify-center cursor-pointer touch-none"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      <div className="w-full h-1.5 bg-gray-700 rounded-lg overflow-hidden relative">
         <div 
           className={clsx("h-full absolute left-0 top-0", colorClass)} 
           style={{ width: `${value * 100}%` }}
         />
      </div>
      <div 
        className={clsx("absolute w-5 h-5 rounded-full shadow-lg border-2 border-white/20 transform -translate-x-1/2 flex items-center justify-center", thumbColorClass)}
        style={{ left: `${value * 100}%` }}
      >
        {icon && <div className="text-black/50">{icon}</div>}
      </div>
    </div>
  );
};

// Mock WiFi Networks
const MOCK_NETWORKS = [
  { ssid: 'SharkNet_5G', signal: 4, secure: true },
  { ssid: 'Ocean_Guest', signal: 3, secure: false },
  { ssid: 'Atlantis_Private', signal: 4, secure: true },
  { ssid: 'DeepBlue_Station', signal: 2, secure: true },
  { ssid: 'Coral_Reef_Free', signal: 3, secure: false },
];

// Default Demo Playlist (No Audio URLs)
const DEFAULT_PLAYLIST: MusicTrack[] = [
    { id: '1', title: 'Cyber Funk 2077', artist: 'Neon City', duration: '3:45' },
    { id: '2', title: 'Ocean Waves', artist: 'Relax LoFi', duration: '2:30' },
    { id: '3', title: 'Shark Attack', artist: 'Deep Blue', duration: '4:12' },
];

type SystemView = 'MAIN' | 'WIFI_LIST' | 'WIFI_AUTH' | 'TIME' | 'DISPLAY' | 'SOUND' | 'ALARM';
type MusicView = 'PLAYER' | 'PLAYLIST';
type AlarmEditMode = 'LIST' | 'EDIT';

interface Alarm {
    id: number;
    hour: number;
    minute: number;
    enabled: boolean;
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const RobotFace: React.FC<RobotFaceProps> = ({ 
  expression, 
  mode, 
  screenMode, 
  onScreenChange,
  audioLevel = 0,
  volume = 0.5,
  onVolumeChange = (_: number) => {},
  brightness = 1.0,
  onBrightnessChange = (_: number) => {},
  chatHistory = [],
  onSendMessage,
  isRecording = false,
  onToggleRecording,
  isCharging = false,
  batteryLevel = 85,
  onEyeClick,
  powerStatus,
  onPowerOn,
  onPowerOff
}) => {
  // Time
  const [timeOffset, setTimeOffset] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Music State
  const [playlist, setPlaylist] = useState<MusicTrack[]>(DEFAULT_PLAYLIST);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackProgress, setTrackProgress] = useState(0);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [musicView, setMusicView] = useState<MusicView>('PLAYER');
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(DEFAULT_PLAYLIST[0]);
  const [bars, setBars] = useState<number[]>(new Array(12).fill(10));
  
  // Audio Player Ref
  const audioRef = useRef<HTMLAudioElement>(new Audio());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // System App State
  const [systemView, setSystemView] = useState<SystemView>('MAIN');
  const [wifiScanning, setWifiScanning] = useState(false);
  const [availableNetworks, setAvailableNetworks] = useState<typeof MOCK_NETWORKS>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [connectedNetwork, setConnectedNetwork] = useState<string | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  // Alarm State
  const [alarms, setAlarms] = useState<Alarm[]>([
      { id: 1, hour: 7, minute: 30, enabled: true },
      { id: 2, hour: 9, minute: 0, enabled: false },
  ]);
  const [alarmEditMode, setAlarmEditMode] = useState<AlarmEditMode>('LIST');
  const [editingAlarmId, setEditingAlarmId] = useState<number | null>(null);
  const [editHour, setEditHour] = useState(8);
  const [editMinute, setEditMinute] = useState(0);

  // --- SYSTEM HANDLERS ---
  
  // Simulate WiFi Scan
  useEffect(() => {
    if (systemView === 'WIFI_LIST' && availableNetworks.length === 0) {
        setWifiScanning(true);
        setTimeout(() => {
            setAvailableNetworks(MOCK_NETWORKS);
            setWifiScanning(false);
        }, 1500);
    }
  }, [systemView, availableNetworks.length]);

  const handleNetworkSelect = (ssid: string) => {
    const network = availableNetworks.find(n => n.ssid === ssid);
    setSelectedNetwork(ssid);
    
    if (network?.secure) {
      setSystemView('WIFI_AUTH');
      setPasswordInput('');
    } else {
      // Simulate quick connect for open networks
      setIsConnecting(true);
      setSystemView('WIFI_AUTH');
      setTimeout(() => {
        setIsConnecting(false);
        setConnectedNetwork(ssid);
        setSystemView('WIFI_LIST');
      }, 1500);
    }
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      setConnectedNetwork(selectedNetwork);
      setSystemView('WIFI_LIST');
      setPasswordInput('');
    }, 2000);
  };

  // --- AUDIO LOGIC ---
  
  useEffect(() => {
    // Sync volume to audio element
    if (audioRef.current) {
        audioRef.current.volume = volume || 0.5;
    }
  }, [volume]);

  useEffect(() => {
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
        if (audio.duration) {
            setTrackProgress(audio.currentTime / audio.duration);
            setCurrentDuration(audio.duration);
        }
    };
    
    const handleEnded = () => {
        setIsPlaying(false);
        setTrackProgress(0);
        // Optional: Auto-play next track
        handleNextTrack();
    };

    const handleLoadedMetadata = () => {
        setCurrentDuration(audio.duration);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);

    return () => {
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  useEffect(() => {
     // Load track when currentTrack changes
     if (currentTrack.url) {
         audioRef.current.src = currentTrack.url;
         setTrackProgress(0);
         if (isPlaying) {
             audioRef.current.play().catch(e => console.error("Play failed", e));
         }
     } else {
         // Stop if it's a dummy track
         audioRef.current.pause();
         setTrackProgress(0);
     }
  }, [currentTrack]);

  useEffect(() => {
     if (currentTrack.url) {
         if (isPlaying) audioRef.current.play().catch(e => console.error("Play failed", e));
         else audioRef.current.pause();
     }
  }, [isPlaying]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
          const newTracks: MusicTrack[] = Array.from(files).map((file, index) => ({
              id: `local-${Date.now()}-${index}`,
              title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
              artist: 'Local Audio',
              duration: '--:--',
              url: URL.createObjectURL(file)
          }));
          
          setPlaylist(prev => {
              // Filter out the 'empty' placeholder if it exists
              const cleanPrev = prev.filter(t => t.id !== 'empty');
              return [...cleanPrev, ...newTracks];
          });
          
          // Use a flag or check against the closure's current state expectation
          const isPlaceholder = currentTrack.id === 'empty' || playlist.every(t => !t.url);

          if (isPlaceholder) {
              setCurrentTrack(newTracks[0]);
              setIsPlaying(true);
              setMusicView('PLAYER');
          }
      }
  };

  const handleDeleteTrack = (trackId: string) => {
    setPlaylist(prev => {
        const newPlaylist = prev.filter(t => t.id !== trackId);
        
        if (currentTrack.id === trackId) {
            setIsPlaying(false);
            if (audioRef.current) {
                audioRef.current.pause();
            }
            
            if (newPlaylist.length > 0) {
                setCurrentTrack(newPlaylist[0]);
            } else {
                // Placeholder for empty state
                setCurrentTrack({ id: 'empty', title: 'No Music', artist: 'Add tracks (+)', duration: '--:--' });
            }
        }
        return newPlaylist;
    });
  };

  const handleNextTrack = () => {
      const idx = playlist.findIndex(t => t.id === currentTrack.id);
      if (idx === -1 && playlist.length > 0) {
          setCurrentTrack(playlist[0]);
          return;
      }
      const nextIdx = (idx + 1) % playlist.length;
      setCurrentTrack(playlist[nextIdx]);
  };

  const handlePrevTrack = () => {
      const idx = playlist.findIndex(t => t.id === currentTrack.id);
      if (idx === -1 && playlist.length > 0) {
          setCurrentTrack(playlist[0]);
          return;
      }
      const prevIdx = (idx - 1 + playlist.length) % playlist.length;
      setCurrentTrack(playlist[prevIdx]);
  };

  const handleSeek = (val: number) => {
      if (audioRef.current && audioRef.current.duration) {
          const newTime = val * audioRef.current.duration;
          audioRef.current.currentTime = newTime;
          setTrackProgress(val);
      }
  };

  // --- TIME & ANIMATIONS ---

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date(Date.now() + timeOffset));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeOffset]);

  useEffect(() => {
    if (screenMode === ScreenMode.MUSIC && isPlaying && musicView === 'PLAYER') {
      const interval = setInterval(() => {
        setBars(prev => prev.map(() => Math.max(10, Math.random() * 100)));
      }, 100);
      return () => clearInterval(interval);
    } else {
      setBars(new Array(12).fill(10));
    }
  }, [screenMode, isPlaying, musicView]);

  const handleBack = (e?: React.SyntheticEvent) => {
    e?.stopPropagation();
    if (screenMode === ScreenMode.MUSIC && musicView === 'PLAYLIST') {
        setMusicView('PLAYER');
        return;
    }

    if (screenMode === ScreenMode.STATUS) {
        if (systemView !== 'MAIN') {
             if (systemView === 'WIFI_AUTH') {
                setSystemView('WIFI_LIST');
            } else if (systemView === 'ALARM' && alarmEditMode === 'EDIT') {
                setAlarmEditMode('LIST');
            } else {
                setSystemView('MAIN');
            }
            setPasswordInput('');
            return;
        }
    }
    onScreenChange(ScreenMode.MENU);
  };

  // --- RENDERERS ---

  const renderTeeth = () => (
    <>
      <div className="absolute top-[-2px] left-0 w-full flex justify-center gap-1.5 overflow-hidden h-8 z-20 px-6 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => <Tooth key={`top-${i}`} inverted />)}
      </div>
      <div className="absolute bottom-0 left-0 w-full flex justify-center gap-1.5 overflow-hidden h-8 z-20 px-6 items-end pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => <Tooth key={`btm-${i}`} />)}
      </div>
    </>
  );

  const renderPowerButton = () => (
    <div className="absolute inset-0 bg-black flex items-center justify-center z-50">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          onPowerOn();
        }}
        className="group relative flex items-center justify-center w-24 h-24 rounded-full bg-neutral-900 border-4 border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:shadow-[0_0_50px_rgba(6,182,212,0.4)] hover:border-cyan-400 transition-all duration-500 active:scale-95"
      >
        <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-20"></div>
        <Power size={48} className="text-cyan-500 group-hover:text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] transition-all" />
      </button>
      {renderTeeth()}
    </div>
  );

  const renderBootSequence = () => (
     <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-50 font-tech">
        <div className="text-center space-y-2 animate-pulse">
            <h1 className="text-2xl font-bold text-cyan-400 tracking-widest drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]">
                BANGBOO
            </h1>
            <p className="text-xs text-cyan-500/60 tracking-[0.3em]">IS READY</p>
        </div>
        <div className="w-32 h-1 bg-gray-800 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-cyan-400 animate-[scanline_2s_ease-in-out_infinite] w-full origin-left"></div>
        </div>
        {renderTeeth()}
     </div>
  );

  const renderFace = () => {
    let eyeLeftClass = "w-14 h-5 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15] rotate-[-8deg]";
    let eyeRightClass = "w-14 h-5 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15] rotate-[8deg]";
    let leftTransform = "";
    let rightTransform = "";
    let leftContent: React.ReactNode = null;
    let rightContent: React.ReactNode = null;

    if (expression === EyeExpression.HAPPY) {
      eyeLeftClass = "w-14 h-8 border-t-[6px] border-yellow-400 rounded-t-full shadow-[0_-5px_10px_#facc15] bg-transparent mt-2";
      eyeRightClass = "w-14 h-8 border-t-[6px] border-yellow-400 rounded-t-full shadow-[0_-5px_10px_#facc15] bg-transparent mt-2";
      leftTransform = "rotate-0";
      rightTransform = "rotate-0";
    } else if (expression === EyeExpression.SLEEPING) {
      eyeLeftClass = "w-14 h-1 bg-yellow-400 shadow-[0_0_5px_#facc15]";
      eyeRightClass = "w-14 h-1 bg-yellow-400 shadow-[0_0_5px_#facc15]";
    } else if (expression === EyeExpression.SURPRISED) {
      eyeLeftClass = "w-10 h-10 bg-transparent border-4 border-yellow-400 rounded-full shadow-[0_0_15px_#facc15]";
      eyeRightClass = "w-10 h-10 bg-transparent border-4 border-yellow-400 rounded-full shadow-[0_0_15px_#facc15]";
    } else if (expression === EyeExpression.LOADING || expression === EyeExpression.THINKING) {
      eyeLeftClass = "w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin";
      eyeRightClass = "hidden";
    } else if (mode === RobotMode.LISTENING || expression === EyeExpression.LISTENING) {
        eyeLeftClass = "w-12 h-12 rounded-full border-[6px] border-yellow-400 shadow-[0_0_20px_#facc15] animate-pulse";
        eyeRightClass = "w-12 h-12 rounded-full border-[6px] border-yellow-400 shadow-[0_0_20px_#facc15] animate-pulse";
    } else if (expression === EyeExpression.WIDE) {
        eyeLeftClass = "w-16 h-16 rounded-full border-[10px] border-yellow-400 bg-transparent shadow-[0_0_20px_#facc15]";
        eyeRightClass = "w-16 h-16 rounded-full border-[10px] border-yellow-400 bg-transparent shadow-[0_0_20px_#facc15]";
    } else if (expression === EyeExpression.WINKING) {
        eyeLeftClass = "w-14 h-5 bg-yellow-400 rounded-full shadow-[0_0_15px_#facc15]";
        eyeRightClass = "w-14 h-1.5 bg-yellow-400 rounded-full shadow-[0_0_5px_#facc15] mt-2";
        leftTransform = "rotate-[-8deg]";
        rightTransform = "rotate-0";
    } else if (expression === EyeExpression.DEAD) {
        return (
            <div className="absolute inset-0 bg-black flex items-center justify-center gap-10 z-10">
                <div className="text-yellow-400 text-6xl font-black font-sans shadow-[0_0_15px_#facc15]">X</div>
                <div className="text-yellow-400 text-6xl font-black font-sans shadow-[0_0_15px_#facc15]">X</div>
                {renderTeeth()}
            </div>
        )
    }

    const handleEyeClick = (e: React.MouseEvent) => {
        if (onEyeClick) onEyeClick(e);
    };

    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center gap-10 z-10 transition-all duration-300">
        <div 
            onClick={handleEyeClick}
            className={clsx("transition-all duration-300 transform cursor-pointer hover:scale-110", eyeLeftClass, leftTransform)}
        >
            {leftContent}
        </div>
        <div 
            onClick={handleEyeClick}
            className={clsx("transition-all duration-300 transform cursor-pointer hover:scale-110", eyeRightClass, rightTransform)}
        >
            {rightContent}
        </div>
        {renderTeeth()}
      </div>
    );
  };

  const renderCharging = () => {
    const radius = 40; 
    const strokeWidth = 8;
    const size = 120; 
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - ((batteryLevel || 0) / 100) * circumference;

    return (
      <div className="absolute inset-0 bg-black flex items-center justify-center z-10 font-tech">
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
             <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
                <circle 
                    cx={center} cy={center} r={radius} 
                    stroke="#1e293b" 
                    strokeWidth={strokeWidth}
                    fill="transparent" 
                />
                <circle 
                    cx={center} cy={center} r={radius} 
                    stroke="#22d3ee" 
                    strokeWidth={strokeWidth}
                    fill="transparent" 
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="drop-shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-500 ease-out"
                />
             </svg>
             <div className="flex flex-col items-center justify-center z-10 animate-pulse pb-1">
                <Zap size={20} className={clsx("mb-0.5", batteryLevel === 100 ? "text-green-400" : "text-cyan-400")} fill={batteryLevel === 100 ? "currentColor" : "none"} />
                <span className="text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{batteryLevel}%</span>
             </div>
        </div>
        {renderTeeth()}
      </div>
    );
  };

  const renderMenu = () => {
    const apps = [
      { id: ScreenMode.MUSIC, icon: Music, label: 'Music' },
      { id: ScreenMode.CHAT, icon: MessageCircle, label: 'Chat' },
      { id: ScreenMode.CLOCK, icon: Clock, label: 'Clock' },
      { id: ScreenMode.STATUS, icon: Layers, label: 'System' },
      { id: 'POWER_OFF', icon: Power, label: 'Power Off' },
    ];

    return (
      <div className="absolute inset-0 bg-black flex flex-col z-30">
        <div className="flex-1 flex items-center overflow-hidden w-full relative">
           <button 
             onClick={(e) => {
                 e.stopPropagation();
                 onScreenChange(ScreenMode.HOME);
             }}
             className="absolute left-3 z-50 p-2 text-white/40 hover:text-white transition-colors hover:bg-white/10 rounded-full"
           >
             <ArrowLeft size={24} />
           </button>

           <div className="flex items-center overflow-x-auto snap-x snap-mandatory no-scrollbar touch-pan-x w-full pl-12">
             <div className="flex items-center gap-6 px-4 py-4 min-w-full">
              {apps.map((app) => (
                  <button
                  key={app.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (app.id === 'POWER_OFF') {
                        onPowerOff();
                        return;
                    }
                    if (app.id === ScreenMode.STATUS) setSystemView('MAIN');
                    if (app.id === ScreenMode.MUSIC) setMusicView('PLAYER');
                    onScreenChange(app.id as ScreenMode);
                  }}
                  className="flex-shrink-0 flex flex-col items-center justify-center gap-3 snap-center group w-20"
                  >
                  <div className={clsx(
                      "w-16 h-16 rounded-2xl flex items-center justify-center text-white transition-all duration-300 group-hover:text-black group-hover:scale-105 group-active:scale-95 shadow-lg shadow-white/5 border",
                      app.id === 'POWER_OFF' ? "bg-red-900/40 border-red-500/30 group-hover:bg-red-500" : "bg-neutral-900 border-white/20 group-hover:bg-white"
                  )}>
                      <app.icon size={28} strokeWidth={1.5} />
                  </div>
                  <span className={clsx("text-[10px] font-sans tracking-wide font-medium group-hover:text-white", app.id === 'POWER_OFF' ? "text-red-400" : "text-white/60")}>{app.label}</span>
                  </button>
              ))}
              <div className="w-4 flex-shrink-0"></div>
             </div>
           </div>
        </div>
        <div className="absolute bottom-6 w-full flex justify-center gap-1.5 pointer-events-none opacity-50">
            {apps.map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-white/40"></div>)}
        </div>
        {renderTeeth()}
      </div>
    );
  };

  const renderChat = () => (
    <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-40 text-cyan-400 font-tech">
        <button onClick={handleBack} className="absolute top-6 left-6 p-2 hover:bg-white/10 hover:text-white rounded-full transition-colors z-50">
            <ArrowLeft size={18} />
        </button>
        <div className="flex flex-col items-center justify-center gap-4 scale-75 origin-center">
            {onToggleRecording && (
                <button 
                    onClick={onToggleRecording}
                    className={clsx(
                        "w-24 h-24 rounded-full transition-all duration-300 flex items-center justify-center border-4 shadow-lg",
                        isRecording 
                            ? "bg-red-500/20 text-red-500 border-red-500/50 animate-pulse shadow-[0_0_20px_red] scale-110" 
                            : "bg-cyan-900/40 text-cyan-400 border-cyan-500/30 hover:bg-cyan-500/20 hover:text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:scale-105"
                    )}
                >
                    <Mic size={40} />
                </button>
            )}
            <span className={clsx("text-xs font-bold tracking-widest", isRecording ? "text-red-400 animate-pulse" : "text-cyan-500/50")}>
                {isRecording ? "LISTENING..." : "TAP TO TALK"}
            </span>
        </div>
        {renderTeeth()}
    </div>
  );

  const renderMusicPlaylist = () => (
    <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col p-4 z-40 font-tech text-cyan-400">
        <div className="flex items-center justify-between mb-2 border-b border-cyan-500/30 pb-2 pt-2">
            <div className="flex items-center gap-2">
                <button onClick={(e) => setMusicView('PLAYER')} className="hover:text-white p-1"><ArrowLeft size={16} /></button>
                <span className="text-[10px] font-bold tracking-wider text-white">PLAYLIST</span>
            </div>
            
            {/* File Upload Button */}
            <label className="p-1 hover:bg-white/10 rounded cursor-pointer text-cyan-400 hover:text-white">
                <Plus size={16} />
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="audio/*" 
                    multiple 
                />
            </label>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1 pb-6">
            {playlist.length === 0 && (
                <div className="text-center text-gray-500 text-[10px] mt-10 italic">
                    Playlist is empty.<br/>Click + to add music.
                </div>
            )}
            {playlist.map((track, i) => (
                <div 
                    key={track.id}
                    className={clsx(
                        "w-full rounded text-[10px] flex items-center justify-between transition-colors pr-2 group",
                        currentTrack.id === track.id ? "bg-cyan-900/50 border border-cyan-500/30" : "bg-white/5 hover:bg-white/10 border border-transparent"
                    )}
                >
                    <button 
                        onClick={(e) => { setCurrentTrack(track); setMusicView('PLAYER'); }}
                        className="flex-1 text-left p-2 flex flex-col truncate"
                    >
                        <span className={clsx("font-bold truncate", currentTrack.id === track.id ? "text-white" : "text-gray-300")}>{track.title}</span>
                        <span className="text-[8px] text-gray-400 truncate">{track.artist}</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {currentTrack.id === track.id && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_5px_cyan] flex-shrink-0"></div>}
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTrack(track.id);
                            }}
                            className="p-1.5 text-gray-600 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
        {renderTeeth()}
    </div>
  );

  const renderMusicPlayer = () => {
    // Current times
    const currentTimeStr = formatTime(audioRef.current?.currentTime || 0);
    const durationStr = currentDuration ? formatTime(currentDuration) : (currentTrack.duration || '--:--');

    return (
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex flex-col items-center justify-center z-40 font-tech overflow-hidden">
        <div className="w-full h-full flex flex-col items-center justify-center py-2 px-6 gap-0.5 scale-90 origin-center">
            
            {/* Header */}
            <div className="flex items-center justify-between w-full max-w-[180px] mb-1.5 px-1 mt-2">
                <button onClick={handleBack} className="text-cyan-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors">
                    <ArrowLeft size={14} />
                </button>
                
                <div className="flex-1 text-center overflow-hidden px-2">
                    <h3 className="text-white font-bold text-[10px] tracking-wider truncate">{currentTrack.title}</h3>
                    <p className="text-[8px] text-gray-400 truncate">{currentTrack.artist}</p>
                    {!currentTrack.url && currentTrack.id !== 'empty' && <p className="text-[7px] text-yellow-500 mt-0.5">DEMO ONLY</p>}
                </div>

                <button onClick={(e) => setMusicView('PLAYLIST')} className="text-cyan-400 hover:text-white p-1 rounded-full hover:bg-white/5 transition-colors">
                    <ListMusic size={14} />
                </button>
            </div>

            {/* Visualizer */}
            <div className="flex items-end justify-center gap-0.5 h-6 w-full max-w-[140px] mb-1">
            {bars.map((height, i) => (
                <div 
                key={i} 
                className="w-1.5 bg-gradient-to-t from-pink-500 to-cyan-400 rounded-full transition-all duration-100 ease-in-out shadow-[0_0_5px_rgba(236,72,153,0.5)]"
                style={{ height: `${height}%` }}
                ></div>
            ))}
            </div>

            {/* Progress Bar Group */}
            <div className="w-full max-w-[160px] flex flex-col gap-0.5">
                <div className="flex justify-between text-[7px] text-gray-500 font-mono px-0.5">
                    <span>{currentTimeStr}</span>
                    <span>{durationStr}</span>
                </div>
                <div className="h-5 flex items-center">
                    <InteractiveSlider 
                        value={trackProgress} 
                        onChange={handleSeek} 
                        colorClass="bg-pink-500" 
                        thumbColorClass="bg-pink-500 scale-50"
                    />
                </div>
            </div>

            {/* Volume Group */}
            <div className="w-full max-w-[160px] flex items-center gap-1.5 mt-0.5">
            <Volume2 size={10} className="text-gray-400 flex-shrink-0" />
            <div className="h-5 flex-1 flex items-center">
                <InteractiveSlider 
                    value={volume || 0}
                    onChange={(v) => onVolumeChange && onVolumeChange(v)}
                    colorClass="bg-cyan-400"
                    thumbColorClass="bg-cyan-400 scale-50"
                />
            </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between w-[120px] mt-1">
            <button onClick={handlePrevTrack} className="text-gray-300 hover:text-white active:scale-90 p-1"><SkipBack size={14} /></button>
            <button 
                onClick={(e) => setIsPlaying(!isPlaying)}
                disabled={!currentTrack.url}
                className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center text-black shadow-[0_0_8px_rgba(34,211,238,0.4)] active:scale-95 transition-all",
                    !currentTrack.url ? "bg-gray-600 cursor-not-allowed opacity-50" : "bg-cyan-400 hover:bg-cyan-300"
                )}
            >
                {isPlaying ? <Pause size={12} fill="black" /> : <Play size={12} fill="black" className="ml-0.5" />}
            </button>
            <button onClick={handleNextTrack} className="text-gray-300 hover:text-white active:scale-90 p-1"><SkipForward size={14} /></button>
            </div>
        </div>
        {renderTeeth()}
        </div>
    );
  };

  const renderClock = () => {
    const hours = String(currentTime.getHours()).padStart(2, '0');
    const minutes = String(currentTime.getMinutes()).padStart(2, '0');
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = dayNames[currentTime.getDay()];
    const monthName = monthNames[currentTime.getMonth()];
    const dayNum = currentTime.getDate();
    const yearNum = currentTime.getFullYear();
    const dateStr = `${dayName} ${monthName} ${dayNum} ${yearNum}`;
    
    return (
      <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center z-30 text-amber-400 font-tech">
          <button onClick={handleBack} className="absolute top-6 left-10 p-2 hover:bg-white/10 rounded-full transition-colors z-50">
            <ArrowLeft size={18} />
          </button>
          
          <Clock size={32} className="mb-2 opacity-80" />
          <div className="text-4xl font-mono font-bold tracking-widest drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
              {`${hours}:${minutes}`}
          </div>
          <div className="mt-1 text-xs opacity-60 font-tech">
              {dateStr}
          </div>
          {renderTeeth()}
      </div>
    );
  };

  const renderWifiList = () => (
    <div className="absolute inset-0 bg-[#0f172a] flex flex-col p-4 z-40 text-cyan-400 font-tech">
      <div className="flex items-center gap-2 mb-4 border-b border-cyan-500/30 pb-2 pt-4">
        <button onClick={handleBack}><ArrowLeft size={18} /></button>
        <span className="text-xs font-bold tracking-wider">NETWORKS</span>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-2 pb-6">
        {wifiScanning ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
            <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[10px]">Scanning...</span>
          </div>
        ) : (
          availableNetworks.map((net) => (
            <button 
              key={net.ssid}
              onClick={(e) => handleNetworkSelect(net.ssid)}
              className={clsx(
                "w-full flex items-center justify-between p-3 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-cyan-500/50 transition-all",
                connectedNetwork === net.ssid && "bg-cyan-900/40 border-cyan-500"
              )}
            >
              <div className="flex items-center gap-3">
                <Wifi size={14} className={connectedNetwork === net.ssid ? "text-green-400" : "text-gray-400"} />
                <span className="text-xs text-white truncate max-w-[100px] text-left">{net.ssid}</span>
              </div>
              <div className="flex items-center gap-2">
                {net.secure && <Lock size={10} className="text-gray-500" />}
                {connectedNetwork === net.ssid && <Check size={12} className="text-green-400" />}
              </div>
            </button>
          ))
        )}
      </div>
      {renderTeeth()}
    </div>
  );

  const renderWifiAuth = () => (
    <div className="absolute inset-0 bg-[#0f172a] flex flex-col p-4 z-50 text-cyan-400 font-tech">
       <div className="flex items-center gap-2 mb-4 border-b border-cyan-500/30 pb-2 pt-4">
        <button onClick={handleBack}><ArrowLeft size={18} /></button>
        <span className="text-xs font-bold tracking-wider truncate">{selectedNetwork}</span>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {isConnecting ? (
          <div className="flex flex-col items-center gap-2 animate-pulse">
            <Wifi size={32} />
            <span className="text-xs">Connecting...</span>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <label className="text-[10px] text-gray-400 ml-1">PASSWORD</label>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full bg-black/40 border border-cyan-500/30 rounded p-2 text-sm text-white focus:outline-none focus:border-cyan-400 font-sans"
                placeholder="Enter password..."
              />
            </div>
            
            <button 
              onClick={(e) => handleConnect()}
              disabled={passwordInput.length < 4}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold py-3 rounded shadow-[0_0_15px_rgba(8,145,178,0.4)] transition-all"
            >
              CONNECT
            </button>
          </>
        )}
      </div>
      {renderTeeth()}
    </div>
  );

  const renderTimeSettings = () => {
    return (
      <div className="absolute inset-0 bg-[#0f172a] flex flex-col p-4 z-40 text-cyan-400 font-tech">
        <div className="flex items-center gap-2 mb-2 border-b border-cyan-500/30 pb-2 pt-4">
          <button onClick={handleBack}><ArrowLeft size={18} /></button>
          <span className="text-xs font-bold tracking-wider">TIME & DATE</span>
        </div>
        
        <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar pr-1 flex items-center justify-center">
             <div className="text-center space-y-2 opacity-70">
                 <p className="text-xs text-white">Auto-Synced</p>
                 <p className="text-[10px] text-gray-500">Internet Time</p>
             </div>
        </div>
        {renderTeeth()}
      </div>
    );
  };

  const renderAlarmSettings = () => {
      if (alarmEditMode === 'EDIT') {
          return (
            <div className="absolute inset-0 bg-[#0f172a] flex flex-col p-4 z-40 text-cyan-400 font-tech">
                <div className="flex items-center gap-2 mb-2 border-b border-cyan-500/30 pb-2 pt-4">
                    <button onClick={(e) => setAlarmEditMode('LIST')}><ArrowLeft size={18} /></button>
                    <span className="text-xs font-bold tracking-wider">{editingAlarmId ? 'EDIT ALARM' : 'ADD ALARM'}</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center gap-6">
                    <div className="flex items-center gap-4 text-4xl font-mono text-white">
                        <div className="flex flex-col items-center gap-2">
                             <button onClick={(e) => setEditHour(h => (h + 1) % 24)} className="p-2 hover:bg-white/10 rounded"><ChevronUp /></button>
                             <span>{String(editHour).padStart(2, '0')}</span>
                             <button onClick={(e) => setEditHour(h => (h - 1 + 24) % 24)} className="p-2 hover:bg-white/10 rounded"><ChevronDown /></button>
                        </div>
                        <span>:</span>
                        <div className="flex flex-col items-center gap-2">
                             <button onClick={(e) => setEditMinute(m => (m + 5) % 60)} className="p-2 hover:bg-white/10 rounded"><ChevronUp /></button>
                             <span>{String(editMinute).padStart(2, '0')}</span>
                             <button onClick={(e) => setEditMinute(m => (m - 5 + 60) % 60)} className="p-2 hover:bg-white/10 rounded"><ChevronDown /></button>
                        </div>
                    </div>
                </div>
                {renderTeeth()}
            </div>
          );
      }

      return (
        <div className="absolute inset-0 bg-[#0f172a] flex flex-col p-4 z-40 text-cyan-400 font-tech">
            <div className="flex items-center justify-between mb-2 border-b border-cyan-500/30 pb-2 pt-4">
                <div className="flex items-center gap-2">
                    <button onClick={handleBack}><ArrowLeft size={18} /></button>
                    <span className="text-xs font-bold tracking-wider">ALARMS</span>
                </div>
                <button className="p-1 hover:text-white"><Plus size={18} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-6 custom-scrollbar space-y-2 pr-1">
                {alarms.map(alarm => (
                    <div key={alarm.id} className="flex items-center justify-between bg-white/5 p-3 rounded hover:bg-white/10 group cursor-pointer">
                        <span className="text-2xl font-mono text-white">{String(alarm.hour).padStart(2, '0')}:{String(alarm.minute).padStart(2, '0')}</span>
                        <div className="text-green-400"><ToggleRight size={24} /></div>
                    </div>
                ))}
            </div>
            {renderTeeth()}
        </div>
      );
  };

  const renderDisplaySettings = () => {
    const displayValue = Math.round((brightness || 1) * 100);
    return (
      <div className="absolute inset-0 bg-[#0f172a] flex flex-col z-40 text-cyan-400 font-tech overflow-hidden">
          <div className="absolute top-8 left-0 right-0 flex items-center justify-center gap-2 px-6 z-50 pointer-events-none">
             <button onClick={handleBack} className="absolute left-6 pointer-events-auto p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={16} /></button>
             <span className="text-[10px] font-bold tracking-wider opacity-80">DISPLAY</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full h-full pt-4">
                <span className="text-4xl font-bold text-white tracking-widest mb-4 shadow-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{displayValue}%</span>
                
                <div className="w-4/5 flex flex-col items-center">
                    <InteractiveSlider 
                        value={brightness || 1}
                        onChange={(v) => onBrightnessChange && onBrightnessChange(v)}
                        colorClass="bg-yellow-400"
                        thumbColorClass="bg-yellow-400"
                    />
                </div>
          </div>
          {renderTeeth()}
      </div>
    );
  };

  const renderSoundSettings = () => {
    const displayValue = Math.round((volume || 0) * 100);
    return (
      <div className="absolute inset-0 bg-[#0f172a] flex flex-col z-40 text-cyan-400 font-tech overflow-hidden">
          <div className="absolute top-8 left-0 right-0 flex items-center justify-center gap-2 px-6 z-50 pointer-events-none">
             <button onClick={handleBack} className="absolute left-6 pointer-events-auto p-2 hover:bg-white/5 rounded-full"><ArrowLeft size={16} /></button>
             <span className="text-[10px] font-bold tracking-wider opacity-80">SOUND</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full h-full pt-4">
                <span className="text-4xl font-bold text-white tracking-widest mb-4 shadow-lg drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">{displayValue}%</span>
                
                <div className="w-4/5 flex flex-col items-center">
                    <InteractiveSlider 
                        value={volume || 0}
                        onChange={(v) => onVolumeChange && onVolumeChange(v)}
                        colorClass="bg-cyan-400"
                        thumbColorClass="bg-cyan-400"
                    />
                </div>
          </div>
          {renderTeeth()}
      </div>
    );
  };

  const renderStatus = () => {
    const menuItems = [
        { id: 'WIFI_LIST', icon: Wifi, label: 'Network', value: connectedNetwork || 'Disconnected' },
        { id: 'TIME', icon: Calendar, label: 'Time & Date', value: `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}` },
        { id: 'DISPLAY', icon: Sun, label: 'Display', value: `${Math.round((brightness || 1) * 100)}%` },
        { id: 'SOUND', icon: Volume2, label: 'Sound', value: `${Math.round((volume || 0) * 100)}%` },
        { id: 'ALARM', icon: Clock, label: 'Alarms', value: `${alarms.filter(a => a.enabled).length} Active` },
    ];

    return (
        <div className="absolute inset-0 bg-[#0f172a] flex flex-col items-center justify-center p-4 z-30 text-cyan-400 font-tech">
            <div className="w-full flex items-center mb-1 pl-2">
                 <button onClick={handleBack} className="p-2 hover:bg-white/10 rounded-full transition-colors z-50">
                    <ArrowLeft size={16} />
                 </button>
            </div>
            
            <div className="w-full max-w-[200px] flex flex-col gap-2 mt-1 overflow-y-auto max-h-[160px] custom-scrollbar pr-1 pb-4">
                {menuItems.map((item) => (
                    <button 
                    key={item.id}
                    onClick={(e) => setSystemView(item.id as SystemView)}
                    className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 px-3 py-2 rounded-lg transition-all group border border-transparent hover:border-cyan-500/30 flex-shrink-0"
                    >
                        <div className="flex items-center gap-2.5">
                            <div className="p-1 rounded-full bg-cyan-500/20 text-cyan-400">
                                <item.icon size={12} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[10px] font-bold tracking-wider text-white">{item.label}</span>
                                <span className="text-[8px] text-gray-400">{item.value}</span>
                            </div>
                        </div>
                        <ChevronRight size={12} className="text-cyan-500/50 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                    </button>
                ))}
                
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 opacity-60 flex-shrink-0">
                     <div className="flex items-center gap-2.5">
                        <div className="p-1 rounded-full bg-green-500/20 text-green-400">
                            <Battery size={12} />
                        </div>
                        <span className="text-[10px] font-bold tracking-wider text-white">Battery</span>
                     </div>
                     <span className="text-green-400 text-[10px] font-bold">{batteryLevel}%</span>
                </div>
            </div>
            {renderTeeth()}
        </div>
    );
  };
  
  if (powerStatus === 'OFF') {
      return renderPowerButton();
  }

  if (powerStatus === 'BOOTING') {
      return renderBootSequence();
  }

  switch(screenMode) {
    case ScreenMode.CHAT: return renderChat();
    case ScreenMode.MUSIC: 
        if (musicView === 'PLAYLIST') return renderMusicPlaylist();
        return renderMusicPlayer();
    case ScreenMode.MENU: return renderMenu();
    case ScreenMode.CLOCK: return renderClock();
    case ScreenMode.STATUS:
        if (systemView === 'WIFI_LIST') return renderWifiList();
        if (systemView === 'WIFI_AUTH') return renderWifiAuth();
        if (systemView === 'TIME') return renderTimeSettings();
        if (systemView === 'DISPLAY') return renderDisplaySettings();
        if (systemView === 'SOUND') return renderSoundSettings();
        if (systemView === 'ALARM') return renderAlarmSettings();
        return renderStatus();
    default: 
        if (isCharging) return renderCharging();
        return renderFace();
  }
};

export default RobotFace;