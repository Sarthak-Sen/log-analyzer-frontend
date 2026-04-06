export interface AnomalyDetail {
  type: string
  service: string
  description: string
  timestamp: string
}

export interface AnalysisState {
  jobId: string | null
  linesProcessed: number
  errorRate: number
  anomaliesDetected: number
  workerId: number | null
  status: string
  anomalies: AnomalyDetail[]
}

export const initialAnalysisState: AnalysisState = {
  jobId: null,
  linesProcessed: 0,
  errorRate: 0,
  anomaliesDetected: 0,
  workerId: null,
  status: '',
  anomalies: [],
}