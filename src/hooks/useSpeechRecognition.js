import { useState, useRef, useCallback, useEffect } from 'react'

export function useSpeechRecognition({ onTranscript, settings = {} }) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const recognitionRef = useRef(null)
  const autoStopTimerRef = useRef(null)

  const { language = 'zh-CN', autoStopTimeout = 0 } = settings

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return

    const recognition = new SR()
    recognition.lang = language
    recognition.continuous = settings.continuousListening !== false
    recognition.interimResults = settings.interimResults !== false

    recognition.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      onTranscript({ final, interim })

      // 重置自动停止计时器
      if (autoStopTimeout > 0) {
        clearTimeout(autoStopTimerRef.current)
        autoStopTimerRef.current = setTimeout(() => {
          stop()
        }, autoStopTimeout * 1000)
      }
    }

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error)
      setIsListening(false)
    }

    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)

    // 启动自动停止计时器
    if (autoStopTimeout > 0) {
      autoStopTimerRef.current = setTimeout(() => {
        stop()
      }, autoStopTimeout * 1000)
    }
  }, [onTranscript, language, autoStopTimeout, settings.continuousListening, settings.interimResults])

  const stop = useCallback(() => {
    clearTimeout(autoStopTimerRef.current)
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  useEffect(() => {
    return () => {
      clearTimeout(autoStopTimerRef.current)
      recognitionRef.current?.stop()
    }
  }, [])

  return { isListening, isSupported, start, stop }
}
