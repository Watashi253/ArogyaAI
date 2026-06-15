import { useCallback, useEffect, useState } from 'react'

export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const listener = (e) => setMatches(e.matches)
    media.addEventListener('change', listener)
    setMatches(media.matches)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

export function useIsMobile() {
  return useMediaQuery('(max-width: 1023px)')
}

export function useDisclosure(initial = false) {
  const [isOpen, setIsOpen] = useState(initial)
  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((v) => !v), [])
  return { isOpen, open, close, toggle }
}
