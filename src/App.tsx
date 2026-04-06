import React, { useState, useRef } from 'react'
import { LoginModal } from './components/LoginModal'
import { Dropzone } from './components/Dropzone'
import { StreamOutput } from './components/StreamOutput'
import { useAuth } from './context/AuthContext'
import { uploadFile, streamResults } from './services/logService'
import { generateJobId } from './utils/uuid'
import { initialAnalysisState } from './types/analysis'
import type { AnalysisState } from './types/analysis'
import styles from './App.module.css'

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [analysis, setAnalysis] = useState<AnalysisState>(initialAnalysisState)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth()
  const cancelStreamRef = useRef<(() => void) | null>(null)

  const handleFileAccepted = async (file: File) => {
    if (!token) return

    setError(null)
    setUploading(true)
    setAnalysis(initialAnalysisState)

    const jobId = generateJobId()

    // Start the gRPC stream first, before uploading
    // Backend will start sending updates as chunks arrive
    cancelStreamRef.current = await streamResults(
      jobId,
      token,
      (update) => {
        setAnalysis(prev => ({
          ...prev,
          ...update,
          anomalies: update.anomalies
            ? [...prev.anomalies, ...update.anomalies]
            : prev.anomalies,
        }))
      },
      () => {
        setUploading(false)
      },
      (err) => {
        setError(`Stream error: ${err.message}`)
        setUploading(false)
      }
    )

    try {
      await uploadFile(
        file,
        jobId,
        token,
        (chunkIndex, totalChunks) => {
          console.log(`Uploaded chunk ${chunkIndex}/${totalChunks}`)
        }
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setUploading(false)
      cancelStreamRef.current?.()
    }
  }

  return (
    <div className={styles.root}>
      <LoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      <header className={styles.header}>
        <h1 className={styles.title}>
          Distributed <span className={styles.titleAccent}>Log Analyzer</span>
        </h1>
        <p className={styles.subtitle}>
          Upload a log file and watch it get analyzed in real time.
        </p>
      </header>

      <div className={styles.grid}>
        <Dropzone
          onFileAccepted={handleFileAccepted}
          onLoginRequest={() => setIsModalOpen(true)}
          uploading={uploading}
        />
        <StreamOutput analysis={analysis} error={error} />
      </div>
    </div>
  )
}

export default App