import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Sparkles, Copy, Check, History, Trash2, X, LayoutTemplate, Download, Settings2, Wand2, Zap } from 'lucide-react'
import { useSpeechRecognition } from './hooks/useSpeechRecognition'
import { useHistory } from './hooks/useHistory'
import { useSettings, SUPPORTED_LANGUAGES } from './hooks/useSettings'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useApiKey } from './hooks/useApiKey'
import { PROMPT_TEMPLATES } from './data/templates'
const API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions'
const MODEL = 'qwen-plus'

async function refineWithAI(rawText, apiKey, onChunk, onDone, onError, retryCount = 0) {
  const MAX_RETRIES = 2
  const RETRY_DELAY = 1000

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        stream: true,
        messages: [
          {
            role: 'system',
            content:
              '你是一位专业的 AI Prompt 工程师，专门为 Vibe Coding（AI 辅助编程）场景优化需求描述。\n\n用户会给你一段口述的、比较随意的需求，你需要将其重构为一份结构清晰、逻辑严密、适合直接发给 Claude / Cursor 等 AI 编程工具的 Prompt。\n\n输出格式（Markdown）：\n## 角色设定\n## 核心需求\n## 技术要求\n## 验收标准\n\n只输出重构后的 Prompt，不要任何前言或解释。',
          },
          {
            role: 'user',
            content: `请将以下口述需求重构为 Vibe Coding Prompt：\n\n${rawText.trim()}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `HTTP ${res.status}`)
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value).split('\n')) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') { onDone(); return }
        try {
          const delta = JSON.parse(payload)?.choices?.[0]?.delta?.content
          if (delta) onChunk(delta)
        } catch (_) {}
      }
    }
    onDone()
  } catch (err) {
    if (retryCount < MAX_RETRIES && (err.message?.includes('network') || err.message?.includes('fetch'))) {
      console.log(`Retrying... (${retryCount + 1}/${MAX_RETRIES})`)
      setTimeout(() => {
        refineWithAI(rawText, apiKey, onChunk, onDone, onError, retryCount + 1)
      }, RETRY_DELAY * (retryCount + 1))
      return
    }
    onError(err.message)
  }
}

// UI Components
const NeonButton = ({ children, onClick, icon: Icon, variant = 'primary', disabled, className = '' }) => {
  const baseClasses = 'flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] hover:scale-105',
    secondary: 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-violet-500/30',
    danger: 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.5)]',
    ghost: 'text-white/60 hover:text-white hover:bg-white/5'
  }
  return (
    <button onClick={onClick} disabled={disabled} className={`${baseClasses} ${variants[variant]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  )
}

const GlassCard = ({ children, className = '' }) => (
  <div className={`glass-card rounded-2xl p-6 ${className}`}>
    {children}
  </div>
)

const Modal = ({ title, icon: Icon, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in-up">
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
    <div className="relative w-full max-w-md glass-card rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-violet-400" />}
          <h3 className="font-semibold text-lg">{title}</h3>
        </div>
        <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6 max-h-[70vh] overflow-y-auto">
        {children}
      </div>
    </div>
  </div>
)

const Toggle = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-violet-600' : 'bg-white/20'}`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
)

export default function App() {
  const [finalText, setFinalText] = useState('')
  const [interimText, setInterimText] = useState('')
  const [refinedPrompt, setRefinedPrompt] = useState('')
  const [status, setStatus] = useState('idle')
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [tempApiKey, setTempApiKey] = useState('')
  const rawScrollRef = useRef(null)

  const { history, addHistory, deleteHistory, clearHistory } = useHistory()
  const { settings, updateSetting, resetSettings } = useSettings()
  const { apiKey, showInput, saveApiKey, clearApiKey, closeInput, hasApiKey, isReady } = useApiKey()

  const handleTranscript = useCallback(({ final, interim }) => {
    if (final) setFinalText(prev => prev + final)
    setInterimText(interim)
  }, [])

  const { isListening, isSupported, start, stop } = useSpeechRecognition({
    onTranscript: handleTranscript,
    settings,
  })

  const toggleRecording = useCallback(() => {
    if (isListening) stop(); else start()
  }, [isListening, start, stop])

  const handleClearRaw = useCallback(() => {
    setFinalText('')
    setInterimText('')
  }, [])

  const handleRefine = useCallback(() => {
    const raw = finalText + interimText
    if (!raw.trim()) return
    setError('')
    setRefinedPrompt('')
    setStatus('processing')

    let accumulatedPrompt = ''
    refineWithAI(
      raw,
      apiKey,
      (chunk) => {
        accumulatedPrompt += chunk
        setRefinedPrompt(prev => prev + chunk)
      },
      () => {
        setStatus('idle')
        addHistory(raw, accumulatedPrompt)
      },
      (msg) => { setError(msg); setStatus('idle') }
    )
  }, [finalText, interimText, addHistory, apiKey])

  const handleCopy = useCallback(() => {
    if (!refinedPrompt) return
    navigator.clipboard.writeText(refinedPrompt).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [refinedPrompt])

  const loadTemplate = useCallback((template) => {
    setFinalText(template.template)
    setInterimText('')
    setRefinedPrompt('')
    setShowTemplates(false)
  }, [])

  const loadHistoryItem = useCallback((item) => {
    setFinalText(item.rawText)
    setRefinedPrompt(item.refinedPrompt)
    setInterimText('')
    setShowHistory(false)
  }, [])

  const handleExportMarkdown = useCallback(() => {
    if (!refinedPrompt) return
    const blob = new Blob([refinedPrompt], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${Date.now()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [refinedPrompt])

  const handleExportText = useCallback(() => {
    if (!refinedPrompt) return
    const blob = new Blob([refinedPrompt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompt-${Date.now()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }, [refinedPrompt])

  useKeyboardShortcuts([
    { key: ' ', action: toggleRecording },
    { key: 'enter', ctrl: true, action: handleRefine },
    { key: 'k', ctrl: true, action: handleClearRaw },
    { key: 'h', ctrl: true, action: () => setShowHistory(prev => !prev) },
    { key: 't', ctrl: true, action: () => setShowTemplates(prev => !prev) },
    { key: ',', ctrl: true, action: () => setShowSettings(prev => !prev) },
  ])

  useEffect(() => {
    if (rawScrollRef.current)
      rawScrollRef.current.scrollTop = rawScrollRef.current.scrollHeight
  }, [finalText, interimText])

  const isProcessing = status === 'processing'
  const isRecording = isListening

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-fuchsia-600/15 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="px-6 py-5 border-b border-white/10">
          <div className="w-full mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
                <Wand2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">VoicePrompt</h1>
                <p className="text-xs text-white/50">AI Prompt Engineering</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowTemplates(true)}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-violet-500/50 hover:text-white transition-all duration-300"
              >
                <LayoutTemplate className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                <span className="text-sm font-medium">模板</span>
              </button>
              <button
                onClick={() => setShowHistory(true)}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 hover:border-violet-500/50 hover:text-white transition-all duration-300"
              >
                <History className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                <span className="text-sm font-medium">历史</span>
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="group p-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:border-violet-500/50 hover:text-white transition-all duration-300"
              >
                <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
              </button>
            </div>
          </div>
        </header>

        {/* API Key Status Bar */}
        {isReady && (
          <div className={`px-6 py-2 text-center text-sm ${hasApiKey ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'}`}>
            {hasApiKey ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                API Key 已配置
                <button 
                  onClick={() => {
                    setTempApiKey(apiKey)
                    setShowInput(true)
                  }}
                  className="text-violet-400 hover:underline ml-2"
                >
                  修改
                </button>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                未配置 API Key，
                <button 
                  onClick={() => setShowInput(true)}
                  className="text-violet-400 hover:underline font-medium"
                >
                  点击配置
                </button>
              </span>
            )}
          </div>
        )}

        {/* Main */}
        <main className="flex-1 px-6 py-6">
          <div className="w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
            
            {/* Input Panel */}
            <GlassCard className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/30'}`} />
                  <span className="text-white/80 font-medium">{isRecording ? '正在聆听...' : '输入你的想法'}</span>
                </div>
                {finalText && (
                  <button onClick={handleClearRaw} className="text-xs text-white/40 hover:text-white/70 transition-colors">
                    清空
                  </button>
                )}
              </div>

              <div className="flex-1 relative">
                <textarea
                  ref={rawScrollRef}
                  value={finalText + interimText}
                  onChange={(e) => setFinalText(e.target.value)}
                  placeholder="点击麦克风开始录音，或直接输入..."
                  className="w-full h-full p-4 bg-white/5 border border-white/10 rounded-xl text-white/90 placeholder:text-white/30 resize-none outline-none focus:border-violet-500/50 focus:shadow-[0_0_20px_rgba(139,92,246,0.2)] transition-all"
                />
                {isRecording && (
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 text-red-400 text-sm font-medium">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    聆听中...
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                {!isSupported ? (
                  <span className="text-sm text-amber-400">您的浏览器不支持语音识别，请使用 Chrome 或 Safari</span>
                ) : (
                  <button
                    onClick={toggleRecording}
                    className={`group relative flex items-center gap-3 px-6 py-3 rounded-2xl font-semibold transition-all duration-500 overflow-hidden ${
                      isRecording
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.5)]'
                        : 'bg-white/5 text-white/90 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] border border-white/10 hover:border-violet-500/50'
                    }`}
                  >
                    {/* Animated background for recording */}
                    {isRecording && (
                      <>
                        <span className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 animate-pulse" />
                        <span className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 blur-xl opacity-50 animate-pulse" />
                      </>
                    )}
                    <span className="relative flex items-center gap-3">
                      <span className={`relative flex items-center justify-center w-8 h-8 rounded-full ${isRecording ? 'bg-white/20' : 'bg-violet-500/20 group-hover:bg-violet-500/30'} transition-colors`}>
                        {isRecording ? (
                          <MicOff className="w-4 h-4 relative z-10" />
                        ) : (
                          <Mic className="w-4 h-4 relative z-10 group-hover:scale-110 transition-transform" />
                        )}
                      </span>
                      <span className="relative z-10">{isRecording ? '停止录音' : '开始录音'}</span>
                    </span>
                  </button>
                )}

                <button
                  onClick={handleRefine}
                  disabled={isProcessing || !(finalText + interimText).trim()}
                  className="group relative flex items-center gap-3 px-8 py-3 rounded-2xl font-semibold text-white transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
                >
                  {/* Gradient background */}
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 transition-all duration-500 group-hover:scale-105" />
                  <span className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-500" />
                  
                  {/* Shine effect */}
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <span className="relative flex items-center gap-3">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
                      {isProcessing ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                      )}
                    </span>
                    <span>{isProcessing ? 'AI 优化中...' : '优化 Prompt'}</span>
                  </span>
                </button>
              </div>
            </GlassCard>

            {/* Output Panel */}
            <GlassCard className="flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Zap className="w-5 h-5 text-violet-400" />
                  <span className="text-white/80 font-medium">优化结果</span>
                </div>
                {refinedPrompt && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopy}
                      className={`p-2 rounded-lg transition-all ${copied ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/70 hover:bg-white/20'}`}
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <div className="relative group">
                      <button className="p-2 rounded-lg bg-white/10 text-white/70 hover:bg-white/20 transition-all">
                        <Download className="w-4 h-4" />
                      </button>
                      <div className="absolute right-0 top-full mt-2 w-32 glass-card rounded-xl py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                        <button onClick={handleExportMarkdown} className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">Markdown</button>
                        <button onClick={handleExportText} className="w-full px-4 py-2 text-left text-sm text-white/80 hover:bg-white/10">文本文件</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex-1 relative overflow-hidden">
                {refinedPrompt ? (
                  <div className="w-full h-full p-4 bg-black/30 border border-white/10 rounded-xl overflow-auto">
                    {error && (
                      <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        <div className="flex items-center justify-between">
                          <span>错误：{error}</span>
                          <button onClick={handleRefine} className="px-3 py-1 bg-red-500/20 rounded-lg text-red-300 text-xs">重试</button>
                        </div>
                      </div>
                    )}
                    <pre className="whitespace-pre-wrap text-white/80 text-sm leading-relaxed font-mono">
                      {refinedPrompt}
                      {isProcessing && <span className="inline-block w-0.5 h-4 bg-violet-400 ml-1 animate-pulse" />}
                    </pre>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                      <Sparkles className="w-8 h-8 text-white/20" />
                    </div>
                    <p className="text-sm">在左侧输入内容后点击「优化」</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>
        </main>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <Modal title="设置" icon={Settings2} onClose={() => setShowSettings(false)}>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">语音识别语言</label>
              <select
                value={settings.language}
                onChange={(e) => updateSetting('language', e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-violet-500/50"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-[#0a0a0f]">{lang.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">自动停止录音</label>
              <select
                value={settings.autoStopTimeout}
                onChange={(e) => updateSetting('autoStopTimeout', parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-violet-500/50"
              >
                <option value={0} className="bg-[#0a0a0f]">不自动停止</option>
                <option value={30} className="bg-[#0a0a0f]">30 秒</option>
                <option value={60} className="bg-[#0a0a0f]">1 分钟</option>
                <option value={120} className="bg-[#0a0a0f]">2 分钟</option>
                <option value={300} className="bg-[#0a0a0f]">5 分钟</option>
              </select>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-white/80">连续录音</span>
              <Toggle checked={settings.continuousListening} onChange={(v) => updateSetting('continuousListening', v)} />
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium text-white/80">实时转录</span>
              <Toggle checked={settings.interimResults} onChange={(v) => updateSetting('interimResults', v)} />
            </div>
            <div className="pt-4 border-t border-white/10 space-y-2">
              <button
                onClick={() => {
                  setShowSettings(false)
                  setTempApiKey(apiKey)
                  setShowInput(true)
                }}
                className="w-full px-4 py-2.5 text-sm text-white/80 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                {hasApiKey ? '修改 API Key' : '配置 API Key'}
              </button>
              <button onClick={resetSettings} className="w-full px-4 py-2.5 text-sm text-white/60 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                恢复默认设置
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <Modal title="选择模板" icon={LayoutTemplate} onClose={() => setShowTemplates(false)}>
          <div className="grid gap-3">
            {PROMPT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => loadTemplate(template)}
                className="text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-violet-500/30 transition-all group"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{template.name}</h3>
                    <p className="text-sm text-white/50">{template.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {/* History Modal */}
      {showHistory && (
        <Modal title="历史记录" icon={History} onClose={() => setShowHistory(false)}>
          {history.length === 0 ? (
            <div className="text-center py-12 text-white/40">
              <History className="w-12 h-12 mx-auto mb-3 text-white/20" />
              <p className="text-sm">暂无历史记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer group transition-all"
                  onClick={() => loadHistoryItem(item)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white/70 line-clamp-2 flex-1">{item.rawText.slice(0, 80)}...</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteHistory(item.id) }}
                      className="p-1.5 text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-white/40 mt-2">{new Date(item.timestamp).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          {history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/10">
              <button onClick={clearHistory} className="w-full px-4 py-2.5 text-sm text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors">
                清空历史
              </button>
            </div>
          )}
        </Modal>
      )}

      {/* API Key Input Modal */}
      {showInput && (
        <Modal title="配置 API Key" icon={Settings2} onClose={closeInput}>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-white/80 mb-2 block">阿里云 DashScope API Key</label>
              <p className="text-xs text-white/50 mb-3">
                请访问 <a href="https://dashscope.aliyun.com/" target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:underline">dashscope.aliyun.com</a> 获取 API Key
              </p>
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="sk-xxxxxxxxxx"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white outline-none focus:border-violet-500/50 placeholder:text-white/30"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (saveApiKey(tempApiKey)) {
                    setTempApiKey('')
                  }
                }}
                disabled={!tempApiKey.trim()}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all"
              >
                保存
              </button>
              {hasApiKey && (
                <button
                  onClick={closeInput}
                  className="px-4 py-2.5 bg-white/5 border border-white/10 text-white/80 rounded-xl hover:bg-white/10 transition-all"
                >
                  取消
                </button>
              )}
            </div>
            {hasApiKey && (
              <div className="pt-4 border-t border-white/10">
                <button
                  onClick={() => {
                    clearApiKey()
                    setTempApiKey('')
                  }}
                  className="w-full px-4 py-2.5 text-sm text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-colors"
                >
                  清除已保存的 API Key
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}