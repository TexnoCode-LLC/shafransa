import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

// Cədvəl filtrlərini URL-də saxlayır (yeniləmə/geri düyməsi/paylaşılan link filtrləri itirmir).
// Yeniləmə həmişə cari window.location-dan başlayır — react-router-in "prev" dəyəri köhnə render-dən ola bilər.
export function useUrlFilters() {
  const [params, setParams] = useSearchParams()

  const update = useCallback(
    (changes, { resetPage = true } = {}) => {
      const next = new URLSearchParams(window.location.search)
      Object.entries(changes).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "" || value === "all") next.delete(key)
        else next.set(key, String(value))
      })
      if (resetPage && !("page" in changes)) next.delete("page")
      setParams(next, { replace: true })
    },
    [setParams]
  )

  const clear = useCallback(() => setParams({}, { replace: true }), [setParams])

  return { params, update, clear }
}
