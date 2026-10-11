type IconName = 'audio' | 'mic' | 'check' | 'close' | 'clock' | 'chart' | 'cards' | 'book' | 'grid' | 'arrow' | 'bulb' | 'lock';
const paths: Record<IconName, string> = {
  audio: 'M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
  mic: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Zm-6 9a6 6 0 0 0 12 0m-6 6v3m-3 0h6',
  check: 'm5 12 4 4L19 6', close: 'm6 6 12 12M6 18 18 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
  chart: 'M4 20V10m5 10V6m5 14v-8m5 8V3',
  cards: 'M8 3h12v15H8V3ZM4 7v14h12M11 7h6m-6 4h6',
  book: 'M12 5C9 3 5 3 2 4v15c3-1 7-1 10 1m0-15c3-2 7-2 10-1v15c-3-1-7-1-10 1V5Z',
  grid: 'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  bulb: 'M8 16a7 7 0 1 1 8 0v2H8v-2Zm1 5h6M12 3V1',
  lock: 'M5 10h14v11H5V10Zm3 0V6a4 4 0 0 1 8 0v4m-4 4v3',
};
export function UiIcon({ name, className = '' }: { name: IconName; className?: string }) {
  return <svg className={`ui-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}
