import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'voice-to-prompt-api-key'

export function useApiKey() {
  const [apiKey, setApiKey] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [isReady, setIsReady] = useState(false)

  // Load API key from localStorage on mount
  useEffect(() => {
    // 延迟检查，确保 localStorage 可用
    const checkApiKey = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored) {
          setApiKey(stored)
        } else {
          // Check if there's an env variable
          const envKey = import.meta.env.VITE_API_KEY
          if (envKey) {
            setApiKey(envKey)
            localStorage.setItem(STORAGE_KEY, envKey)
          } else {
            // 移动端延迟显示弹窗
            setTimeout(() => {
              setShowInput(true)
            }, 500)
          }
        }
      } catch (e) {
        console.error('localStorage error:', e)
        setTimeout(() => {
          setShowInput(true)
        }, 500)
      }
      setIsReady(true)
    }

    checkApiKey()
  }, [])

  const saveApiKey = useCallback((key) => {
    const trimmed = key.trim()
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed)
      setApiKey(trimmed)
      setShowInput(false)
      return true
    }
    return false
  }, [])

  const clearApiKey = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setApiKey('')
    setShowInput(true)
  }, [])

  const openInput = useCallback(() => {
    setShowInput(true)
  }, [])

  const closeInput = useCallback(() => {
    if (apiKey) {
      setShowInput(false)
    }
  }, [apiKey])

  return {
    apiKey,
    showInput,
    saveApiKey,
    clearApiKey,
    openInput,
    closeInput,
    hasApiKey: !!apiKey,
  }
}
