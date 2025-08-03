import Sentiment from 'sentiment';
import nlp from 'compromise';

const sentiment = new Sentiment();

export interface AnalysisResult {
  sentimentScore: number;
  sentimentLabel: string;
  keyTopics: string[];
  speakingPace: number;
  clarityScore: number;
  engagementScore: number;
  questionRelevanceScore: number;
  overallScore: number;
  detailedAnalysis: {
    wordCount: number;
    avgWordsPerSentence: number;
    questionCount: number;
    positiveWords: string[];
    negativeWords: string[];
    namedEntities: string[];
  };
}

export class TranscriptAnalyzer {
  
  async analyzeTranscript(transcriptText: string): Promise<AnalysisResult> {
    const doc = nlp(transcriptText);
    
    // Sentiment Analysis
    const sentimentResult = sentiment.analyze(transcriptText);
    const sentimentScore = this.normalizeSentimentScore(sentimentResult.score);
    const sentimentLabel = this.getSentimentLabel(sentimentScore);
    
    // Key Topics Extraction
    const keyTopics = this.extractKeyTopics(doc);
    
    // Speaking Pace Analysis (words per minute estimation)
    const speakingPace = this.calculateSpeakingPace(transcriptText);
    
    // Clarity Score (based on sentence structure and complexity)
    const clarityScore = this.calculateClarityScore(doc);
    
    // Engagement Score (based on questions, exclamations, interactive elements)
    const engagementScore = this.calculateEngagementScore(doc);
    
    // Question-Answer Relevance (basic implementation)
    const questionRelevanceScore = this.calculateQuestionRelevance(doc);
    
    // Overall Score Calculation
    const overallScore = this.calculateOverallScore({
      sentimentScore,
      clarityScore,
      engagementScore,
      questionRelevanceScore,
      speakingPace: this.normalizeSpeakingPace(speakingPace)
    });
    
    // Detailed Analysis
    const detailedAnalysis = {
      wordCount: doc.wordCount(),
      avgWordsPerSentence: this.calculateAvgWordsPerSentence(doc),
      questionCount: doc.questions().length,
      positiveWords: sentimentResult.positive,
      negativeWords: sentimentResult.negative,
      namedEntities: this.extractNamedEntities(doc)
    };
    
    return {
      sentimentScore,
      sentimentLabel,
      keyTopics,
      speakingPace,
      clarityScore,
      engagementScore,
      questionRelevanceScore,
      overallScore,
      detailedAnalysis
    };
  }
  
  private normalizeSentimentScore(score: number): number {
    // Normalize sentiment score to 0-100 scale
    return Math.max(0, Math.min(100, (score + 10) * 5));
  }
  
  private getSentimentLabel(score: number): string {
    if (score >= 70) return 'Very Positive';
    if (score >= 55) return 'Positive';
    if (score >= 45) return 'Neutral';
    if (score >= 30) return 'Negative';
    return 'Very Negative';
  }
  
  private extractKeyTopics(doc: any): string[] {
    const topics = new Set<string>();
    
    // Extract nouns as potential topics
    const nouns = doc.nouns().out('array');
    nouns.forEach((noun: string) => {
      if (noun.length > 3) {
        topics.add(noun.toLowerCase());
      }
    });
    
    // Extract named entities
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations().out('array');
    
    [...people, ...places, ...organizations].forEach(entity => {
      topics.add(entity.toLowerCase());
    });
    
    return Array.from(topics).slice(0, 10); // Return top 10 topics
  }
  
  private calculateSpeakingPace(text: string): number {
    // Estimate speaking pace (words per minute)
    // This is a rough estimation - in real implementation, you'd use audio duration
    const wordCount = text.split(/\s+/).length;
    const estimatedMinutes = wordCount / 150; // Average reading speed
    return Math.round(wordCount / Math.max(estimatedMinutes, 1));
  }
  
  private normalizeSpeakingPace(pace: number): number {
    // Normalize speaking pace to 0-100 scale (optimal range 120-180 WPM)
    const optimal = 150;
    const deviation = Math.abs(pace - optimal);
    const maxDeviation = 100;
    return Math.max(0, 100 - (deviation / maxDeviation) * 100);
  }
  
  private calculateClarityScore(doc: any): number {
    const sentences = doc.sentences();
    const totalSentences = sentences.length;
    
    if (totalSentences === 0) return 0;
    
    let clarityPoints = 0;
    
    sentences.forEach((sentence: any) => {
      const words = sentence.wordCount();
      
      // Optimal sentence length (10-20 words)
      if (words >= 10 && words <= 20) {
        clarityPoints += 2;
      } else if (words >= 5 && words < 30) {
        clarityPoints += 1;
      }
      
      // Check for passive voice (simple heuristic)
      if (!sentence.text().match(/\b(is|was|are|were|being|been)\s+\w+ed\b/)) {
        clarityPoints += 1;
      }
    });
    
    return Math.min(100, (clarityPoints / (totalSentences * 3)) * 100);
  }
  
  private calculateEngagementScore(doc: any): number {
    let engagementPoints = 0;
    
    // Questions indicate engagement
    const questionCount = doc.questions().length;
    engagementPoints += Math.min(questionCount * 5, 30);
    
    // Exclamations indicate enthusiasm
    const exclamationCount = (doc.text().match(/!/g) || []).length;
    engagementPoints += Math.min(exclamationCount * 3, 20);
    
    // Interactive words
    const interactiveWords = ['you', 'we', 'us', 'our', 'together', 'think', 'feel', 'believe'];
    const text = doc.text().toLowerCase();
    interactiveWords.forEach(word => {
      const matches = (text.match(new RegExp(`\\b${word}\\b`, 'g')) || []).length;
      engagementPoints += Math.min(matches * 2, 10);
    });
    
    return Math.min(100, engagementPoints);
  }
  
  private calculateQuestionRelevance(doc: any): number {
    // Basic implementation - in real scenario, this would be more sophisticated
    const questions = doc.questions();
    const statements = doc.sentences().filter((s: any) => !s.text().includes('?'));
    
    if (questions.length === 0) return 75; // Default score if no questions
    
    // Simple heuristic: check if statements follow questions contextually
    let relevanceScore = 70; // Base score
    
    // Bonus for having good question-to-statement ratio
    const ratio = statements.length / questions.length;
    if (ratio >= 2 && ratio <= 5) {
      relevanceScore += 20;
    }
    
    return Math.min(100, relevanceScore);
  }
  
  private calculateOverallScore(scores: {
    sentimentScore: number;
    clarityScore: number;
    engagementScore: number;
    questionRelevanceScore: number;
    speakingPace: number;
  }): number {
    // Weighted average of all scores
    const weights = {
      sentiment: 0.20,
      clarity: 0.25,
      engagement: 0.20,
      questionRelevance: 0.20,
      speakingPace: 0.15
    };
    
    return Math.round(
      scores.sentimentScore * weights.sentiment +
      scores.clarityScore * weights.clarity +
      scores.engagementScore * weights.engagement +
      scores.questionRelevanceScore * weights.questionRelevance +
      scores.speakingPace * weights.speakingPace
    );
  }
  
  private calculateAvgWordsPerSentence(doc: any): number {
    const sentences = doc.sentences();
    if (sentences.length === 0) return 0;
    
    const totalWords = doc.wordCount();
    return Math.round(totalWords / sentences.length);
  }
  
  private extractNamedEntities(doc: any): string[] {
    const entities = new Set<string>();
    
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations().out('array');
    
    [...people, ...places, ...organizations].forEach(entity => {
      entities.add(entity);
    });
    
    return Array.from(entities);
  }
}