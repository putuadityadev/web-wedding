export interface CoverContent {
  headline?: string;
  badge?: string;
  groomName: string;
  brideName: string;
  dateDisplay?: string;
  guestGreetingLabel: string;
  openButtonLabel: string;
  tapHintLabel?: string;
}

export type HeroBackgroundMode = 'image' | 'video' | 'slideshow';
export type HeroSlideshowSource = 'gallery' | 'custom';

export interface HeroContent {
  badge: string;
  groomName: string;
  brideName: string;
  subtitle?: string;
  dateShort: string;
  portraitSrc: string;
  portraitAlt: string;
  portraitLabel?: string;
  scrollHint?: string;
  bgMode?: HeroBackgroundMode;
  videoSrc?: string;
  slideshowSource?: HeroSlideshowSource;
  slideshowImages?: string[];
  slideshowDuration?: number;
}

export type QuoteBackgroundMode = 'solid' | 'image';

export interface QuoteContent {
  label: string;
  text: string;
  citation?: string;
  bgMode?: QuoteBackgroundMode;
  bgImage?: string;
}

export interface PrayerContent {
  sectionLabel: string;
  title: string;
  arabicOrSanskrit: string;
  translation: string;
  blessingText: string;
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
  fatherName?: string;
  motherName?: string;
  parentsTitle?: string;
  parentsAvatarSrc?: string;
}

export type CoupleBackgroundMode = 'solid' | 'image';

export interface CoupleContent {
  sectionLabel: string;
  sectionTitle: string;
  sectionDesc: string;
  bgMode?: CoupleBackgroundMode;
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
  type: 'portrait' | 'landscape' | 'square' | string;
  title: string;
  aspectRatio: string;
  src: string;
  mediaType?: 'photo' | 'video';
  videoSrc?: string;
  posterSrc?: string;
  isPrimary?: boolean;
  category?: string;
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
  enabled?: boolean;
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
  prayer: PrayerContent;
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
    headline: 'We invite you to celebrate our wedding',
    badge: 'We invite you to celebrate our wedding',
    groomName: 'Dharma',
    brideName: 'Lutfhy',
    dateDisplay: '12 · 12 · 2026',
    guestGreetingLabel: 'Kepada Yth. Bapak/Ibu Tamu Undangan',
    openButtonLabel: 'Buka Undangan',
    tapHintLabel: '',
  },
  hero: {
    badge: 'THE WEDDING OF',
    groomName: 'Dharma',
    brideName: 'Lutfhy',
    subtitle: 'DUA GARIS · SATU BENANG PERJALANAN',
    dateShort: 'SENIN, 12 OKTOBER 2026',
    portraitSrc: '/KLK07943.avif',
    portraitAlt: 'Potret I Wayan Dharma Wirahadi & Luthfi Quasimah Widoyo',
    portraitLabel: 'POTRET MEMPELAI',
    scrollHint: 'GULIR PERLAHAN',
    bgMode: 'image',
    slideshowSource: 'gallery',
    slideshowImages: [],
    slideshowDuration: 5,
  },
  quote: {
    label: 'OM SWASTYASTU',
    text: 'Atas Asung Kertha Wara Nugraha Ida Sang Hyang Widhi Wasa / Tuhan Yang Maha Esa, kami bermaksud mengundang Bapak / Ibu / Saudara / i pada Upacara Manusa Yadnya Pawiwahan putra dan putri kami.',
    citation: '',
    bgMode: 'solid',
    bgImage: '',
  },
  prayer: {
    sectionLabel: 'DOA & RESTU WIWAHA',
    title: 'Asung Kertha Wara Nugraha',
    arabicOrSanskrit: 'Om Ihaiva stam ma vi yaustam, visvam ayur vyasnutam, kridantau putrair naptrbhih modamanau sve grhe.',
    translation: 'Wahai pasangan pengantin, semoga engkau senantiasa tetap bersatu, tidak pernah terpisahkan, mencapai usia hidup yang panjang dan bahagia, dikaruniai keturunan yang utama, serta senantiasa damai dan tenteram di dalam rumah tanggamu.',
    blessingText: 'Om Swastyastu. Atas asung kertha wara nugraha Ida Sang Hyang Widhi Wasa, kami memohon doa restu agar perjalanan mahligai rumah tangga kami senantiasa dilimpahi kerahayuan, ketulusan, kedamaian lahir dan batin. Om Shanti, Shanti, Shanti, Om.',
    citation: 'Rg Veda X.85.42',
  },
  couple: {
    sectionLabel: 'TENTANG MEMPELAI',
    sectionTitle: 'Dua Jiwa, Satu Cerita',
    sectionDesc: 'Dengan penuh rasa syukur dan hormat, kami memohon doa restu keluarga dan sahabat.',
    bgMode: 'image',
    groom: {
      name: 'I Wayan Dharma Wirahadi',
      childOf: 'Putra pertama dari Bapak I Wayan Suweta & Ibu Ni Wayan Murni',
      bio: 'Praktisi tata suara dan profesional penyiaran di TVRI Stasiun Bali. Menemukan keindahan dalam harmoni nada, deburan ombak Bali, dan perjalanan yang penuh makna.',
      photoSrc: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=80',
      photoAlt: 'I Wayan Dharma Wirahadi',
      photoLabel: 'POTRET DHARMA',
      instagram: 'dharmawirahadi',
      fatherName: 'I Wayan Suweta',
      motherName: 'Ni Wayan Murni',
      parentsTitle: 'Putra Pertama Dari Pasangan:',
      parentsAvatarSrc: '',
    },
    bride: {
      name: 'Luthfi Quasimah Widoyo',
      childOf: 'Putri tercinta dari Bapak Widoyo & Ibu Sri Mulyani',
      bio: 'Produser program televisi di TVRI Bali (Eksplorasi Nusantara). Merajut visual, narasi keindahan budaya nusantara, dan kehangatan cerita dalam setiap bingkai karya.',
      photoSrc: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
      photoAlt: 'Luthfi Quasimah Widoyo',
      photoLabel: 'POTRET LUTFHY',
      instagram: 'lutfhyquasimah',
      fatherName: 'Widoyo',
      motherName: 'Sri Mulyani',
      parentsTitle: 'Putri Tercinta Dari Pasangan:',
      parentsAvatarSrc: '',
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
    dayFormatted: 'SENIN',
    dateNumeral: '12',
    monthYearFormatted: 'OKTOBER 2026',
    dateFormatted: 'Senin, 12 Oktober 2026',
    timeFormatted: '11.00 – 14.00 WITA',
    startsAt: '2026-10-12T11:00:00+08:00',
    endsAt: '2026-10-12T14:00:00+08:00',
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
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 2,
        label: '02 / 08',
        type: 'landscape',
        title: 'Langkah Sepadan',
        aspectRatio: '16/10',
        src: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1400&q=80',
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 3,
        label: '03 / 08',
        type: 'portrait',
        title: 'Genggaman Tenang',
        aspectRatio: '4/5',
        src: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 4,
        label: '04 / 08',
        type: 'landscape',
        title: 'Di Balik Jendela Kaca',
        aspectRatio: '3/2',
        src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=80',
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 5,
        label: '05 / 08',
        type: 'portrait',
        title: 'Detik Sebelum Hari-H',
        aspectRatio: '3/4',
        src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 6,
        label: '06 / 08',
        type: 'portrait',
        title: 'Tawa yang Utuh',
        aspectRatio: '4/5',
        src: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 7,
        label: '07 / 08',
        type: 'landscape',
        title: 'Dua Cangkir Kopi',
        aspectRatio: '16/10',
        src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=80',
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 8,
        label: '08 / 08',
        type: 'portrait',
        title: 'Tatapan Penuh Syukur',
        aspectRatio: '4/5',
        src: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'photo',
        isPrimary: true,
      },
      {
        id: 9,
        label: 'VIDEO · 01',
        type: 'landscape',
        title: 'Teaser Sinematik Janji Suci',
        aspectRatio: '16/9',
        src: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
        mediaType: 'video',
        videoSrc: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        posterSrc: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=80',
        isPrimary: false,
        category: 'Video Momen',
      },
      {
        id: 10,
        label: 'MOMEN · 10',
        type: 'portrait',
        title: 'Tawa Bersama Keluarga',
        aspectRatio: '4/5',
        src: 'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1200&q=80',
        mediaType: 'photo',
        isPrimary: false,
        category: 'Kenangan',
      },
    ],
  },
  gift: {
    enabled: true,
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
