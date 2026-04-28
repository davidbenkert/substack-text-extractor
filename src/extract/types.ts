export interface ArticleMetadata {
  title: string;
  author?: string;
  publication?: string;
  publishedAt?: string;
  canonicalUrl: string;
  coverImage?: string;
  description?: string;
}

export interface PaywallStatus {
  paywalled: boolean;
  reason?: string;
}

export interface ExtractedMarkdown {
  markdown: string;
  preview: string;
  filename: string;
  wordCount: number;
  confidence: number;
  warnings: string[];
  metadata: ArticleMetadata;
  paywalled: boolean;
  paywallReason?: string;
}

export interface ExtractionFailure {
  status: 'error';
  reason: string;
  details?: string;
}

export interface ExtractionSuccess {
  status: 'success';
  payload: ExtractedMarkdown;
}

export type ExtractionResult = ExtractionSuccess | ExtractionFailure;

export interface ExtractionAdapter {
  isMatch(document: Document, location: Location): boolean;
  collectMetadata(document: Document, location: Location): ArticleMetadata;
  cleanupDocument(document: Document, baseUrl: string): void;
  detectPaywall(document: Document, textContent: string): PaywallStatus;
}