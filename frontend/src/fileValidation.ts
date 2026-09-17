const MAX_FILES = 5
const MAX_BYTES = 2 * 1024 * 1024
export const ALLOWED_UPLOAD_EXTENSIONS = ['.pdf', '.csv', '.txt'] as const

export function validateFiles(files: File[]): string | null {
  if (files.length === 0) return 'Upload at least one document.'
  if (files.length > MAX_FILES) return `Upload at most ${MAX_FILES} files.`
  for (const file of files) {
    const ext = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase() ?? ''}` : ''
    if (!ALLOWED_UPLOAD_EXTENSIONS.includes(ext as (typeof ALLOWED_UPLOAD_EXTENSIONS)[number])) {
      return `${file.name} is not an allowed format.`
    }
    if (file.size > MAX_BYTES) return `${file.name} exceeds 2 MB.`
  }
  return null
}
