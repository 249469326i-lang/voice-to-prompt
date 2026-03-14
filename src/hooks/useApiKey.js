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

  const validateApiKey = useCallback((key) => {
    const trimmed = key.trim()
    
    // 检查是否为空
    if (!trimmed) {
      return { valid: false, error: 'API Key 不能为空' }
    }
    
    // 检查格式：阿里云 DashScope Key 通常以 sk- 开头
    if (!trimmed.startsWith('sk-')) {
      return { valid: false, error: 'API Key 格式错误，应以 sk- 开头' }
    }
    
    // 检查长度（通常 DashScope Key 较长）
    if (trimmed.length < 20) {
      return { valid: false, error: 'API Key 长度不足，请检查是否完整' }
    }
    
    return { valid: true, error: null }
  }, [])

  const saveApiKey = useCallback((key) => {
    const trimmed = key.trim()
    
    // 验证格式
    const validation = validateApiKey(trimmed)
    if (!validation.valid) {
      alert(validation.error)
      return { success: false, error: validation.error }
    }
    
    localStorage.setItem(STORAGE_KEY, trimmed)
    setApiKey(trimmed)
    setShowInput(false)
    return { success: true, error: null }
  }, [validateApiKey])

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
    setShowInput,
    saveApiKey,
    clearApiKey,
    openInput,
    closeInput,
    hasApiKey: !!apiKey,
    isReady,
  }
}
