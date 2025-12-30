export enum CaptchaState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  WAITING_FOR_FACE = 'WAITING_FOR_FACE',
  CHALLENGE_SMILE = 'CHALLENGE_SMILE',
  CHALLENGE_BLINK = 'CHALLENGE_BLINK',
  VERIFYING = 'VERIFYING',
  SUCCESS = 'SUCCESS',
  FAILURE = 'FAILURE'
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface FaceGeometry {
  isSmile: boolean;
  isBlink: boolean;
  smileScore: number; // 0.0 to 1.0
  blinkScore: number; // 0.0 to 1.0
  faceDetected: boolean;
}

// MediaPipe global types (since we load via CDN)
export interface MPFaceMesh {
  setOptions: (options: any) => void;
  onResults: (callback: (results: any) => void) => void;
  send: (input: { image: HTMLVideoElement }) => Promise<void>;
  close: () => Promise<void>;
}

declare global {
  interface Window {
    FaceMesh: new (config: any) => MPFaceMesh;
  }
}