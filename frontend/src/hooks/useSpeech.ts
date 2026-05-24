import { useState, useRef, useCallback } from 'react'

// Speech Recognition (voice input)
export function useSpeechRecognition(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef<any>(null)

  const start = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = 'tr-TR'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onresult = (e: any) => {
      const text = e.results[0][0].transcript
      onResult(text)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setListening(true)
  }, [onResult])

  const stop = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const supported = !!(
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
  )

  return { listening, start, stop, supported }
}

// Text-to-Speech (voice output)
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false)

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return { speaking, speak, stop }
}
