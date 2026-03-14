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
      // 忽略 aborted 错误（用户主动停止）
      if (e.error === 'aborted') {
        return
      }
      // 移动端常见错误处理
      if (e.error === 'not-allowed') {
        alert('请允许麦克风权限以使用语音识别功能')
      } else if (e.error === 'network') {
        // 网络错误可能是暂时的，不显示弹窗
        console.log('Network error, retrying...')
      } else if (e.error === 'no-speech') {
        // 没有检测到语音，正常情况
        console.log('No speech detected')
      }
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
