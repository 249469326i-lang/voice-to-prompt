import { useEffect, useCallback } from 'react'

export function useKeyboardShortcuts(shortcuts) {
  const handleKeyDown = useCallback((e) => {
    // 忽略在输入框中的快捷键（除非是全局快捷键）
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return
    }

    const key = e.key.toLowerCase()
    const ctrl = e.ctrlKey || e.metaKey // 支持 Mac 的 Cmd 键

    for (const shortcut of shortcuts) {
      const { key: shortcutKey, ctrl: needCtrl, shift: needShift, alt: needAlt, action } = shortcut

      const keyMatch = key === shortcutKey.toLowerCase()
      const ctrlMatch = needCtrl ? ctrl : !ctrl
      const shiftMatch = needShift ? e.shiftKey : !e.shiftKey
      const altMatch = needAlt ? e.altKey : !e.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault()
        action()
        break
      }
    }
  }, [shortcuts])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
