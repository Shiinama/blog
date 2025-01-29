import { AuthButton } from './auth-button'
import { NamedLogoWithLink } from './logo'
import ToggleTheme from './toggle'

export default function Navbar({ children }: { children?: React.ReactNode }) {
  return (
    <nav className="sticky top-0 z-50 flex h-16 w-full flex-row items-center justify-between bg-background sm:mb-7 md:h-20">
      <div className="flex w-full flex-row items-center justify-between">
        {children ? children : <NamedLogoWithLink />}
      </div>
      <ToggleTheme />
      <AuthButton />
    </nav>
  )
}
