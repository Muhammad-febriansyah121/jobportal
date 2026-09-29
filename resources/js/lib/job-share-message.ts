type JobShareMessageOptions = {
    title: string;
    company?: string | null;
    url: string;
};

export function buildJobShareMessage({
    title,
    company,
    url,
}: JobShareMessageOptions): string {
    return [
        'Halo,',
        '',
        'Saya menemukan lowongan yang mungkin sesuai untuk Anda:',
        '',
        `Posisi: ${title}`,
        `Perusahaan: ${company ?? 'Karivia'}`,
        '',
        'Lihat detail lowongan:',
        url,
        '',
        'Semoga informasinya bermanfaat. Semoga sukses!',
    ].join('\n');
}
