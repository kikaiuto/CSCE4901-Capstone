import { forecastContribution } from '@/addons/forecasting/components/forecastOverlay'

export interface OverlaySpec {
  valueKey: string
  bandKey: string
  color: string
  bandColor: string
}

export interface OverlayRow {
  label: string
  [series: string]: string | number | [number, number]
}

export interface ScreenOverlay {
  screen: string
  owner: string
  spec: OverlaySpec
  rows: (range: string) => OverlayRow[]
  risk?: { from: string; to: string }
}

const contributions: ScreenOverlay[] = [forecastContribution]

export function overlayFor(screen: string): ScreenOverlay | undefined {
  return contributions.find((contribution) => contribution.screen === screen)
}
