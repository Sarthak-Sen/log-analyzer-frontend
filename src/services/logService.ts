import { analyzeLogs } from './grpcClient'
import type { AnomalyDetail, AnalysisState } from '../types/analysis'

const CHUNK_SIZE = 10_000
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? ''

// ── Upload ────────────────────────────────────────────────────────────────────

async function uploadChunk(
  jobId: string,
  chunkIndex: number,
  totalChunks: number,
  filename: string,
  data: Uint8Array,
  token: string
): Promise<void> {
  const base64 = btoa(
    Array.from(data, (byte) => String.fromCharCode(byte)).join('')
  )

  const res = await fetch(`${BACKEND_URL}/api/jobs/chunk`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      jobId,
      chunkIndex,
      totalChunks,
      filename,
      data: base64,
    }),
  })

  if (!res.ok) {
    throw new Error(`Chunk ${chunkIndex} upload failed: ${res.status}`)
  }
}

export async function uploadFile(
  file: File,
  jobId: string,
  token: string,
  onProgress?: (chunkIndex: number, totalChunks: number) => void
): Promise<void> {
  const text = await file.text()
  const lines = text.split('\n')
  const filename = file.name.replace(/\.txt$/i, '')

  const chunks: string[][] = []
  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    chunks.push(lines.slice(i, i + CHUNK_SIZE))
  }

  const totalChunks = chunks.length

  for (let i = 0; i < chunks.length; i++) {
    const chunkText = chunks[i].join('\n')
    const encoded = new TextEncoder().encode(chunkText)
    await uploadChunk(jobId, i, totalChunks, filename, encoded, token)
    onProgress?.(i + 1, totalChunks)
  }
}

// ── Streaming ─────────────────────────────────────────────────────────────────

function mapUpdate(update: any): Partial<AnalysisState> {
  const anomalies: AnomalyDetail[] = (update.anomalies ?? []).map((a: any) => ({
    type: a.type ?? '',
    service: a.service ?? '',
    description: a.description ?? '',
    timestamp: a.timestamp ?? '',
  }))

  return {
    jobId: update.jobId ?? '',
    linesProcessed: update.linesProcessed ?? 0,
    errorRate: update.errorRate ?? 0,
    anomaliesDetected: update.anomaliesDetected ?? 0,
    workerId: update.workerId ?? null,
    status: update.status ?? '',
    anomalies,
  }
}

export async function streamResults(
  jobId: string,
  token: string,
  onUpdate: (state: Partial<AnalysisState>) => void,
  onComplete: () => void,
  onError: (err: Error) => void
): Promise<() => void> {
  const stream = await analyzeLogs(jobId, {
    authorization: `Bearer ${token}`,
  })

  stream.on('data', (update: any) => {
    const mapped = mapUpdate(update)
    onUpdate(mapped)
    if (mapped.status === 'complete') {
      onComplete()
    }
  })

  stream.on('error', (err: Error) => {
    onError(err)
  })

  stream.on('end', () => {
    onComplete()
  })

  return () => stream.cancel()
}