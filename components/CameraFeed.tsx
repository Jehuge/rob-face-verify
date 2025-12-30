import React, { useEffect, useRef } from 'react';

interface CameraFeedProps {
  stream: MediaStream | null;
  onVideoReady: (video: HTMLVideoElement) => void;
  landmarks: any[];
  smileScore: number;
  blinkScore: number;
}

export const CameraFeed: React.FC<CameraFeedProps> = ({ 
  stream, 
  onVideoReady, 
  landmarks,
  smileScore,
  blinkScore
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Bind stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject === stream) return;

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        if (videoRef.current) {
          videoRef.current.play().then(() => {
            onVideoReady(videoRef.current!);
          }).catch(err => console.error("Video play failed:", err));
        }
      };
    }
  }, [stream, onVideoReady]);

  // Draw landmarks overlay with dynamic effects
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !landmarks) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video size
    if (video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // MediaPipe Facemesh Landmark Indices
    // Lips (Outer)
    const lipsLower = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291];
    const lipsUpper = [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291];
    
    // Eyes
    const leftEye = [33, 160, 158, 133, 153, 144, 33]; // Loop
    const rightEye = [362, 385, 387, 263, 373, 380, 362]; // Loop

    // Helper to draw a path connecting landmarks
    const drawPath = (indices: number[], color: string, lineWidth: number, closePath: boolean = false) => {
      ctx.beginPath();
      ctx.lineWidth = lineWidth;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      indices.forEach((index, i) => {
        const pt = landmarks[index];
        if (!pt) return;
        const x = pt.x * canvas.width;
        const y = pt.y * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });

      if (closePath) ctx.closePath();
      ctx.stroke();
    };

    // Helper: Draw a glowing HUD circle at a specific landmark center
    const drawHudCircle = (centerIndex: number, score: number, color: string) => {
        const pt = landmarks[centerIndex];
        if (!pt || score < 0.1) return;
        
        const x = pt.x * canvas.width;
        const y = pt.y * canvas.height;
        const baseRadius = 10;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Glow
        ctx.shadowBlur = score * 20;
        ctx.shadowColor = color;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;

        // Rotating Ring
        const angle = (Date.now() / 500) % (Math.PI * 2);
        ctx.rotate(angle);
        
        // Draw broken circle
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius + (score * 10), 0, Math.PI * 1.5);
        ctx.stroke();
        
        // Inner dot
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    };

    // --- RENDER LOGIC ---

    // 1. MOUTH (Smile Feedback)
    // Interpolate color from faint Slate to bright Cyan
    const smileIntensity = Math.max(0.1, smileScore);
    const smileColor = `rgba(6, 182, 212, ${0.3 + smileScore * 0.7})`; // Cyan
    const smileGlow = smileScore * 20;

    ctx.shadowBlur = smileGlow;
    ctx.shadowColor = 'rgba(6, 182, 212, 0.8)';
    
    // Draw lips
    drawPath(lipsUpper, smileColor, 2 + smileScore * 2);
    drawPath(lipsLower, smileColor, 2 + smileScore * 2);

    // If smiling hard, draw HUD effect on corners
    if (smileScore > 0.7) {
        drawHudCircle(61, smileScore, '#22d3ee'); // Left corner
        drawHudCircle(291, smileScore, '#22d3ee'); // Right corner
    }

    // 2. EYES (Blink Feedback)
    const blinkIntensity = Math.max(0.1, blinkScore);
    const blinkColor = `rgba(168, 85, 247, ${0.3 + blinkScore * 0.7})`; // Purple
    const blinkGlow = blinkScore * 20;

    ctx.shadowBlur = blinkGlow;
    ctx.shadowColor = 'rgba(168, 85, 247, 0.8)';

    drawPath(leftEye, blinkColor, 2, true);
    drawPath(rightEye, blinkColor, 2, true);

    // If blinking (eyes closed), draw effect
    if (blinkScore > 0.6) {
        // Center of eyes (approx)
        drawHudCircle(159, blinkScore, '#d8b4fe'); 
        drawHudCircle(386, blinkScore, '#d8b4fe'); 
    }

    ctx.shadowBlur = 0; // Reset

  }, [landmarks, smileScore, blinkScore]);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-xl bg-black border border-slate-700 shadow-2xl">
      <video
        ref={videoRef}
        className="w-full h-full object-cover transform scale-x-[-1]" // Mirror effect
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1]"
      />
    </div>
  );
};