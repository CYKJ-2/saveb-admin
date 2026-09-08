/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'screenfull' {
  const screenfull: {
    isEnabled: boolean
    isFullscreen: boolean
    request: (element?: HTMLElement) => Promise<void>
    exit: () => Promise<void>
    toggle: (element?: HTMLElement) => Promise<void>
    on: (event: string, handler: () => void) => void
    off: (event: string, handler: () => void) => void
  }
  export default screenfull
}
