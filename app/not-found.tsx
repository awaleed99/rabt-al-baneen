import Link from 'next/link'
import { Button } from '@/components/ui/button-custom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center animate-fade-in max-w-md">
        <h1 className="text-8xl font-black text-primary/25">404</h1>
        <h2 className="text-2xl font-bold text-foreground mt-4">الصفحة غير موجودة | Page Not Found</h2>
        <p className="text-muted-foreground mt-2 text-sm">عذراً، الصفحة التي تبحث عنها غير متوفرة أو تم نقلها.</p>
        <Link href="/">
          <Button className="mt-6">العودة إلى لوحة التحكم | Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}
