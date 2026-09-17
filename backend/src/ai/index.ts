import { mockAnalysisProvider } from './mockProvider.ts'
import { openaiAnalysisProvider, validateProviderOutput } from './provider.ts'
import { config } from '../config.ts'
import type { AnalysisProvider, ProviderAnalyzeInput } from './types.ts'
import { AppError } from '../util/errors.ts'
import { ERROR_CODES } from '../../../shared/types.ts'

export function getAnalysisProvider(): AnalysisProvider {
  if (config.ai.provider === 'openai') return openaiAnalysisProvider
  return mockAnalysisProvider
}

export async function runAnalysis(input: ProviderAnalyzeInput): Promise<ProviderAnalyzeOutput> {
  try {
    const raw = await getAnalysisProvider().analyze(input)
    return await validateProviderOutput(raw)
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === ERROR_CODES.AI_UNAVAILABLE && config.ai.provider !== 'mock') {
        const fallback = await mockAnalysisProvider.analyze(input)
        return validateProviderOutput(fallback)
      }
      throw error
    }
    throw new AppError(ERROR_CODES.AI_UNAVAILABLE, 'AI analysis could not be completed', 503)
  }
}
