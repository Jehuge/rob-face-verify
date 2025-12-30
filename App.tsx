import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraFeed } from './components/CameraFeed';
import { CaptchaStatus } from './components/CaptchaStatus';
import { faceService } from './services/faceService';
import { apiService } from './services/apiService';
import { CaptchaState, FaceGeometry } from './types';

// Configuration
const REQUIRED_SMILE_DURATION_MS = 1000;
const REQUIRED_BLINK_DURATION_MS = 300; 

function App() {
  const [captchaState, setCaptchaState] = useState<CaptchaState>(CaptchaState.IDLE);
  const [faceData, setFaceData] = useState<FaceGeometry>({
    isSmile: false,
    isBlink: false,
    smileScore: 0,
    blinkScore: 0,
    faceDetected: false
  });
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const [stream, setStream] = useState<MediaStream | null>(null);
  
  // Refs for logic
  const smileTimerRef = useRef<number>(0);
  const blinkTimerRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(Date.now());
  
  // Session management
  const sessionIdRef = useRef<string>("");

  const startCaptcha = async () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    // Generate a pseudo-random session ID (In prod, this comes from backend)
    sessionIdRef.current = Math.random().toString(36).substring(2, 15);

    setCaptchaState(CaptchaState.INITIALIZING);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 480 }, // Smaller resolution for widget
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      setStream(mediaStream);

      await faceService.initialize();
      setCaptchaState(CaptchaState.WAITING_FOR_FACE);
      
      faceService.setCallback((data) => {
        setFaceData({
            isSmile: data.isSmile,
            isBlink: data.isBlink,
            smileScore: data.smileScore,
            blinkScore: data.blinkScore,
            faceDetected: data.faceDetected
        });
        setLandmarks(data.landmarks || []);
      });

    } catch (e) {
      console.error("Setup failed:", e);
      setCaptchaState(CaptchaState.FAILURE);
    }
  };

  const onVideoReady = useCallback((video: HTMLVideoElement) => {
    faceService.start(video);
  }, []);

  // State Logic
  useEffect(() => {
    const now = Date.now();
    const delta = now - lastUpdateRef.current;
    lastUpdateRef.current = now;

    if (captchaState === CaptchaState.WAITING_FOR_FACE) {
      if (faceData.faceDetected) {
        setTimeout(() => setCaptchaState(CaptchaState.CHALLENGE_SMILE), 500);
      }
    }
    else if (captchaState === CaptchaState.CHALLENGE_SMILE) {
      if (faceData.isSmile && faceData.faceDetected) {
        smileTimerRef.current += delta;
      } else {
        smileTimerRef.current = Math.max(0, smileTimerRef.current - delta * 2);
      }

      if (smileTimerRef.current > REQUIRED_SMILE_DURATION_MS) {
        smileTimerRef.current = 0;
        setCaptchaState(CaptchaState.CHALLENGE_BLINK);
      }
    }
    else if (captchaState === CaptchaState.CHALLENGE_BLINK) {
      if (faceData.isBlink && faceData.faceDetected) {
        blinkTimerRef.current += delta;
      } else {
        blinkTimerRef.current = 0;
      }

      if (blinkTimerRef.current > REQUIRED_BLINK_DURATION_MS) {
        // Transition to VERIFYING immediately to prevent re-entry
        setCaptchaState(CaptchaState.VERIFYING);
        
        // Execute Backend Verification
        apiService.verifySession(sessionIdRef.current, {
          timestamp: Date.now(),
          challenges: ['smile', 'blink'],
          proof: {
            smileScore: 1.0, // In real app, send actual recorded metrics
            blinkScore: 1.0
          }
        }).then((isSuccess) => {
          if (isSuccess) {
            setCaptchaState(CaptchaState.SUCCESS);
            faceService.stop();
          } else {
            setCaptchaState(CaptchaState.FAILURE);
            faceService.stop();
          }
        }).catch(() => {
          setCaptchaState(CaptchaState.FAILURE);
          faceService.stop();
        });
      }
    }

  }, [faceData, captchaState]);

  // Cleanup
  useEffect(() => {
    return () => {
      faceService.stop();
      if (stream) {
          stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const handleRetry = () => {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
    }
    setCaptchaState(CaptchaState.IDLE);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      
      {/* Widget Container */}
      <div className="w-full max-w-[380px] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden relative transition-all duration-500 ease-in-out">
        
        {/* Header Bar */}
        <div className="bg-slate-800/80 backdrop-blur-sm p-4 border-b border-slate-700 flex items-center justify-between absolute top-0 w-full z-20">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-5 bg-cyan-500 rounded-full"></div>
                <h1 className="text-lg font-bold text-white tracking-tight">
                    人机<span className="text-cyan-500">验证</span>
                </h1>
            </div>
            <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${captchaState === CaptchaState.IDLE ? 'bg-slate-600' : 'bg-green-500 animate-pulse'}`}></span>
                SECURE
            </div>
        </div>

        {/* Content Area */}
        <div className="pt-16 pb-6 px-6 min-h-[400px] flex flex-col items-center justify-center">
            
            {captchaState === CaptchaState.IDLE ? (
                /* IDLE STATE: Click to verify */
                <div className="flex flex-col items-center animate-in fade-in duration-500 w-full">
                    <div className="w-24 h-24 bg-slate-700/50 rounded-full flex items-center justify-center mb-6 relative group cursor-pointer transition-all hover:bg-slate-700 hover:scale-105" onClick={startCaptcha}>
                        <div className="absolute inset-0 rounded-full border border-cyan-500/30 animate-ping opacity-20"></div>
                        <svg className="w-10 h-10 text-cyan-400 group-hover:text-cyan-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    
                    <h2 className="text-white font-medium text-lg mb-2">人机安全验证</h2>
                    <p className="text-slate-400 text-sm text-center mb-8 px-4">
                        为了保护您的账户安全，我们需要验证您是真人操作。
                    </p>

                    <button 
                        onClick={startCaptcha}
                        className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg shadow-cyan-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <span>点击开始验证</span>
                    </button>
                </div>
            ) : (
                /* ACTIVE STATE: Camera + Status */
                <div className="flex flex-col w-full h-full animate-in zoom-in-95 duration-300">
                    
                    {/* Camera Frame */}
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-black border-2 border-slate-700 mb-4 shadow-inner">
                        {captchaState === CaptchaState.SUCCESS ? (
                            <div className="absolute inset-0 flex items-center justify-center bg-slate-800">
                                <div className="text-green-500 text-6xl animate-bounce">✓</div>
                            </div>
                        ) : (
                            <>
                                <CameraFeed 
                                    onVideoReady={onVideoReady} 
                                    landmarks={landmarks}
                                    stream={stream}
                                    smileScore={faceData.smileScore}
                                    blinkScore={faceData.blinkScore}
                                />
                                {/* Overlay Scanner */}
                                {(captchaState === CaptchaState.WAITING_FOR_FACE || captchaState === CaptchaState.VERIFYING) && (
                                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/20 to-transparent h-[15%] w-full animate-[scan_2s_linear_infinite] pointer-events-none"></div>
                                )}
                                {/* Corner Accents */}
                                <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-500/70 rounded-tl"></div>
                                <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-500/70 rounded-tr"></div>
                                <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-500/70 rounded-bl"></div>
                                <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-500/70 rounded-br"></div>
                            </>
                        )}
                    </div>

                    {/* Compact Status */}
                    <div className="flex-1 flex flex-col justify-end">
                         <CaptchaStatus 
                            state={captchaState} 
                            smileScore={faceData.smileScore}
                            blinkScore={faceData.blinkScore}
                            onRetry={handleRetry}
                        />
                    </div>
                </div>
            )}
        </div>
        
        {/* Footer info */}
        <div className="bg-slate-900/50 p-2 text-center border-t border-slate-700/50">
             <p className="text-[10px] text-slate-600">智能行为验证技术保护中</p>
        </div>
      </div>
      
      {/* Global Styles */}
      <style>{`
        @keyframes scan {
            0% { top: -15%; opacity: 0; }
            50% { opacity: 1; }
            100% { top: 115%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export default App;