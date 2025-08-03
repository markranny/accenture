// Speech-to-Text Service using Web Speech API (free option)
// For production, consider integrating with services like:
// - Google Cloud Speech-to-Text
// - Azure Speech Services
// - AWS Transcribe
// - OpenAI Whisper API

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  duration: number;
}

export class SpeechToTextService {
  private recognition: any;
  private isSupported: boolean;

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.maxAlternatives = 1;
  }

  async transcribeFile(file: File, progressCallback?: (progress: number) => void): Promise<TranscriptionResult> {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let finalTranscript = '';
      let interimTranscript = '';

      // For file transcription, we'll use a different approach
      // This is a simplified version - in production, you'd send the file to a server
      this.transcribeAudioFile(file, progressCallback)
        .then(result => resolve(result))
        .catch(error => reject(error));
    });
  }

  private async transcribeAudioFile(file: File, progressCallback?: (progress: number) => void): Promise<TranscriptionResult> {
    // This is a mock implementation for demo purposes
    // In production, you would:
    // 1. Send the file to your backend
    // 2. Use a proper speech-to-text service
    // 3. Return the actual transcript

    return new Promise((resolve) => {
      // Simulate processing time
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progressCallback) {
          progressCallback(progress);
        }
        
        if (progress >= 100) {
          clearInterval(interval);
          
          // Mock transcript for demo
          const mockTranscript = this.generateMockTranscript(file.name);
          
          resolve({
            transcript: mockTranscript,
            confidence: 0.85,
            duration: 120 // seconds
          });
        }
      }, 500);
    });
  }

  private generateMockTranscript(filename: string): string {
    // Generate a mock transcript for demo purposes
    const mockTranscripts = [
      `Hello everyone, welcome to today's presentation. I'm excited to share our quarterly results with you. 
      
      First, let me start by saying that this quarter has been exceptional for our team. We've achieved a 15% increase in sales compared to the previous quarter, which exceeded our initial projections by 3%.
      
      Our customer satisfaction scores have also improved significantly. We received an average rating of 4.7 out of 5, up from 4.3 last quarter. This improvement is directly attributed to our new customer service training program that we implemented in January.
      
      Looking at our key performance indicators, I want to highlight three main areas of success. First, our digital marketing campaigns generated 40% more leads than expected. Second, our product team successfully launched two new features that our customers had been requesting. And third, our retention rate improved to 94%, which is the highest we've ever achieved.
      
      However, we also faced some challenges that I want to address honestly. Our delivery times increased by an average of 2 days due to supply chain disruptions. We've already implemented measures to address this, including partnering with two additional suppliers and optimizing our inventory management system.
      
      For the upcoming quarter, our main focus will be on three strategic initiatives. We plan to expand into two new markets, invest in automation to improve our operational efficiency, and launch our new mobile application that's currently in beta testing.
      
      Are there any questions about our performance this quarter or our plans moving forward? I'd be happy to discuss any aspects in more detail.`,
      
      `Good morning team, let's dive into our project status update. 
      
      We're currently at 75% completion on the main development phase. The backend architecture is fully implemented and tested, and we're making excellent progress on the frontend components. 
      
      Our QA team has identified and resolved 23 bugs in the past week, with only 5 minor issues remaining. The performance testing shows that our application can handle up to 10,000 concurrent users, which exceeds our initial requirements.
      
      I want to acknowledge the outstanding work by our development team, particularly Sarah and Mike, who worked extra hours to resolve the database optimization issues we encountered last week.
      
      Looking ahead, we have three critical milestones approaching. The first is the user acceptance testing phase, scheduled to begin next Monday. The second is the security audit, which we need to complete before the end of this month. And finally, we have the production deployment planned for the first week of next month.
      
      Are there any concerns or blockers that we need to address? Let's make sure we're all aligned on the priorities for the remainder of this sprint.`,
      
      `Thank you for joining today's training session on effective communication strategies.
      
      Communication is the foundation of successful teamwork and client relationships. Today, we'll explore five key principles that can dramatically improve your professional interactions.
      
      The first principle is active listening. This means giving your full attention to the speaker, asking clarifying questions, and summarizing what you've heard to ensure understanding. Research shows that teams with strong listening skills are 40% more effective at problem-solving.
      
      The second principle is clarity in messaging. When communicating complex ideas, break them down into simple, actionable points. Use specific examples and avoid jargon that might confuse your audience.
      
      Third, timing matters. Choose the right moment for important conversations. Avoid addressing sensitive topics when people are stressed or distracted.
      
      Fourth, adapt your communication style to your audience. What works for technical stakeholders might not work for executive leadership or end users.
      
      Finally, follow up consistently. Confirm action items, deadlines, and next steps in writing to ensure accountability and prevent misunderstandings.
      
      Let's practice these principles with some role-playing exercises. Who would like to volunteer for the first scenario?`
    ];
    
    // Return a random mock transcript
    return mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
  }

  // Real-time transcription (for live audio)
  startRealTimeTranscription(onTranscript: (transcript: string, isFinal: boolean) => void): Promise<void> {
    if (!this.isSupported) {
      throw new Error('Speech recognition not supported');
    }

    return new Promise((resolve, reject) => {
      this.recognition.onresult = (event: any) => {
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

      this.recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        resolve();
      };

      this.recognition.start();
    });
  }

  stopRealTimeTranscription() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  isServiceSupported(): boolean {
    return this.isSupported;
  }
}

// Alternative API-based transcription service
export class APITranscriptionService {
  private apiEndpoint: string;

  constructor(apiEndpoint: string = '/api/transcribe') {
    this.apiEndpoint = apiEndpoint;
  }

  async transcribeFile(file: File, progressCallback?: (progress: number) => void): Promise<TranscriptionResult> {
    const formData = new FormData();
    formData.append('audio', file);

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Transcription error: ${error}`);
    }
  }
}