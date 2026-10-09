export const DEFAULT_FORMAL_TEMPLATE = `Kepada Yth.
{{sapaan}} {{nama}}

Dengan hormat,
Puji syukur kami panjatkan kepada Tuhan Yang Maha Esa atas segala rahmat-Nya.

Bersama pesan ini, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri Upacara & Resepsi Pernikahan kami:

💍 {{mempelai}}
🗓️ {{tanggal}}
📍 {{lokasi}}
⏰ Waktu Kehadiran: {{jam_hadir}}

Informasi lengkap mengenai jadwal prosesi, panduan lokasi, serta konfirmasi kehadiran (RSVP) dapat diakses melalui tautan undangan elektronik personal berikut:
👉 {{link}}

Merupakan suatu kehormatan dan kebahagiaan yang mendalam bagi kami apabila Bapak/Ibu berkenan hadir untuk memberikan doa restu.

Hormat kami,
{{mempelai}} & Keluarga Besar`;

export const DEFAULT_WARM_TEMPLATE = `Halo {{sapaan}} {{panggilan}},

Dengan penuh rasa syukur dan bahagia, kami mengundang Anda untuk hadir pada momen pernikahan kami:

💍 {{mempelai}}
🗓️ {{tanggal}}
📍 {{lokasi}}
⏰ Waktu Kehadiran: {{jam_hadir}}

Detail acara, denah lokasi, dan konfirmasi kehadiran (RSVP) dapat diakses melalui tautan personal Anda berikut:
👉 {{link}}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.

Salam hangat,
{{mempelai}}`;

export const DEFAULT_CASUAL_TEMPLATE = `Halo {{panggilan}}! 👋

Kabar bahagia nih! Akhirnya kami mau melangkah ke jenjang pernikahan:

💍 {{mempelai}}
🗓️ {{tanggal}}
📍 {{lokasi}}
⏰ Jam: {{jam_hadir}}

Yuk cek info lengkap lokasi, jadwal, dan konfirmasi kehadiran kamu lewat link undangan personal ini ya:
👉 {{link}}

Pastikan datang dan seru-seruan bareng kami ya. Kehadiranmu bikin momen ini makin berkesan! ✨

Cheers,
{{mempelai}}`;

export interface BlastTemplatesConfig {
  defaultTemplate: string;
  groupTemplates: Record<string, string>;
  groupTones: Record<string, 'formal' | 'warm' | 'casual'>;
  toneTemplates: {
    formal: string;
    warm: string;
    casual: string;
  };
}

export const DEFAULT_BLAST_CONFIG: BlastTemplatesConfig = {
  defaultTemplate: DEFAULT_WARM_TEMPLATE,
  groupTemplates: {},
  groupTones: {},
  toneTemplates: {
    formal: DEFAULT_FORMAL_TEMPLATE,
    warm: DEFAULT_WARM_TEMPLATE,
    casual: DEFAULT_CASUAL_TEMPLATE,
  },
};
