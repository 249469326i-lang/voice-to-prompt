import { useState, useEffect, useCallback } from 'react'

const STORAGE_KEY = 'voiceprompt-history'
const MAX_HISTORY = 50

export function useHistory() {
  const [history, setHistory] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    } catch (e) {
      console.error('Failed to save history:', e)
    }
  }, [history])

  const addHistory = useCallback((rawText, refinedPrompt) => {
    const newItem = {
      id: Date.now(),
      rawText,
      refinedPrompt,
      timestamp: Date.now(),
    }
    setHistory(prev => {
      const updated = [newItem, ...prev].slice(0, MAX_HISTORY)
      return updated
    })
  }, [])

  const deleteHistory = useCallback((id) => {
    setHistory(prev => prev.filter(item => item.id !== id))
  }, [])

  const clearHistory = useCallback(() => {
    if (window.confirm('确定要清空所有历史记录吗？')) {
      setHistory([])
    }
  }, [])

  const getHistoryItem = useCallback((id) => {
    return history.find(item => item.id === id)
  }, [history])

  return {
    history,
    addHistory,
    deleteHistory,
    clearHistory,
    getHistoryItem,
  }
}
