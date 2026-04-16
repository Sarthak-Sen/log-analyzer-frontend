import type { AnalysisState } from '../types/analysis'
import styles from './StreamOutput.module.css'

interface StreamOutputProps {
  analysis: AnalysisState
  error: string | null
}

function formatLines(processed: number): string {
    return processed.toLocaleString()
}

function getStatusClass(status: string): string {
    if (status === 'complete') return styles.statusComplete
    if (status === '') return styles.statusIdle
    return styles.statusStreaming
}

function getStatusLabel(status: string): string {
    if (status === 'complete') return 'Complete'
    if (status === '') return 'Idle'
    return 'Processing'
}

export function StreamOutput({ analysis, error }: StreamOutputProps) {
    const isIdle = analysis.status === '' && analysis.linesProcessed === 0
    const { status, linesProcessed, errorRate, anomaliesDetected, workerId, anomalies } = analysis

    return (
        <div className={styles.container}>
        <div className={styles.header}>
            <span className={styles.headerTitle}>Analysis Output</span>
            <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
            {getStatusLabel(status)}
            </span>
        </div>

        {error && (
        <p className={styles.error}>{error}</p>
        )}

        {isIdle ? (
            <div className={styles.idle}>
            <span className={styles.idleIcon}>⏳</span>
            <p className={styles.idleText}>
                Waiting for a log file to be uploaded.
            </p>
            </div>
        ) : (
            <div className={styles.body}>
            <div className={styles.stats}>
                <div className={styles.statCard}>
                <span className={styles.statLabel}>Lines Processed</span>
                <span className={styles.statValue}>
                    {formatLines(linesProcessed)}
                </span>
                </div>

                <div className={styles.statCard}>
                <span className={styles.statLabel}>Error Rate</span>
                <span className={`${styles.statValue} ${errorRate > 5 ? styles.statValueWarning : styles.statValueAccent}`}>
                    {errorRate.toFixed(2)}%
                </span>
                </div>

                <div className={styles.statCard}>
                <span className={styles.statLabel}>Anomalies Found</span>
                <span className={`${styles.statValue} ${anomaliesDetected > 0 ? styles.statValueWarning : styles.statValueAccent}`}>
                    {anomaliesDetected}
                </span>
                </div>

                <div className={styles.statCard}>
                <span className={styles.statLabel}>Worker</span>
                <span className={styles.statValue}>
                    {workerId !== null ? `Worker ${workerId}` : '—'}
                </span>
                </div>
            </div>

            {workerId !== null && status !== 'complete' && (
                <p className={styles.workerTag}>
                ⚙ Worker {workerId} processing chunk...
                </p>
            )}

            <div className={styles.anomalySection}>
                <span className={styles.anomalySectionTitle}>
                Anomaly Feed
                </span>
                <div className={styles.anomalyFeed}>
                {anomalies.length === 0 ? (
                    <p className={styles.emptyFeed}>No anomalies detected yet.</p>
                ) : (
                    anomalies.map((anomaly, index) => (
                    <div key={index} className={styles.anomalyCard}>
                        <span className={styles.anomalyType}>{anomaly.type}</span>
                        <span className={styles.anomalyService}>{anomaly.service}</span>
                        <span className={styles.anomalyDescription}>{anomaly.description}</span>
                        <span className={styles.anomalyTimestamp}>{anomaly.timestamp}</span>
                    </div>
                    ))
                )}
                </div>
            </div>
            </div>
        )}
        </div>
    )
}