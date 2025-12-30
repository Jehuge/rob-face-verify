import { MPFaceMesh } from '../types';
import { analyzeFace } from '../utils/geometry';

export class FaceService {
  private faceMesh: MPFaceMesh | null = null;
  private isLoaded: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private animationFrameId: number | null = null;
  private onResultCallback: ((data: any) => void) | null = null;

  constructor() {}

  public async initialize(): Promise<void> {
    if (this.isLoaded) return;

    return new Promise((resolve, reject) => {
      // Check if scripts are loaded
      const checkInterval = setInterval(() => {
        if (window.FaceMesh) {
          clearInterval(checkInterval);
          this.initModel().then(resolve).catch(reject);
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error("MediaPipe libraries failed to load."));
      }, 10000);
    });
  }

  private async initModel() {
    try {
      this.faceMesh = new window.FaceMesh({
        locateFile: (file: string) => {
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true, // Crucial for iris/lips precision
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.faceMesh.onResults((results: any) => {
        if (!this.onResultCallback) return;

        if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
          const landmarks = results.multiFaceLandmarks[0];
          const analysis = analyzeFace(landmarks);
          this.onResultCallback({ ...analysis, landmarks });
        } else {
          this.onResultCallback({
            isSmile: false,
            isBlink: false,
            smileScore: 0,
            blinkScore: 0,
            faceDetected: false,
            landmarks: null
          });
        }
      });

      this.isLoaded = true;
    } catch (error) {
      console.error("Error initializing FaceMesh:", error);
      throw error;
    }
  }

  public setCallback(cb: (data: any) => void) {
    this.onResultCallback = cb;
  }

  public start(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
    this.processFrame();
  }

  public stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private processFrame = async () => {
    if (this.faceMesh && this.videoElement && !this.videoElement.paused && !this.videoElement.ended) {
      await this.faceMesh.send({ image: this.videoElement });
    }
    this.animationFrameId = requestAnimationFrame(this.processFrame);
  };
}

export const faceService = new FaceService();