// Minimal ambient types for the Document Picture-in-Picture API (not yet in TS's DOM lib).
// https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API
interface DocumentPictureInPictureOptions {
  width?: number
  height?: number
  disallowReturnToOpener?: boolean
  preferInitialWindowPlacement?: boolean
}

interface DocumentPictureInPicture extends EventTarget {
  requestWindow(options?: DocumentPictureInPictureOptions): Promise<Window>
  readonly window: Window | null
}

interface Window {
  readonly documentPictureInPicture?: DocumentPictureInPicture
}
