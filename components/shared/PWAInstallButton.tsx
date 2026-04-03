'use client'
import { useEffect, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

// Typed wrapper for the non-standard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type InstallState =
  | 'loading'
  | 'standalone'       // already installed — hide button
  | 'native-prompt'    // Chrome/Edge Android/Desktop — can trigger native dialog
  | 'ios-safari'       // iOS Safari — show share sheet instructions
  | 'ios-other'        // iOS Chrome/Firefox — suggest Safari
  | 'unsupported'      // everything else

export function PWAInstallButton() {
  const [state, setState] = useState<InstallState>('loading')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Already running as installed PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    if (isStandalone) {
      setState('standalone')
      return
    }

    const ua = navigator.userAgent
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (isIOS) {
      // Safari on iOS: no CriOS (Chrome), no FxiOS (Firefox), no OPiOS (Opera)
      const isIOSSafari = /WebKit/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua)
      setState(isIOSSafari ? 'ios-safari' : 'ios-other')
      return
    }

    // Listen for Chrome/Edge native install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setState('native-prompt')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleNativeInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setState('standalone')
      setDeferredPrompt(null)
    }
  }

  // Already installed or not installable — render nothing
  if (state === 'loading' || state === 'standalone' || state === 'unsupported') {
    return null
  }

  // Chrome/Edge — single click triggers native dialog
  if (state === 'native-prompt') {
    return (
      <button
        onClick={handleNativeInstall}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        Install app
      </button>
    )
  }

  // iOS Safari — popover with share sheet instructions
  if (state === 'ios-safari') {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Install app
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="end" className="w-72 p-4">
          <p className="text-sm font-semibold mb-3">Add to Home Screen</p>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground min-w-[18px]">1.</span>
              <span>
                Tap the{' '}
                <span className="inline-flex items-center gap-0.5 font-medium text-foreground">
                  Share
                  {/* iOS share icon */}
                  <svg className="inline w-4 h-4 ml-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{' '}
                button at the bottom of your screen
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground min-w-[18px]">2.</span>
              <span>
                Scroll down and tap{' '}
                <span className="font-medium text-foreground">Add to Home Screen</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-medium text-foreground min-w-[18px]">3.</span>
              <span>Tap <span className="font-medium text-foreground">Add</span> in the top right</span>
            </li>
          </ol>
        </PopoverContent>
      </Popover>
    )
  }

  // iOS Chrome/Firefox — can't install, suggest Safari
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Install app
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="end" className="w-64 p-4">
        <p className="text-sm font-semibold mb-1">Open in Safari to install</p>
        <p className="text-sm text-muted-foreground">
          To add BoardFoot to your home screen, open this page in Safari on your iPhone or iPad.
        </p>
      </PopoverContent>
    </Popover>
  )
}
