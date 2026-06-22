import Link from 'next/link'

type Brand = {
  logo_text?: string
  firm_name?: string
  firm_full_name?: string
  logo_image_url?: string
  use_image_logo?: boolean
  logo_style?: {
    fontFamily?: string
    fontWeight?: string
    fontStyle?: string
    color?: string
    letterSpacing?: string
  }
}

export function BrandMark({
  brand,
  href = '/',
  className = '',
  imageHeight = 40,
}: {
  brand?: Brand | null
  href?: string
  className?: string
  imageHeight?: number
}) {
  const useImage = brand?.use_image_logo && brand?.logo_image_url
  const text = brand?.logo_text || brand?.firm_name || 'Logo'
  const style = brand?.logo_style || {}
  const inlineStyle: React.CSSProperties = {
    fontFamily: style.fontFamily && style.fontFamily !== 'inherit' ? style.fontFamily : undefined,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color,
    letterSpacing: style.letterSpacing,
  }

  return (
    <Link href={href} className={`inline-flex items-center ${className}`}>
      {useImage ? (
        <img
          src={brand!.logo_image_url}
          alt={brand?.firm_full_name || brand?.firm_name || 'Logo'}
          style={{ height: imageHeight, width: 'auto' }}
          className="max-h-full w-auto object-contain"
        />
      ) : (
        <span style={inlineStyle} className="text-[22px] font-bold tracking-tight text-[#14203E] dark:text-white">
          {text}
        </span>
      )}
    </Link>
  )
}
