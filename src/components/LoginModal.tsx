import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import styles from './LoginModal.module.css'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const { login } = useAuth()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    if(!isOpen) return null
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try{
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
                {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                }
            )

            if(!res.ok) {
                const data = await res.json().catch(() => null)
                setError(data?.message ?? 'Invalid credentials. Please try again.')
                return
            }

            const data = await res.json()
            login(data.token)
            onClose()
        }
        catch {
            setError('Could not reach the server. Please try again.')
        }
        finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>

            <button
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close login modal"
            >
            ✕
            </button>

            <h2 className={styles.heading}>Sign in</h2>
            <p className={styles.subheading}>
            Log in to start uploading and analyzing logs.
            </p>

            <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
                <label className={styles.label} htmlFor="username">
                Username
                </label>
                <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="your username"
                className={styles.input}
                />
            </div>

            <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                Password
                </label>
                <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={styles.input}
                />
            </div>

            {error && (
                <p className={styles.error}>{error}</p>
            )}

            <button
                type="submit"
                disabled={loading}
                className={styles.submitButton}
            >
                {loading ? 'Signing in...' : 'Sign in'}
            </button>
            </form>

        </div>
        </div>
    )
}

