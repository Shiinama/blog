import * as React from 'react'

const emptySubscribe = () => () => {}

export function useMounted() {
  return React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  )
}
