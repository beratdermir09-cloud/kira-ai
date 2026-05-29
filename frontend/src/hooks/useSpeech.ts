import { useState, useRef, useCallback, useEffect } from 'react'

// ── Speech Recognition (ses girişi) ──────────────────────────
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

// ── Text-to-Speech (ses çıkışı) ───────────────────────────────
export function useTextToSpeech() {
  const [speaking, setSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()

    // Markdown ve özel karakterleri temizle
    const clean = text
      .replace(/```[\s\S]*?```/g, 'Kod bloğu.')
      .replace(/`[^`]+`/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_~|]/g, '')
      .replace(/\[IMAGE_GEN:[\s\S]*?\]/g, 'Görsel oluşturuldu.')
      .replace(/\n{2,}/g, '. ')
      .replace(/\n/g, ' ')
      .trim()

    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.lang = 'tr-TR'
    utterance.rate = 1.05
    utterance.pitch = 1.0
    utterance.volume = 1.0

    // Türkçe ses varsa kullan
    const voices = window.speechSynthesis.getVoices()
    const trVoice = voices.find(v => v.lang.startsWith('tr')) ||
                    voices.find(v => v.lang.startsWith('tr-TR'))
    if (trVoice) utterance.voice = trVoice

    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)

    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return { speaking, speak, stop }
}

// ── Gerçek Zamanlı Voice Chat ─────────────────────────────────
// Konuşunca otomatik algılar, sessizlik sonrası gönderir,
// cevabı sesli okur.
export interface VoiceChatOptions {
  onSend: (text: string) => void          // mesajı gönder
  onTranscript: (text: string) => void    // anlık transkript
  autoSpeak?: boolean                      // cevabı sesli oku
  silenceMs?: number                       // sessizlik süresi (ms)
  lang?: string
}

export function useVoiceChat({
  onSend,
  onTranscript,
  autoSpeak = true,
  silenceMs = 1500,
  lang = 'tr-TR',
}: VoiceChatOptions) {
  const [active, setActive] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing'>('idle')
  const recognitionRef = useRef<any>(null)
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const accumulatedRef = useRef('')
  const { speak, stop: stopSpeak, speaking } = useTextToSpeech()

  const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null

  const supported = !!SpeechRecognition

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current)
      silenceTimerRef.current = null
    }
  }

  const startListening = useCallback(() => {
    if (!SpeechRecognition || speaking) return

    const recognition = new SpeechRecognition()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onstart = () => {
      setStatus('listening')
      accumulatedRef.current = ''
    }

    recognition.onresult = (e: any) => {
      clearSilenceTimer()

      let interim = ''
      let final = ''

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          final += t + ' '
          accumulatedRef.current += t + ' '
        } else {
          interim += t
        }
      }

      const current = accumulatedRef.current + interim
      setTranscript(current)
      onTranscript(current)

      // Sessizlik algılama — son konuşmadan silenceMs sonra gönder
      silenceTimerRef.current = setTimeout(() => {
        const text = accumulatedRef.current.trim()
        if (text.length > 2) {
          setStatus('processing')
          setTranscript('')
          accumulatedRef.current = ''
          onSend(text)
        }
      }, silenceMs)
    }

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn('Voice chat error:', e.error)
      }
      setStatus('listening')
    }

    recognition.onend = () => {
      // Sürekli dinleme — aktifse yeniden başlat
      if (active && recognitionRef.current) {
        try { recognition.start() } catch { }
      } else {
        setStatus('idle')
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch (e) {
      console.warn('Recognition start failed:', e)
    }
  }, [SpeechRecognition, lang, silenceMs, onSend, onTranscript, active, speaking])

  const start = useCallback(() => {
    if (!supported) return
    stopSpeak()
    setActive(true)
    setStatus('listening')
    setTranscript('')
    accumulatedRef.current = ''
  }, [supported, stopSpeak])

  const stop = useCallback(() => {
    setActive(false)
    setStatus('idle')
    clearSilenceTimer()
    recognitionRef.current?.stop()
    recognitionRef.current = null
    stopSpeak()
    setTranscript('')
    accumulatedRef.current = ''
  }, [stopSpeak])

  // active değişince dinlemeyi başlat/durdur
  useEffect(() => {
    if (active && !speaking) {
      startListening()
    } else if (!active) {
      recognitionRef.current?.stop()
    }
  }, [active, speaking, startListening])

  // Temizlik
  useEffect(() => {
    return () => {
      clearSilenceTimer()
      recognitionRef.current?.stop()
    }
  }, [])

  // Cevabı sesli oku (dışarıdan çağrılır)
  const speakResponse = useCallback((text: string) => {
    if (!autoSpeak) return
    // Dinlemeyi geçici durdur, konuşma bitince devam et
    recognitionRef.current?.stop()
    speak(text)
  }, [autoSpeak, speak])

  return {
    active,
    status,
    transcript,
    supported,
    start,
    stop,
    speakResponse,
    speaking,
  }
}
