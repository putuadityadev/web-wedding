export interface MediaAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  aspectRatio: string;
  caption?: string;
  type?: 'portrait' | 'landscape';
}

export const ASSETS = {
  // Hero Section: Cinematic Video Background & Poster
  hero: {
    videoSrc: 'https://assets.mixkit.co/videos/preview/mixkit-young-couple-walking-in-a-field-at-sunset-41485-large.mp4',
    posterSrc: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85',
    portrait: {
      src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
      alt: 'Potret Aditya & Clarissa',
      aspectRatio: '4/5',
      label: 'POTRET MEMPELAI',
    },
  },

  // Couple Section (Editorial Portraits)
  couple: {
    groom: {
      name: 'Aditya Pratama, S.T.',
      childOf: 'Putra pertama dari Bapak Bambang H. & Ibu Sri Rahayu',
      bio: 'Seorang arsitek teknologi yang mencintai kopi hangat, fotografi lanskap, dan percakapan sunyi di sore hari.',
      photo: {
        src: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
        alt: 'Aditya Pratama',
        aspectRatio: '4/5',
        label: 'POTRET ADITYA',
      },
      instagram: 'adityapratama',
    },
    bride: {
      name: 'Clarissa Maharani, B.A.',
      childOf: 'Putri kedua dari Bapak Dr. Hendra K. & Ibu Ratna Dewi',
      bio: 'Desainer interior dan kurator seni yang menemukan ketenangan di antara halaman buku lama dan aroma laut.',
      photo: {
        src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
        alt: 'Clarissa Maharani',
        aspectRatio: '4/5',
        label: 'POTRET CLARISSA',
      },
      instagram: 'clarissamaharani',
    },
  },

  // Story Moments (3 Intimate Chapters)
  story: [
    {
      numeral: '01',
      title: 'Awal Pertemuan',
      date: 'Oktober 2021',
      desc: 'Sebuah perpustakaan kecil di sudut kota mempertemukan dua pandang yang tak sengaja mencari buku yang sama.',
      photo: {
        src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
        alt: 'Pertemuan Pertama',
        aspectRatio: '4/5',
        label: 'MOMEN 01 · 2021',
      },
    },
    {
      numeral: '02',
      title: 'Dua Garis Menemukan Irama',
      date: 'Mei 2023',
      desc: 'Berbagi ratusan cangkir teh, menempuh ribuan kilometer perjalanan, belajar bahwa cinta adalah kesabaran yang disengaja.',
      photo: {
        src: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        alt: 'Perjalanan Bersama',
        aspectRatio: '4/5',
        label: 'MOMEN 02 · 2023',
      },
    },
    {
      numeral: '03',
      title: 'Menuju Hari Ini',
      date: 'Juli 2026',
      desc: 'Di bawah langit senja Selat Makassar, sebuah janji terucap untuk mengikat dua benang kehidupan menjadi satu simpul abadi.',
      photo: {
        src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
        alt: 'Janji Suci',
        aspectRatio: '4/5',
        label: 'MOMEN 03 · 2026',
      },
    },
  ],

  // Gallery (8 Frames: editorial mixture of portrait & landscape)
  gallery: [
    {
      id: 1,
      label: '01 / 08',
      type: 'portrait',
      title: 'Senja di Pesisir',
      aspectRatio: '3/4',
      src: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 2,
      label: '02 / 08',
      type: 'landscape',
      title: 'Langkah Sepadan',
      aspectRatio: '16/10',
      src: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: 3,
      label: '03 / 08',
      type: 'portrait',
      title: 'Genggaman Tenang',
      aspectRatio: '4/5',
      src: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 4,
      label: '04 / 08',
      type: 'landscape',
      title: 'Di Balik Jendela Kaca',
      aspectRatio: '3/2',
      src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: 5,
      label: '05 / 08',
      type: 'portrait',
      title: 'Detik Sebelum Hari-H',
      aspectRatio: '3/4',
      src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 6,
      label: '06 / 08',
      type: 'portrait',
      title: 'Tawa yang Utuh',
      aspectRatio: '4/5',
      src: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
    },
    {
      id: 7,
      label: '07 / 08',
      type: 'landscape',
      title: 'Dua Cangkir Kopi',
      aspectRatio: '16/10',
      src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80',
    },
    {
      id: 8,
      label: '08 / 08',
      type: 'portrait',
      title: 'Tatapan Penuh Syukur',
      aspectRatio: '4/5',
      src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
    },
  ],

  // Audio Background (Calm instrumental piano loop)
  audio: {
    src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3',
    title: 'Adagio in Blue — Instrumental',
  },
};
