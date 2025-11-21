'use client'

import * as NProgress from 'nprogress'
import * as React from 'react'

const toAbsoluteURL = (url: string): string => {
  return new URL(url, window.location.href).href
}

const isHashAnchor = (currentUrl: string, newUrl: string): boolean => {
  const current = new URL(toAbsoluteURL(currentUrl))
  const next = new URL(toAbsoluteURL(newUrl))
  // Compare URLs while ignoring hash fragments
  return current.href.split('#')[0] === next.href.split('#')[0]
}

const isSameHostName = (currentUrl: string, newUrl: string): boolean => {
  const current = new URL(toAbsoluteURL(currentUrl))
  const next = new URL(toAbsoluteURL(newUrl))
  // Compare hostnames (ignore www prefix)
  return current.hostname.replace(/^www\./, '') === next.hostname.replace(/^www\./, '')
}

export type NextTopLoaderProps = {
  /**
   * Color for the TopLoader.
   * @default "#29d"
   */
  color?: string
  /**
   * The initial position for the TopLoader in percentage, 0.08 is 8%.
   * @default 0.08
   */
  initialPosition?: number
  /**
   * The increament delay speed in milliseconds.
   * @default 200
   */
  crawlSpeed?: number
  /**
   * The height for the TopLoader in pixels (px).
   * @default 3
   */
  height?: number
  /**
   * Auto increamenting behaviour for the TopLoader.
   * @default true
   */
  crawl?: boolean
  /**
   * To show spinner or not.
   * @default true
   */
  showSpinner?: boolean
  /**
   * Animation settings using easing (a CSS easing string).
   * @default "ease"
   */
  easing?: string
  /**
   * Animation speed in ms for the TopLoader.
   * @default 200
   */
  speed?: number
  /**
   * Defines a shadow for the TopLoader.
   * @default "0 0 10px ${color},0 0 5px ${color}"
   *
   * @ you can disable it by setting it to `false`
   */
  shadow?: string | false
  /**
   * Defines a template for the TopLoader.
   * @default "<div class="bar" role="bar"><div class="peg"></div></div>
   * <div class="spinner" role="spinner"><div class="spinner-icon"></div></div>"
   */
  template?: string
  /**
   * Defines zIndex for the TopLoader.
   * @default 1600
   *
   */
  zIndex?: number
  /**
   * To show the TopLoader at bottom.
   * @default false
   *
   */
  showAtBottom?: boolean
  /**
   * To show the TopLoader for hash anchors.
   * @default true
   *
   */
  showForHashAnchor?: boolean
}

const NextTopLoader = ({
  color: propColor,
  height: propHeight,
  showSpinner,
  crawl,
  crawlSpeed,
  initialPosition,
  easing,
  speed,
  shadow,
  template,
  zIndex = 1600,
  showAtBottom = false,
  showForHashAnchor = true
}: NextTopLoaderProps): React.JSX.Element => {
  // Defaults
  const defaultColor = '#29d'
  const defaultHeight = 3

  // Use provided values or fallbacks
  const color = propColor ?? defaultColor
  const height = propHeight ?? defaultHeight

  // Resolve shadow styling
  const boxShadow =
    !shadow && shadow !== undefined
      ? ''
      : shadow
        ? `box-shadow:${shadow}`
        : `box-shadow:0 0 10px ${color},0 0 5px ${color}`

  // Position bar and spinner at top or bottom
  const positionStyle = showAtBottom ? 'bottom: 0;' : 'top: 0;'
  const spinnerPositionStyle = showAtBottom ? 'bottom: 15px;' : 'top: 15px;'

  /**
   * Define CSS for NextTopLoader
   */
  const styles = (
    <style>
      {`#nprogress{pointer-events:none}#nprogress .bar{background:${color};position:fixed;z-index:${zIndex};${positionStyle}left:0;width:100%;height:${height}px}#nprogress .peg{display:block;position:absolute;right:0;width:100px;height:100%;${boxShadow};opacity:1;-webkit-transform:rotate(3deg) translate(0px,-4px);-ms-transform:rotate(3deg) translate(0px,-4px);transform:rotate(3deg) translate(0px,-4px)}#nprogress .spinner{display:block;position:fixed;z-index:${zIndex};${spinnerPositionStyle}right:15px}#nprogress .spinner-icon{width:18px;height:18px;box-sizing:border-box;border:2px solid transparent;border-top-color:${color};border-left-color:${color};border-radius:50%;-webkit-animation:nprogress-spinner 400ms linear infinite;animation:nprogress-spinner 400ms linear infinite}.nprogress-custom-parent{overflow:hidden;position:relative}.nprogress-custom-parent #nprogress .bar,.nprogress-custom-parent #nprogress .spinner{position:absolute}@-webkit-keyframes nprogress-spinner{0%{-webkit-trans`}
    </style>
  )

  React.useEffect((): ReturnType<React.EffectCallback> => {
    // Configure NProgress behaviour
    NProgress.configure({
      showSpinner: showSpinner ?? true, // Show spinner or not
      trickle: crawl ?? true, // Auto-increment behaviour
      trickleSpeed: crawlSpeed ?? 200, // Auto-increment speed
      minimum: initialPosition ?? 0.08, // Initial position (percentage)
      easing: easing ?? 'ease', // Animation easing
      speed: speed ?? 200, // Animation speed
      // HTML template
      template:
        template ??
        '<div class="bar" role="bar"><div class="peg"></div></div><div class="spinner" role="spinner"><div class="spinner-icon"></div></div>'
    })

    /**
     * Check whether the new URL is just a different anchor on the same page.
     */
    function isAnchorOfCurrentUrl(currentUrl: string, newUrl: string): boolean {
      const currentUrlObj = new URL(currentUrl)
      const newUrlObj = new URL(newUrl)
      // Compare hostname, path, and search params
      if (
        currentUrlObj.hostname === newUrlObj.hostname &&
        currentUrlObj.pathname === newUrlObj.pathname &&
        currentUrlObj.search === newUrlObj.search
      ) {
        // Check if the new URL is only an anchor change
        const currentHash = currentUrlObj.hash
        const newHash = newUrlObj.hash
        return (
          currentHash !== newHash && currentUrlObj.href.replace(currentHash, '') === newUrlObj.href.replace(newHash, '')
        )
      }
      return false
    }

    // Grab the html element to remove the nprogress-busy class when needed
    // deno-lint-ignore no-var
    const nProgressClass: NodeListOf<HTMLHtmlElement> = document.querySelectorAll('html')

    // Helper to clear the busy class
    const removeNProgressClass = (): void =>
      nProgressClass.forEach((el: Element) => el.classList.remove('nprogress-busy'))

    /**
     * Find the closest anchor element in the DOM tree.
     */
    function findClosestAnchor(element: HTMLElement | null): HTMLAnchorElement | null {
      while (element && element.tagName.toLowerCase() !== 'a') {
        element = element.parentElement
      }
      return element as HTMLAnchorElement
    }

    /**
     * Handle click events and start the loader when appropriate.
     */
    function handleClick(event: MouseEvent): void {
      try {
        const target = event.target as HTMLElement
        // Find the closest anchor to the click target
        const anchor = findClosestAnchor(target)
        const newUrl = anchor?.href
        if (newUrl) {
          const currentUrl = window.location.href
          // External link if a target is set
          const isExternalLink = ((anchor as HTMLAnchorElement).target as React.HTMLAttributeAnchorTarget) !== ''

          // Special protocol links
          const isSpecialScheme = ['tel:', 'mailto:', 'sms:', 'blob:', 'download:'].some((scheme) =>
            newUrl.startsWith(scheme)
          )

          // Different hostname
          const notSameHost = !isSameHostName(window.location.href, anchor.href)
          if (notSameHost) {
            return
          }

          // Is the navigation just an anchor/hash change
          const isAnchorOrHashAnchor =
            isAnchorOfCurrentUrl(currentUrl, newUrl) || isHashAnchor(window.location.href, anchor.href)
          if (!showForHashAnchor && isAnchorOrHashAnchor) {
            return
          }

          // Decide whether the loader should run
          if (
            newUrl === currentUrl || // Same URL
            isExternalLink || // External link
            isSpecialScheme || // Special protocol
            isAnchorOrHashAnchor || // Anchor-only navigation
            event.ctrlKey || // Ctrl click
            event.metaKey || // Cmd/Meta click
            event.shiftKey || // Shift click
            event.altKey || // Alt click
            !toAbsoluteURL(anchor.href).startsWith('http') // Non-HTTP link
          ) {
            // For these cases, flash the loader instantly
            NProgress.start()
            NProgress.done()
            removeNProgressClass()
          } else {
            // For normal navigation, start the loader
            NProgress.start()
          }
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('NextTopLoader error:', error)
        }
        NProgress.start()
        NProgress.done()
      }
    }

    /**
     * Finish the loader when pushState adds a new history entry.
     */
    ;((history: History): void => {
      const pushState = history.pushState
      history.pushState = (...args) => {
        NProgress.done()
        removeNProgressClass()
        return pushState.apply(history, args)
      }
    })((window as Window).history)

    /**
     * Finish the loader when replaceState updates the current entry.
     */
    ;((history: History): void => {
      const replaceState = history.replaceState
      history.replaceState = (...args) => {
        NProgress.done()
        removeNProgressClass()
        return replaceState.apply(history, args)
      }
    })((window as Window).history)

    /**
     * Handle pagehide events.
     */
    function handlePageHide(): void {
      NProgress.done()
      removeNProgressClass()
    }

    /**
     * Handle browser back/forward navigation.
     */
    function handleBackAndForth(): void {
      NProgress.done()
    }

    // Add global listeners
    window.addEventListener('popstate', handleBackAndForth)
    document.addEventListener('click', handleClick)
    window.addEventListener('pagehide', handlePageHide)

    // Clean up listeners on unmount
    return (): void => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('popstate', handleBackAndForth)
    }
  }, [crawl, crawlSpeed, easing, initialPosition, showForHashAnchor, showSpinner, speed, template])

  // Return the style element
  return styles
}
export default NextTopLoader
