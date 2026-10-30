import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { BookOpen, Leaf, Loader2, MessageCircle, Send, ShoppingBag, Stethoscope, X } from "lucide-react"

import api from "@/services/api"

const SOURCE_ICONS = { plant: Leaf, blog: BookOpen, product: ShoppingBag, therapist: Stethoscope }
const MAX_HISTORY = 10

// Ana səhifədəki chatbot: suallara saytın öz məlumatları (ensiklopediya, bloq, market, fitoterapevtlər) əsasında cavab verir
export default function ChatWidget() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([]) // { role, content, sources? }
  const [loading, setLoading] = useState(false)
  const listRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const send = async (text) => {
    const message = (text ?? input).trim()
    if (message.length < 2 || loading) return
    const history = messages.slice(-MAX_HISTORY).map(({ role, content }) => ({ role, content }))
    setMessages((prev) => [...prev, { role: "user", content: message }])
    setInput("")
    setLoading(true)
    try {
      const data = await api.post("/ai/chat", { message, history })
      setMessages((prev) => [...prev, { role: "assistant", content: data?.answer || "", sources: data?.sources || [] }])
    } catch (err) {
      const content = err?.status === 429 ? t("chat.too_many", "Çox sual göndərdiniz. Bir dəqiqə sonra yenidən yazın.") : t("chat.error", "Cavab almaq alınmadı. Bir az sonra yenidən cəhd edin.")
      setMessages((prev) => [...prev, { role: "assistant", content, error: true }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [t("chat.suggest_1", "Zəfəranın faydaları nədir?"), t("chat.suggest_2", "Yuxusuzluğa hansı bitki kömək edir?"), t("chat.suggest_3", "Fitoterapevtlə necə görüş təyin edim?")]

  return (
    <>
      {open && (
        <section
          className="fixed bottom-24 right-4 z-50 flex h-[min(560px,calc(100vh-8rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-2xl sm:right-6"
          aria-label={t("chat.title", "Shafransa köməkçisi")}
        >
          <header className="flex items-center gap-3 border-b border-neutral-100 bg-primary px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{t("chat.title", "Shafransa köməkçisi")}</p>
              <p className="truncate text-xs text-white/80">{t("chat.subtitle", "Saytdakı məlumatlar əsasında cavab verir")}</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-white/15" aria-label={t("chat.close", "Bağla")}>
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto bg-neutral-50/60 px-4 py-4" aria-live="polite">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm leading-relaxed text-neutral-700 shadow-sm">
                  {t("chat.welcome", "Salam! Dərman bitkiləri, məhsullar və ya fitoterapevtlər haqqında sual verin — saytdakı məlumatlarla cavab verim.")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onClick={() => send(s)} className="rounded-full border border-primary/30 bg-white px-3 py-1.5 text-left text-xs text-primary transition-colors hover:bg-primary/5">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <p key={i} className="ml-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-tr-sm bg-primary px-3.5 py-2.5 text-sm text-white">
                  {m.content}
                </p>
              ) : (
                <div key={i} className="max-w-[90%] space-y-2">
                  <p className={`whitespace-pre-line rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${m.error ? "bg-rose-50 text-rose-700" : "bg-white text-neutral-700"}`}>
                    {m.content}
                  </p>
                  {m.sources?.length > 0 && (
                    <ul className="space-y-1.5">
                      {m.sources.slice(0, 5).map((s) => {
                        const Icon = SOURCE_ICONS[s.type] || Leaf
                        return (
                          <li key={s.url}>
                            <Link to={s.url} onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-neutral-700 transition-colors hover:border-primary hover:text-primary">
                              <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="truncate">{s.title}</span>
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            )}
            {loading && (
              <p className="inline-flex items-center gap-2 rounded-2xl rounded-tl-sm bg-white px-3.5 py-2.5 text-sm text-neutral-500 shadow-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> {t("chat.thinking", "Cavab hazırlanır…")}
              </p>
            )}
          </div>

          <form
            className="border-t border-neutral-100 bg-white p-3"
            onSubmit={(e) => {
              e.preventDefault()
              send()
            }}
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1000}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    send()
                  }
                }}
                placeholder={t("chat.placeholder", "Sualınızı yazın…")}
                className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
              <button type="submit" disabled={loading || input.trim().length < 2} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-opacity disabled:opacity-40" aria-label={t("chat.send", "Göndər")}>
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-neutral-400">{t("chat.disclaimer", "Məlumat maarifləndirici xarakter daşıyır və həkim məsləhətini əvəz etmir.")}</p>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-xl shadow-primary/30 transition-transform hover:scale-105 sm:right-6"
        aria-label={open ? t("chat.close", "Bağla") : t("chat.open", "Köməkçi ilə danış")}
        aria-expanded={open}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </>
  )
}
