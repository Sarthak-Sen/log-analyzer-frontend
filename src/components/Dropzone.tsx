import React, { useState, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './Dropzone.module.css'

interface DropzoneProps {
  onFileAccepted: (file: File) => void
  onLoginRequest: () => void
  uploading: boolean
}

function formatBytes(bytes: number) : string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isValidTextFile(file: File): boolean {
    const validMime = file.type === 'text/plain' || file.type === ''
    const validExt = file.name.toLowerCase().endsWith('.txt')
    return validMime && validExt
}

export function Dropzone({ onFileAccepted, onLoginRequest, uploading }: DropzoneProps) {
    const { token } = useAuth()
    const [isDragging, setIsDragging] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [acceptedFile, setAcceptedFile] = useState<File | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const isLoggedIn = token !== null

    const handleFile = (file: File) => {
        setError(null)

        if (!isValidTextFile(file)) {
        setError('Only .txt files are accepted. Please drop a plain text log file.')
        return
        }

        setAcceptedFile(file)
        onFileAccepted(file)
    }

    const handleClick = () => {
        if (!isLoggedIn) {
            onLoginRequest()
            return
        }
        inputRef.current?.click()
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        if (isLoggedIn) setIsDragging(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)

        if (!isLoggedIn) {
            onLoginRequest()
            return
        }

        const file = e.dataTransfer.files[0]
        if (file) handleFile(file)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) handleFile(file)
    }

    const containerClass = [
        styles.container,
        isDragging ? styles.containerDragging : '',
        !isLoggedIn ? styles.containerDisabled : '',
    ].join(' ')

    return (
        <div
            className={containerClass}
            onClick={handleClick}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
        <input
            ref={inputRef}
            type="file"
            accept=".txt"
            className={styles.hiddenInput}
            onChange={handleInputChange}
        />

        {!isLoggedIn && (
            <>
            <div className={styles.icon}>📂</div>
            <p className={styles.title}>
                <span className={styles.accent}>Click to login</span> or drop a file
            </p>
            <p className={styles.subtitle}>
                You must be logged in to upload log files
            </p>
            </>
        )}

        {isLoggedIn && !acceptedFile && (
            <>
            <div className={styles.icon}>📄</div>
            <p className={styles.title}>
                Drop your log file here
            </p>
            <p className={styles.subtitle}>
                or <span className={styles.accent}>click to browse</span>
            </p>
            <p className={styles.subtitle}>
                Only <span className={styles.accent}>.txt</span> files are accepted
            </p>
            </>
        )}

        {isLoggedIn && acceptedFile && (
        <div className={styles.fileInfo}>
            <div className={styles.icon}>{uploading ? '⏳' : '✅'}</div>
            <p className={styles.fileName}>{acceptedFile.name}</p>
            <p className={styles.fileSize}>{formatBytes(acceptedFile.size)}</p>
            <p className={styles.subtitle}>
            {uploading ? 'Uploading and analyzing...' : 'Analysis complete'}
            </p>
        </div>
        )}

        {error && <p className={styles.error}>{error}</p>}
        </div>
    )
}