import { cn, getInitials } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  name: string
  imageUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizeMap = {
  sm: { container: 'w-8 h-8 text-xs', img: 32 },
  md: { container: 'w-10 h-10 text-sm', img: 40 },
  lg: { container: 'w-16 h-16 text-lg', img: 64 },
  xl: { container: 'w-24 h-24 text-2xl', img: 96 },
}

export function Avatar({ name, imageUrl, size = 'md', className }: AvatarProps) {
  const { container, img } = sizeMap[size]
  const initials = getInitials(name || '?')

  if (imageUrl) {
    return (
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
    )
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full shrink-0 font-semibold select-none',
        'bg-gradient-to-br from-primary/80 to-primary text-primary-foreground',
        container,
        className
      )}
    >
      {initials}
    </div>
  )
}
