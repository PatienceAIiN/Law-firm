import { FindBarristerProviders } from './providers'

export default function FindBarristerLayout({ children }: { children: React.ReactNode }) {
  return <FindBarristerProviders>{children}</FindBarristerProviders>
}
