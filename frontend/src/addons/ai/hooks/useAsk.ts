import { useCallback, useEffect, useRef, useState } from 'react'
import { answers, type AiAnswer } from '@/addons/ai/fixtures/ai'

function match(question: string): AiAnswer {
  const needle = question.toLowerCase()

  const scored = answers
    .map((answer) => {
      const words = answer.question.toLowerCase().split(/\s+/)
      const hits = words.filter((word) => word.length > 3 && needle.includes(word)).length
      return { answer, hits }
    })
    .sort((a, b) => b.hits - a.hits)

  return scored[0].hits > 0 ? scored[0].answer : answers[0]
}

export interface Ask {
  question: string
  answer: AiAnswer | null
  pending: boolean
  setQuestion: (question: string) => void
  submit: (question?: string) => void
  reset: () => void
}

export function useAsk(): Ask {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<AiAnswer | null>(null)
  const [pending, setPending] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => window.clearTimeout(timer.current)
  }, [])

  const submit = useCallback(
    (override?: string) => {
      const asked = (override ?? question).trim()
      if (!asked) return

      setQuestion(asked)
      setPending(true)
      setAnswer(null)

      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        setAnswer(match(asked))
        setPending(false)
      }, 550)
    },
    [question],
  )

  const reset = useCallback(() => {
    window.clearTimeout(timer.current)
    setQuestion('')
    setAnswer(null)
    setPending(false)
  }, [])

  return { question, answer, pending, setQuestion, submit, reset }
}
