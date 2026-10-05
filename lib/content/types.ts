export interface CoverContent {
  badge: string;
  groomName: string;
  brideName: string;
  dateDisplay: string;
  guestGreetingLabel: string;
  openButtonLabel: string;
  tapHintLabel: string;
}

export interface HeroContent {
  badge: string;
  groomName: string;
  brideName: string;
  dateShort: string;
  portraitSrc: string;
  portraitAlt: string;
  portraitLabel: string;
  scrollHint: string;
}

export interface QuoteContent {
  label: string;
  text: string;
  citation: string;
}

export interface PersonProfile {
  name: string;
  childOf: string;
  bio: string;
  photoSrc: string;
  photoAlt: string;
  photoLabel: string;
  instagram: string;
}

export interface CoupleContent {
  sectionLabel: string;
  sectionTitle: string;
  sectionDesc: string;
  groom: PersonProfile;
  bride: PersonProfile;
}

export interface StoryMoment {
  numeral: string;
  title: string;
  date: string;
  desc: string;
  photoSrc: string;
  photoAlt: string;
  label: string;
}

export interface StoryContent {
  sectionLabel: string;
  sectionTitle: string;
  moments: StoryMoment[];
}

export interface EventContent {
  sectionLabel: string;
  sectionTitle: string;
  dayFormatted: string;
  dateNumeral: string;
  monthYearFormatted: string;
  dateFormatted: string;
  timeFormatted: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  mapsUrl: string;
  lat: number;
  lng: number;
  countdownLabel: string;
}

export interface GalleryItem {
  id: number | string;
  label: string;
  type: 'portrait' | 'landscape';
  title: string;
  aspectRatio: string;
  src: string;
}

export interface GalleryContent {
  sectionLabel: string;
  sectionTitle: string;
  sectionDesc: string;
  items: GalleryItem[];
}

export interface BankAccountItem {
  bank: string;
  accountName: string;
  accountNumber: string;
  qrisUrl?: string;
}

export interface GiftContent {
  sectionLabel: string;
  sectionTitle: string;
  sectionDesc: string;
  accounts: BankAccountItem[];
}

export interface FooterContent {
  closingLine: string;
  groomName: string;
  brideName: string;
  copyright: string;
}

export interface AudioContent {
  musicUrl: string;
  title: string;
}

export interface SiteContent {
  cover: CoverContent;
  hero: HeroContent;
  quote: QuoteContent;
  couple: CoupleContent;
  story: StoryContent;
  event: EventContent;
  gallery: GalleryContent;
  gift: GiftContent;
  footer: FooterContent;
  audio: AudioContent;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  cover: {
    badge: 'THE WEDDING CELEBRATION OF',
    groomName: 'Dharma',
    brideName: 'Lutfhy',
    dateDisplay: 'Sabtu, 12 Desember 2026',
    guestGreetingLabel: 'KEPADA YTH. BAPAK/IBU/SAUDARA/I:',
    openButtonLabel: 'BUKA UNDANGAN',
    tapHintLabel: 'Ketuk layar untuk membuka',
  },
  hero: {
    badge: 'THE WEDDING OF',
    groomName: 'Dharma',
    brideName: 'Lutfhy',
    dateShort: '12 · 12 · 2026',
    portraitSrc: '/KLK07943.avif',
    portraitAlt: 'Potret I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo',
    portraitLabel: 'POTRET MEMPELAI',
    scrollHint: 'GULIR PERLAHAN',
  },
  quote: {
    label: 'KUTIPAN SUCI',
    text: 'Pertemuan dua jiwa bukanlah suatu kebetulan, melainkan perjalanan panjang yang telah digariskan semesta untuk saling melengkapi dan bertumbuh bersama.',
    citation: 'Harmoni Dua Hati',
  },
  couple: {
    sectionLabel: 'TENTANG MEMPELAI',
    sectionTitle: 'Dua Jiwa, Satu Cerita',
    sectionDesc: 'Dengan penuh rasa syukur dan hormat, kami memohon doa restu keluarga dan sahabat.',
    groom: {
      name: 'I Wayan Dharma Wirahadi',
      childOf: 'Putra pertama dari Bapak I Wayan Suweta & Ibu Ni Wayan Murni',
      bio: 'Praktisi tata suara dan profesional penyiaran di TVRI Stasiun Bali. Menemukan keindahan dalam harmoni nada, deburan ombak Bali, dan perjalanan yang penuh makna.',
      photoSrc: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
      photoAlt: 'I Wayan Dharma Wirahadi',
      photoLabel: 'POTRET DHARMA',
      instagram: 'dharmawirahadi',
    },
    bride: {
      name: 'Luthfi Quasimah Widoyo',
      childOf: 'Putri tercinta dari Bapak Widoyo & Ibu Sri Mulyani',
      bio: 'Produser program televisi di TVRI Bali (Eksplorasi Nusantara). Merajut visual, narasi keindahan budaya nusantara, dan kehangatan cerita dalam setiap bingkai karya.',
      photoSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      photoAlt: 'Luthfi Quasimah Widoyo',
      photoLabel: 'POTRET LUTFHY',
      instagram: 'lutfhyquasimah',
    },
  },
  story: {
    sectionLabel: 'PERJALANAN KAMI',
    sectionTitle: 'Kisah yang Kami Rajut',
    moments: [
      {
        numeral: '01',
        title: 'Awal Pertemuan',
        date: 'Oktober 2021',
        desc: 'Di antara dinamika studio produksi visual dan penyiaran TVRI Bali, dua langkah dipertemukan oleh kecintaan yang sama pada cerita, nada, dan dedikasi karya.',
        photoSrc: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
        photoAlt: 'Pertemuan Pertama',
        label: 'MOMEN 01 · 2021',
      },
      {
        numeral: '02',
        title: 'Dua Garis Menemukan Irama',
        date: 'Mei 2023',
        desc: 'Merajut program eksplorasi nusantara bersama, belajar bahwa harmoni bukan sekadar keselarasan frekuensi di balik layar, melainkan kesediaan hati untuk saling mendengar dan berjalan beriringan.',
        photoSrc: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1200&q=80',
        photoAlt: 'Perjalanan Bersama',
        label: 'MOMEN 02 · 2023',
      },
      {
        numeral: '03',
        title: 'Menuju Hari Ini',
        date: 'Juli 2026',
        desc: 'Di bawah bentangan langit Bali dan deburan ombak yang tenang, terucap janji suci untuk menyatukan dua benang kehidupan menjadi ikatan yang abadi.',
        photoSrc: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
        photoAlt: 'Janji Suci',
        label: 'MOMEN 03 · 2026',
      },
    ],
  },
  event: {
    sectionLabel: 'WAKTU & LOKASI',
    sectionTitle: 'Resepsi Pernikahan',
    dayFormatted: 'SABTU',
    dateNumeral: '12',
    monthYearFormatted: 'DESEMBER 2026',
    dateFormatted: 'Sabtu, 12 Desember 2026',
    timeFormatted: '11.00 – 14.00 WITA',
    startsAt: '2026-12-12T11:00:00+08:00',
    endsAt: '2026-12-12T14:00:00+08:00',
    venueName: 'Kediaman Mempelai Pria (Kayubihi, Bangli)',
    venueAddress: 'Banjar Kawan, Desa Kayubihi, Kec. Bangli, Kabupaten Bangli, Bali 80614',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=-8.3981403,115.3643337',
    lat: -8.3981403,
    lng: 115.3643337,
    countdownLabel: 'MENGHITUNG HARI',
  },
  gallery: {
    sectionLabel: 'GALERI KENANGAN',
    sectionTitle: 'Momen Terindah',
    sectionDesc: 'Kumpulan potret kasih dan tawa di setiap langkah.',
    items: [
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
  },
  gift: {
    sectionLabel: 'TANDA KASIH',
    sectionTitle: 'Doa Restu & Amplop Digital',
    sectionDesc: 'Doa restu Anda merupakan karunia terindah bagi kami. Bagi keluarga dan sahabat yang ingin memberikan tanda kasih secara digital, dapat melalui rekening berikut:',
    accounts: [
      {
        bank: 'BCA',
        accountName: 'I Wayan Dharma Wirahadi',
        accountNumber: '7820192831',
      },
      {
        bank: 'Bank Mandiri',
        accountName: 'Luthfi Quasimah Widoyo',
        accountNumber: '1420019283741',
      },
    ],
  },
  footer: {
    closingLine: 'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
    groomName: 'Dharma',
    brideName: 'Lutfhy',
    copyright: '© 2026 Dharma & Lutfhy. All Rights Reserved.',
  },
  audio: {
    musicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=piano-moment-9835.mp3',
    title: 'Adagio in Blue — Instrumental',
  },
};
