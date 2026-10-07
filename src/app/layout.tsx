import './globals.css';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:'Heap insertion · DSA Atlas',
  description:'Follow a min-heap insertion through connected 3D tree and array views, with exact step inspection and rewind.',
};
export default function RootLayout({children}:{children:ReactNode}) {
  return <html lang="en"><body>{children}</body></html>;
}
