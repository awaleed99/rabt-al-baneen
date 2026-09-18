import { redirect } from 'next/navigation'

// The root / is handled by (dashboard)/page.tsx — this file handles any unexpected access
export default function RootPage() {
  redirect('/')
}
