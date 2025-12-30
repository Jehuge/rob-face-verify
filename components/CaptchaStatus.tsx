import React from 'react';
import { CaptchaState } from '../types';

interface CaptchaStatusProps {
  state: CaptchaState;
  smileScore: number;
  blinkScore: number;
  onRetry: () => void;
}

export const CaptchaStatus: React.FC<CaptchaStatusProps> = ({ state, smileScore, blinkScore, onRetry }) => {
  const isSmileChallenge = state === CaptchaState.CHALLENGE_SMILE;
  const isBlinkChallenge = state === CaptchaState.CHALLENGE_BLINK;
  
  return (
    <div className="w-full flex flex-col items-center space-y-2">
      
      {/* Status Text - Compact */}
      <div className="text-center">
        <h2 className="text-lg font-bold text-white tracking-wide flex items-center justify-center gap-2">
            {state === CaptchaState.INITIALIZING && <span className="animate-pulse">系统初始化...</span>}
            {state === CaptchaState.WAITING_FOR_FACE && "请正对摄像头"}
            {state === CaptchaState.CHALLENGE_SMILE && "动作 1/2: 露齿微笑"}
            {state === CaptchaState.CHALLENGE_BLINK && "动作 2/2: 眨眨眼"}
            {state === CaptchaState.VERIFYING && "正在验证..."}
            {state === CaptchaState.SUCCESS && "验证通过"}
            {state === CaptchaState.FAILURE && "验证失败"}
        </h2>
        
        {/* Subtitle */}
        <p className="text-slate-400 text-xs mt-1 h-4">
            {state === CaptchaState.WAITING_FOR_FACE && "保持面部在取景框中央"}
            {state === CaptchaState.CHALLENGE_SMILE && "请保持微笑直到进度条填满"}
            {state === CaptchaState.CHALLENGE_BLINK && "自然闭眼"}
            {state === CaptchaState.SUCCESS && "跳转中..."}
        </p>
      </div>

      {/* Progress Bars - Compact */}
      <div className="w-full space-y-2 pt-1">
        
        {/* Smile Progress */}
        <div className={`transition-all duration-300 ${isSmileChallenge ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-cyan-500 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                    style={{ width: `${smileScore * 100}%` }}
                />
            </div>
        </div>

        {/* Blink Progress */}
        <div className={`transition-all duration-300 ${isBlinkChallenge ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
             <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-purple-500 transition-all duration-100 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    style={{ width: `${blinkScore * 100}%` }}
                />
            </div>
        </div>
      </div>

      {/* Retry Button */}
      {state === CaptchaState.FAILURE && (
        <button 
            onClick={onRetry}
            className="mt-2 px-4 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-md transition-colors border border-slate-600"
        >
            重新尝试
        </button>
      )}
    </div>
  );
};