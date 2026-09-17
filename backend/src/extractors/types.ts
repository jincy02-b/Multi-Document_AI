export interface Extractor {
  readonly ext: '.pdf' | '.csv' | '.txt'
  extract(buffer: Buffer): Promise<string>
}

export interface ExtractedDocument {
  id: string
  filename: string
  storedName: string
  extension: string
  mimeType: string
  byteSize: number
  status: 'processed' | 'unsupported' | 'unreadable' | 'empty' | 'invalid' | 'failed'
  error?: string
  text: string
  truncated: boolean
  extractedCharCount: number
}
