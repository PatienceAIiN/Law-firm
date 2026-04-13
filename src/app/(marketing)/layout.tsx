import { getMarketingShellData } from '@/lib/site-shell'
import { MarketingShell } from '@/components/layout/marketing-shell'

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { brand, navigation, footerConfig, officeDetails, practiceAreas } = await getMarketingShellData()

  return (
    <MarketingShell
      brand={brand}
      navigation={navigation}
      footerConfig={footerConfig}
      officeDetails={officeDetails}
      practiceAreas={practiceAreas}
    >
      {children}
    </MarketingShell>
  )
}
