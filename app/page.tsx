'use client';

import dynamic from 'next/dynamic';

const SpotMap = dynamic(() => import('@/components/SpotMap'), { ssr: false });

export default function Home() {
  return <SpotMap />;
}
