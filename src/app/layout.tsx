import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:'Min heap · DSA Atlas',
  description:'Insert and extract the minimum through connected 3D heap views, with exact inspection, rewind, and controlled playback.',
};
export default function RootLayout({children}:{children:ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
