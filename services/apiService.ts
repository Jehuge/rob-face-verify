/**
 * Mock API Service
 * In a real application, this would make HTTP requests to your backend (FastAPI/NestJS).
 */

interface VerificationPayload {
  sessionId: string;
  timestamp: number;
  challenges: string[];
  proof: {
    smileScore: number;
    blinkScore: number;
  };
}

export const apiService = {
  /**
   * Simulates sending the biometric proof to the backend for final validation.
   */
  async verifySession(sessionId: string, data: Omit<VerificationPayload, 'sessionId'>): Promise<boolean> {
    console.log(`[API] Verifying session: ${sessionId}`, data);

    // Simulate network latency (e.g., 1-2 seconds)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulate backend validation logic
    // In production, the backend would:
    // 1. Check if sessionId is valid and not expired.
    // 2. Verify the timestamp prevents replay attacks.
    // 3. Analyze the proof (or signed data tokens) if applicable.
    
    // For this demo, we assume success if data is present.
    // You can simulate failure by changing this to: Math.random() > 0.1
    const isSuccess = true; 

    if (isSuccess) {
      console.log("[API] Verification Successful");
      return true;
    } else {
      console.error("[API] Verification Failed: Invalid Proof");
      return false;
    }
  }
};