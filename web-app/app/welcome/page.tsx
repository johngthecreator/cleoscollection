"use client"

import { useEffect, useState, type FormEvent } from "react"
import Image from "next/image"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { authClient } from "@/lib/auth-client"

type Question = {
  title: string
  description: string
  options?: readonly string[]
  placeholder?: string
}

const slideVariants = {
  enter: (direction: number) => ({ opacity: 0, x: direction * 32 }),
  center: { opacity: 1, x: 0 },
  exit: (direction: number) => ({ opacity: 0, x: direction * -32 }),
}

const fadeVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
}

const questions: readonly Question[] = [
  {
    title: "What are you shopping for?",
    description: "We’ll use this to find clothes in the right department.",
    options: ["Men’s clothes", "Women’s clothes"],
  },
  {
    title: "Which outfit would you reach for first?",
    description: "Go with the one that feels most like you on a good day.",
    options: ["Tailored blazer, straight jeans, loafers", "Oversized tee, relaxed pants, sneakers", "Flowy dress, delicate jewelry, sandals", "Statement jacket, bold color, standout shoes", "Vintage pieces mixed with modern basics"],
  },
  {
    title: "What would you build an outfit around?",
    description: "Pick the piece that would make you want to get dressed.",
    options: ["A perfectly cut basic", "An interesting print", "A colorful statement piece", "A great pair of shoes", "A vintage find"],
  },
  {
    title: "Pick a color palette for your closet.",
    description: "Imagine every piece working together.",
    options: ["Black, white, and gray", "Cream, camel, and chocolate", "Sage, blush, and other soft colors", "Red, cobalt, and other brights", "Burgundy, emerald, and deep tones", "A little of everything"],
  },
  {
    title: "Which silhouette feels most like you?",
    description: "Picture the shape of your favorite outfit.",
    options: ["Fitted and tailored", "Relaxed and oversized", "Flowy and loose", "A balance of fitted and relaxed"],
  },
  {
    title: "Which texture would you pick up in a shop?",
    description: "Materials say a lot about the mood of an outfit.",
    options: ["Crisp cotton or linen", "Soft knits", "Smooth silk or satin", "Worn-in denim or leather", "Lace or embroidery", "I mix textures"],
  },
  {
    title: "Pick a pattern for a statement piece.",
    description: "Or choose a solid if that's more your style.",
    options: ["I prefer solids", "Subtle stripes or checks", "Florals and soft prints", "Statement prints", "It depends on the piece"],
  },
  {
    title: "Which design era would you borrow from?",
    description: "Choose the look that draws you in, even if you mix eras.",
    options: ["Timeless classics", "Vintage and retro", "Modern minimalism", "Romantic details", "Experimental and eclectic"],
  },
  {
    title: "Where would you wear your ideal new outfit?",
    description: "Think about the part of your life you want to dress for.",
    options: ["Everyday errands and weekends", "Work or school", "Dinner or a night out", "Special occasions", "Anywhere I can"],
  },
  {
    title: "What makes you save a piece?",
    description: "Pick the thing that wins you over first.",
    options: ["The fit", "The color", "The fabric and quality", "The unusual detail", "The price", "How many ways I can wear it"],
  },
  {
    title: "Anything else we should know?",
    description: "Share favorite brands, fabrics, sizes, things to avoid, or anything else. You can leave this blank.",
    placeholder: "For example: I love linen, avoid wool, and want more pieces for warm weather…",
  },
]

export default function WelcomePage() {
  const { data: session, isPending } = authClient.useSession()
  const [step, setStep] = useState(0)
  const [showIntro, setShowIntro] = useState(true)
  const [direction, setDirection] = useState<1 | -1>(1)
  const reduceMotion = useReducedMotion()
  const [answers, setAnswers] = useState<string[]>(() => questions.map(() => ""))
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const question = questions[step]
  const currentAnswer = answers[step] ?? ""
  const userStyle = questions
    .slice(1)
    .map((item, index) => `${item.title}\n${answers[index + 1]?.trim() || "No additional details"}`)
    .join("\n\n")

  useEffect(() => {
    if (!isPending && !session) {
      window.location.replace("/login")
    } else if (!isPending && session?.user.userStyle != null) {
      window.location.replace("/dashboard")
    }
  }, [isPending, session])

  function updateAnswer(value: string) {
    setAnswers((previous) => previous.map((answer, index) => index === step ? value : answer))
    setError("")
  }

  async function handleNext(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!question.placeholder && !currentAnswer.trim()) {
      setError("Choose an answer to continue.")
      return
    }
    setError("")
    if (step === questions.length - 1) {
      await handleSave()
      return
    }
    setDirection(1)
    setStep((current) => current + 1)
  }

  function handleBack() {
    setError("")
    setDirection(-1)
    setStep((current) => current - 1)
  }

  async function handleSave() {
    setError("")
    setIsSubmitting(true)
    try {
      const result = await authClient.updateUser({
        userStyle,
        department: answers[0] === "Men’s clothes" ? "men" : "women",
      })
      if (result.error) {
        setError(result.error.message ?? "Unable to save your style. Please try again.")
        return
      }
      window.location.replace("/dashboard")
    } catch {
      setError("Unable to save your style. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isPending || !session || session.user.userStyle != null) {
    return <main className="flex flex-1 items-center justify-center">Loading…</main>
  }

  return (
    <main className="min-h-dvh bg-[#faf9f6] text-foreground">
      <div className="flex min-h-dvh flex-col">
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-5 py-12 sm:px-10">
          {!showIntro && <div className="mb-6 h-px bg-foreground/15" aria-hidden="true">
              <motion.div
                className="h-px bg-foreground"
                initial={false}
                animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
                transition={{ duration: reduceMotion ? 0 : 0.3 }}
              />
          </div>}

          <AnimatePresence mode="wait" initial={false} custom={direction}>
            <motion.section
              key={showIntro ? "intro" : step}
              custom={direction}
              variants={reduceMotion ? fadeVariants : slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduceMotion ? 0.12 : 0.24, ease: "easeInOut" }}
              aria-labelledby="quiz-heading"
            >
              {showIntro ? (
                <div className="flex flex-col items-center text-center">
                  <h1 id="quiz-heading" className="text-4xl sm:text-5xl" style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}>Welcome to</h1>
                  <Image src="/cleos-collection-logo.png" alt="Cleo’s Collection" width={1113} height={130} priority className="mt-6 h-auto w-full max-w-lg" />
                  <Button size="lg" type="button" className="mt-12" onClick={() => setShowIntro(false)}>Get started</Button>
                </div>
              ) : (
                <>
              <h1 id="quiz-heading" className="max-w-2xl text-4xl leading-tight sm:text-5xl" style={{ fontFamily: "var(--font-cormorant-garamond), serif" }}>
                {question.title}
              </h1>
              <p className="mt-2 max-w-xl text-base leading-relaxed text-muted-foreground">
                {question.description}
              </p>

                <form className="mt-8" onSubmit={handleNext}>
                  {question.options ? (
                    <fieldset className="border-t border-foreground/15">
                      <legend className="sr-only">{question.title}</legend>
                      {question.options.map((option, index) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={currentAnswer === option}
                          onClick={() => updateAnswer(option)}
                          className={`flex w-full items-center gap-5 border-b border-foreground/15 px-3 py-4 text-left text-base transition-colors hover:bg-white hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${currentAnswer === option ? "bg-white text-foreground" : "text-muted-foreground"}`}
                        >
                          <span className="w-6 shrink-0 text-xs tabular-nums">{String(index + 1).padStart(2, "0")}</span>
                          <span className="flex-1">{option}</span>
                          <span aria-hidden="true" className={`size-4 shrink-0 rounded-full border ${currentAnswer === option ? "border-foreground bg-foreground shadow-[inset_0_0_0_3px_var(--background)]" : "border-muted-foreground/50"}`} />
                        </button>
                      ))}
                    </fieldset>
                  ) : (
                    <div className="grid gap-3">
                      <Label htmlFor="extra-details" className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Your answer</Label>
                      <Textarea
                        id="extra-details"
                        value={currentAnswer}
                        onChange={(event) => updateAnswer(event.target.value)}
                        placeholder={question.placeholder}
                        rows={6}
                        className="min-h-44 resize-none rounded-none"
                      />
                    </div>
                  )}
                  {error && <p className="mt-5 text-sm text-destructive" role="alert">{error}</p>}
                  <div className="mt-6 flex items-center justify-between gap-4">
                    {step > 0 ? <Button type="button" variant="ghost" onClick={handleBack} disabled={isSubmitting}>Back</Button> : <span />}
                    <Button size="lg" type="submit" disabled={isSubmitting}>
                      {isSubmitting ? "Saving…" : step === questions.length - 1 ? "Finish →" : "Continue"}
                    </Button>
                  </div>
                </form>
                </>
              )}
            </motion.section>
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
