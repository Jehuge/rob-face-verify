import { Landmark } from '../types';

/**
 * Calculates Euclidean distance between two 2D points (ignoring Z for simplicity in ratio calc)
 */
export const getDistance = (p1: Landmark, p2: Landmark): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

/**
 * Calculates the Aspect Ratio of the mouth to detect a smile.
 * Uses key landmarks from MediaPipe 468 mesh.
 */
export const calculateSmileRatio = (landmarks: Landmark[]): number => {
  if (!landmarks || landmarks.length < 468) return 0;

  // Key Landmarks
  // 61: Left mouth corner
  // 291: Right mouth corner
  // 0: Upper lip top (approx)
  // 17: Lower lip bottom (approx)
  
  // Normalization reference: Distance between eyes (to account for camera zoom/distance)
  // 33: Left eye inner corner
  // 263: Right eye inner corner
  
  const leftCorner = landmarks[61];
  const rightCorner = landmarks[291];
  const leftEyeInner = landmarks[33];
  const rightEyeInner = landmarks[263];

  const mouthWidth = getDistance(leftCorner, rightCorner);
  const faceWidth = getDistance(leftEyeInner, rightEyeInner);

  if (faceWidth === 0) return 0;

  // Smile Ratio: How wide the mouth is compared to the face width
  return mouthWidth / faceWidth;
};

/**
 * Calculates Eye Aspect Ratio (EAR) to detect blinking.
 */
export const calculateBlinkRatio = (landmarks: Landmark[]): number => {
  if (!landmarks || landmarks.length < 468) return 1; // Open by default

  // Left Eye
  // 159: Top lid
  // 145: Bottom lid
  // 33: Inner corner
  // 133: Outer corner
  
  const topLid = landmarks[159];
  const bottomLid = landmarks[145];
  const innerCorner = landmarks[33];
  const outerCorner = landmarks[133];

  const verticalDist = getDistance(topLid, bottomLid);
  const horizontalDist = getDistance(innerCorner, outerCorner);

  if (horizontalDist === 0) return 1;

  return verticalDist / horizontalDist;
};

/**
 * Main analysis function
 */
export const analyzeFace = (landmarks: Landmark[]) => {
  const smileRatio = calculateSmileRatio(landmarks);
  const blinkRatio = calculateBlinkRatio(landmarks);

  // Thresholds (Tunable)
  // UPDATED: Made smile threshold stricter based on user feedback.
  // Previous: > 0.45 (too easy). New: > 0.55 / starts counting at 0.45
  
  // Normalize smile: start at 0.45 (neutral-ish), cap at 0.65 (wide smile)
  const normalizedSmile = Math.min(Math.max((smileRatio - 0.45) * 5, 0), 1);
  
  // Normalize blink: closed is < 0.20 usually.
  const normalizedBlink = Math.min(Math.max((0.25 - blinkRatio) * 5, 0), 1);

  return {
    isSmile: smileRatio > 0.58, // Increased threshold for trigger
    isBlink: blinkRatio < 0.18, 
    smileScore: normalizedSmile,
    blinkScore: normalizedBlink,
    faceDetected: true
  };
};