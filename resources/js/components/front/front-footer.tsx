import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Instagram, Linkedin, Youtube } from 'lucide-react';
import { type FormEvent } from 'react';
import { home } from '@/routes';
import { index as companiesIndex } from '@/routes/companies';
import { index as jobsIndex } from '@/routes/jobs';

type Branding = {
    name?: string;
    logo_url?: string | null;
    social?: {
        instagram?: string | null;
        linkedin?: string | null;
        youtube?: string | null;
    };
};

const logoPath = '/images/karivia-assets/logo/karivia-logo-original.png';

export default function FrontFooter() {
    const { branding, name } = usePage<{ branding?: Branding; name: string }>()
        .props;
    const siteName = branding?.name ?? name ?? 'Karivia';

    const subscribe = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
    };

    return (
        <footer className="border-t border-border bg-white">
            <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.3fr_0.8fr_0.8fr_1.2fr] lg:px-10">
                <div>
                    <Link
                        href={home.url()}
                        className="inline-flex items-center"
                    >
                        <img
                            src={branding?.logo_url ?? logoPath}
                            alt={siteName}
                            width={160}
                            height={48}
                            className="h-11 w-[160px] object-cover object-center"
                        />
                    </Link>
                    <p className="mt-5 max-w-xs text-sm leading-6 text-muted-foreground">
                        Platform pencarian kerja terpercaya untuk menghubungkan
                        talenta terbaik dengan peluang karier yang lebih baik.
                    </p>
                    <div className="mt-5 flex items-center gap-2">
                        <SocialIcon
                            href={branding?.social?.linkedin ?? '/contact'}
                            label="LinkedIn"
                        >
                            <Linkedin className="size-4" />
                        </SocialIcon>
                        <SocialIcon
                            href={branding?.social?.instagram ?? '/contact'}
                            label="Instagram"
                        >
                            <Instagram className="size-4" />
                        </SocialIcon>
                        <SocialIcon
                            href={branding?.social?.youtube ?? '/contact'}
                            label="YouTube"
                        >
                            <Youtube className="size-4" />
                        </SocialIcon>
                    </div>
                </div>
                <FooterColumn
                    title="Untuk Pencari Kerja"
                    links={[
                        ['Cari Lowongan', jobsIndex.url()],
                        ['Perusahaan', companiesIndex.url()],
                        ['AI Interview', '/ai-interview-simulator'],
                        ['Info Gaji', '/salary'],
                        ['Sumber Karier', '/career-resources'],
                    ]}
                />
                <FooterColumn
                    title="Untuk Perusahaan"
                    links={[
                        ['Pasang Lowongan', '/employer/jobs/create'],
                        ['Cari Kandidat', '/employer/candidates'],
                        ['AI Candidate Matching', '/employer/candidates'],
                        ['Harga & Paket', '/pricing'],
                        ['Hubungi Kami', '/contact'],
                    ]}
                />
                <div>
                    <h3 className="text-sm font-extrabold text-heading">
                        Dapatkan update lowongan terbaru
                    </h3>
                    <form
                        onSubmit={subscribe}
                        className="mt-4 flex rounded-xl border border-border bg-white p-1.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/10"
                    >
                        <input
                            type="email"
                            required
                            placeholder="Masukkan email kamu"
                            aria-label="Alamat email"
                            className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-text outline-none focus:ring-0"
                        />
                        <button
                            type="submit"
                            aria-label="Berlangganan"
                            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary-700"
                        >
                            <ArrowRight className="size-4" />
                        </button>
                    </form>
                    <p className="mt-3 text-xs leading-5 text-muted-foreground">
                        Dapatkan tips karier, info lowongan, dan update produk
                        langsung ke emailmu.
                    </p>
                </div>
            </div>
            <div className="border-t border-border">
                <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
                    <span>
                        © {new Date().getFullYear()} {siteName}. All rights
                        reserved.
                    </span>
                    <span>Karier Tepat, Proses Terpercaya.</span>
                </div>
            </div>
        </footer>
    );
}

function FooterColumn({
    title,
    links,
}: {
    title: string;
    links: Array<[string, string]>;
}) {
    return (
        <div>
            <h3 className="text-sm font-extrabold text-heading">{title}</h3>
            <nav className="mt-4 flex flex-col items-start gap-3">
                {links.map(([label, href]) => (
                    <Link
                        key={label}
                        href={href}
                        className="text-sm text-muted-foreground transition hover:text-primary"
                    >
                        {label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

function SocialIcon({
    href,
    label,
    children,
}: {
    href: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <a
            href={href}
            aria-label={label}
            className="flex size-9 items-center justify-center rounded-lg bg-background-soft text-primary transition hover:bg-primary hover:text-white"
        >
            {children}
        </a>
    );
}
