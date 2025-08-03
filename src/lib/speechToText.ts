// Real Speech-to-Text Service Implementation
// This version removes mock data and implements actual transcription

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  duration: number;
}

export class SpeechToTextService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.baseUrl = 'https://api.openai.com/v1/audio/transcriptions';
  }

  async transcribeFile(file: File, progressCallback?: (progress: number) => void): Promise<TranscriptionResult> {
    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.');
    }

    try {
      if (progressCallback) progressCallback(10);

      // Validate file type
      const supportedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/x-m4a', 'video/mp4', 'video/quicktime', 'video/webm'];
      if (!supportedTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}`);
      }

      // Check file size (OpenAI Whisper has a 25MB limit)
      const maxSize = 25 * 1024 * 1024; // 25MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 25MB limit. Please use a smaller file or compress the audio.');
      }

      if (progressCallback) progressCallback(20);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');
      formData.append('response_format', 'verbose_json');
      formData.append('temperature', '0');

      if (progressCallback) progressCallback(30);

      // Make API request
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData,
      });

      if (progressCallback) progressCallback(80);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Transcription failed: ${errorData.error?.message || response.statusText}`);
      }

      const result = await response.json();

      if (progressCallback) progressCallback(100);

      return {
        transcript: result.text || '',
        confidence: this.calculateConfidence(result.segments || []),
        duration: result.duration || 0
      };

    } catch (error) {
      console.error('Transcription error:', error);
      throw error;
    }
  }

  private calculateConfidence(segments: any[]): number {
    if (!segments || segments.length === 0) return 0.85; // Default confidence

    const avgConfidence = segments.reduce((sum, segment) => {
      return sum + (segment.avg_logprob ? Math.exp(segment.avg_logprob) : 0.85);
    }, 0) / segments.length;

    return Math.min(1, Math.max(0, avgConfidence));
  }

  // For real-time transcription using Web Speech API (browser-based)
  async startRealTimeTranscription(
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      throw new Error('Speech recognition not supported in this browser');
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 1;

    return new Promise((resolve, reject) => {
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        onTranscript(finalTranscript || interimTranscript, !!finalTranscript);
      };

      recognition.onerror = (event: any) => {
        const error = `Speech recognition error: ${event.error}`;
        if (onError) onError(error);
        reject(new Error(error));
      };

      recognition.onend = () => {
        resolve();
      };

      recognition.start();
    });
  }

  stopRealTimeTranscription() {
    // This would be called from the component that manages the recognition instance
  }

  isServiceSupported(): boolean {
    return !!this.apiKey;
  }

  // Get supported file formats
  getSupportedFormats(): string[] {
    return [
      'audio/mpeg',
      'audio/wav', 
      'audio/mp4',
      'audio/aac',
      'audio/x-m4a',
      'video/mp4',
      'video/quicktime',
      'video/webm'
    ];
  }

  // Estimate processing time based on file size
  estimateProcessingTime(fileSize: number): number {
    // Rough estimate: 1MB = ~10 seconds processing time
    const estimatedSeconds = Math.ceil(fileSize / (1024 * 1024)) * 10;
    return Math.min(estimatedSeconds, 300); // Cap at 5 minutes
  }
}

// Alternative service for Azure Speech Services
export class AzureSpeechToTextService {
  private subscriptionKey: string;
  private region: string;
  private baseUrl: string;

  constructor() {
    this.subscriptionKey = process.env.AZURE_SPEECH_KEY || '';
    this.region = process.env.AZURE_SPEECH_REGION || 'eastus';
    this.baseUrl = `https://${this.region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1`;
  }

  async transcribeFile(file: File, progressCallback?: (progress: number) => void): Promise<TranscriptionResult> {
    if (!this.subscriptionKey) {
      throw new Error('Azure Speech subscription key not configured.');
    }

    try {
      if (progressCallback) progressCallback(10);

      // Convert file to appropriate format for Azure
      const audioBuffer = await file.arrayBuffer();
      
      if (progressCallback) progressCallback(30);

      const response = await fetch(`${this.baseUrl}?language=en-US&format=detailed`, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.subscriptionKey,
          'Content-Type': 'audio/wav',
          'Accept': 'application/json',
        },
        body: audioBuffer,
      });

      if (progressCallback) progressCallback(80);

      if (!response.ok) {
        throw new Error(`Azure Speech API error: ${response.statusText}`);
      }

      const result = await response.json();

      if (progressCallback) progressCallback(100);

      return {
        transcript: result.DisplayText || '',
        confidence: result.Confidence || 0.85,
        duration: result.Duration || 0
      };

    } catch (error) {
      console.error('Azure transcription error:', error);
      throw error;
    }
  }

  isServiceSupported(): boolean {
    return !!this.subscriptionKey;
  }
}

// Service factory to choose the best available service
export class TranscriptionServiceFactory {
  static createService(): SpeechToTextService | AzureSpeechToTextService {
    // Prefer OpenAI Whisper if available
    const openaiService = new SpeechToTextService();
    if (openaiService.isServiceSupported()) {
      return openaiService;
    }

    // Fall back to Azure if available
    const azureService = new AzureSpeechToTextService();
    if (azureService.isServiceSupported()) {
      return azureService;
    }

    throw new Error('No speech-to-text service configured. Please set up OpenAI or Azure Speech API keys.');
  }

  static getSupportedServices(): string[] {
    const services = [];
    
    if (new SpeechToTextService().isServiceSupported()) {
      services.push('OpenAI Whisper');
    }
    
    if (new AzureSpeechToTextService().isServiceSupported()) {
      services.push('Azure Speech');
    }

    return services;
  }
}