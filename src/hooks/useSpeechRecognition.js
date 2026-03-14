import { useState, useRef, useCallback, useEffect } from 'react'

export function useSpeechRecognition({ onTranscript, settings = {} }) {
  const [isListening, setIsListening] = useState(false)
  const [isSupported] = useState(
    () => !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  )
  const recognitionRef = useRef(null)
  const autoStopTimerRef = useRef(null)

  const { language = 'zh-CN', autoStopTimeout = 0 } = settings

  // 先定义 stop
  const stop = useCallback(() => {
    clearTimeout(autoStopTimerRef.current)
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        console.log('Stop error:', e)
      }
    }
    setIsListening(false)
  }, [])

  // 再定义 start
  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('您的浏览器不支持语音识别')
      return
    }

    // 如果已经在录音，先停止
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {}
    }

    const recognition = new SR()
    recognition.lang = language
    recognition.continuous = false // 移动端建议用 false
    recognition.interimResults = true

    recognition.onstart = () => {
      console.log('Speech recognition started')
      setIsListening(true)
    }

    recognition.onresult = (e) => {
      let interim = ''
      let final = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      onTranscript({ final, interim })
    }

    recognition.onerror = (e) => {
      console.error('Speech recognition error:', e.error)
      // 忽略 aborted 和 no-speech
      if (e.error === 'aborted' || e.error === 'no-speech') {
        return
      }
      if (e.error === 'not-allowed') {
        alert('请允许麦克风权限')
      } else if (e.error === 'network') {
        console.log('Network error')
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      console.log('Speech recognition ended')
      setIsListening(false)
    }

    recognitionRef.current = recognition
    
    try {
      recognition.start()
    } catch (e) {
      console.error('Start error:', e)
      alert('无法启动录音，请检查麦克风权限')
    }
  }, [onTranscript, language])

  useEffect(() => {
    return () => {
      clearTimeout(autoStopTimerRef.current)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {}
      }
    }
  }, [])

  return { isListening, isSupported, start, stop }
}
