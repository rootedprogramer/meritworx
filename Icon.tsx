const paths: Record<string, string> = {
  browse: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm9 16-4-4',
  specials: 'M3 12V4h8l9 9-8 8-9-9Zm5-4.5a1 1 0 1 0 0 .01',
  requests: 'M4 5h16v11H8l-4 4V5Z',
  payments: 'M3 6h18v12H3V6Zm0 4h18M7 15h4',
  home: 'M4 11 12 4l8 7v9h-5v-6H9v6H4v-9Z',
  getpaid: 'M12 3v18M16.5 7.5C16 6 14.4 5 12 5s-4.5 1.2-4.5 3.2c0 4.6 9 2.4 9 7 0 2-2 3.3-4.5 3.3s-4.3-1.1-4.8-2.8',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9c.8-4 4-6 8-6s7.2 2 8 6',
  approvals: 'M5 12.5 10 17l9-10',
  companies: 'M4 20V8l8-4 8 4v12M9 20v-6h6v6',
  waitlist: 'M5 6h14M5 12h14M5 18h9',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-2.2-1.3L14.4 3h-4l-.4 2.4a7.6 7.6 0 0 0-2.2 1.3l-2.4-1-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.6l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 2.2 1.3l.4 2.4h4l.4-2.4a7.6 7.6 0 0 0 2.2-1.3l2.4 1 2-3.4-2-1.6c.1-.4.1-.9.1-1.3Z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z',
  close: 'M6 6l12 12M18 6 6 18',
  star: 'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z',
  check: 'M5 12.5 10 17l9-10',
  copy: 'M9 9h11v11H9V9ZM5 15H4V4h11v1',
};

export function Icon({ name, size = 24, fill = false }: { name: string; size?: number; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"
      fill={fill ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8}
      strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name] ?? ''} />
    </svg>
  );
}
