import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  hasBirthdayHat?: boolean
}

const sizeMap = {
  sm: { container: 'w-8 h-8 text-xs', img: 32, hat: 'w-5 h-5 -top-2.5 -right-1.5' },
  md: { container: 'w-10 h-10 text-sm', img: 40, hat: 'w-6 h-6 -top-3 -right-2' },
  lg: { container: 'w-16 h-16 text-lg', img: 64, hat: 'w-9 h-9 -top-4.5 -right-2.5' },
  xl: { container: 'w-24 h-24 text-2xl', img: 96, hat: 'w-12 h-12 -top-6 -right-3.5' },
}

export function BirthdayPartyHat({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 44"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('pointer-events-none select-none drop-shadow-md animate-bounce', className)}
      style={{ animationDuration: '2s' }}
    >
      {/* Fluffy Pom-pom */}
      <circle cx="20" cy="5" r="4.5" fill="#FBBF24" />
      <circle cx="18.5" cy="3.5" r="2" fill="#FEF08A" />
      {/* Hat Cone */}
      <path
        d="M20 7L4 38C4 38 12 41 20 41C28 41 36 38 36 38L20 7Z"
        fill="url(#hat_grad)"
      />
      {/* Festive Diagonal Stripes */}
      <path
        d="M13 18L6.5 31C10.5 32.5 15 33 19 33L16 18H13Z"
        fill="#EC4899"
        opacity="0.9"
      />
      <path
        d="M24 18L21 33C25 33 29.5 32.5 33.5 31L27 18H24Z"
        fill="#38BDF8"
        opacity="0.9"
      />
      {/* Base trim with yellow frills */}
      <path
        d="M3 37C3 37 11 41 20 41C29 41 37 37 37 37C37 38.5 29 42.5 20 42.5C11 42.5 3 38.5 3 37Z"
        fill="#F59E0B"
      />
      {/* Little sparkle dot */}
      <circle cx="20" cy="25" r="2.2" fill="#FEF08A" />
      <defs>
        <linearGradient id="hat_grad" x1="20" y1="7" x2="20" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
    </svg>
  )
}

export function Avatar({ name, imageUrl, size = 'md', className, hasBirthdayHat = false }: AvatarProps) {
  const { container, img, hat } = sizeMap[size]
  const initials = getInitials(name || '?')

  const avatarElement = imageUrl ? (
    <div className={cn('relative rounded-full overflow-hidden shrink-0 ring-2 ring-white/20', container, className)}>
      <Image
        src={imageUrl}
        alt={name}
        width={img}
        height={img}
        className="object-cover w-full h-full"
        unoptimized
      />
    </div>
  ) : (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0 font-semibold select-none',
        'bg-gradient-to-br from-primary/80 to-primary text-primary-foreground ring-2 ring-white/20',
        container,
        className
      )}
    >
      {initials}
    </div>
  )

  if (!hasBirthdayHat) {
    return avatarElement
  }

  return (
    <div className="relative inline-flex shrink-0">
      {avatarElement}
      <div
        className={cn('absolute z-20 pointer-events-none transform -rotate-12', hat)}
        title="اليوم عيد ميلاده! 🎂"
      >
        <BirthdayPartyHat className="w-full h-full" />
      </div>
    </div>
  )
}
