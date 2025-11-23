'use client'

import { create } from 'zustand'

type State = {
  loginOpen: boolean
  accountOpen: boolean
}

type Actions = {
  openLogin: () => void
  openAccount: () => void
  closeLogin: () => void
  closeAccount: () => void
}

export const useAuthDialogStore = create<State & Actions>((set) => ({
  loginOpen: false,
  accountOpen: false,
  openLogin: () => set({ loginOpen: true, accountOpen: false }),
  openAccount: () => set({ accountOpen: true, loginOpen: false }),
  closeLogin: () => set({ loginOpen: false }),
  closeAccount: () => set({ accountOpen: false })
}))
