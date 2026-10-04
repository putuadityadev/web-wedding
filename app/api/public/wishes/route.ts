import { NextResponse } from 'next/server';

export async function GET() {
  // Phase 1 mock wishes
  return NextResponse.json({
    ok: true,
    data: [
      {
        id: '1',
        name: 'Bapak H. Sukardi & Keluarga',
        wish: 'Selamat menempuh hidup baru untuk Aditya dan Clarissa. Semoga senantiasa diberkahi sakinah, mawaddah, dan rahmah sepanjang hayat.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      },
      {
        id: '2',
        name: 'Dimas Wicaksono',
        wish: 'Akhirnya hari yang ditunggu tiba! Selamat menempuh perjalanan baru, Dit & Clarissa.',
        createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      },
    ],
  });
}
