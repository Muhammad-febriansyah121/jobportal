import { Head, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    BookOpen,
    Bot,
    Building2,
    CreditCard,
    Eye,
    EyeOff,
    Globe,
    ImageIcon,
    KeyRound,
    Mail,
    MapPin,
    Share2,
    ShieldOff,
    Upload,
    X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { update as settingsUpdate } from '@/routes/admin/settings';

type Tab = { key: string; label: string; icon: React.ElementType };

function CustomTabs({
    tabs,
    active,
    onChange,
}: {
    tabs: Tab[];
    active: string;
    onChange: (key: string) => void;
}) {
    return (
        <div className="flex gap-1 overflow-x-auto border-b">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={`flex shrink-0 items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                        active === tab.key
                            ? 'border-[#ED6A2F] text-[#ED6A2F]'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <tab.icon className="size-4" />
                    {tab.label}
                </button>
            ))}
        </div>
    );
}

type SettingsProps = {
    settings: Record<string, string | null>;
};

function storageUrl(path: string | null | undefined): string | null {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    return `/storage/${path}`;
}

function Section({
    icon: Icon,
    title,
    children,
}: {
    icon: React.ElementType;
    title: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border bg-background shadow-sm">
            <div className="flex items-center gap-3 border-b px-6 py-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#ED6A2F]/10">
                    <Icon className="size-4 text-[#ED6A2F]" />
                </div>
                <h2 className="text-base font-semibold">{title}</h2>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">{children}</div>
        </div>
    );
}

function Field({
    label,
    children,
    full,
}: {
    label: string;
    children: React.ReactNode;
    full?: boolean;
}) {
    return (
        <div className={full ? 'sm:col-span-2' : ''}>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
                {label}
            </label>
            {children}
        </div>
    );
}

function Input({
    value,
    onChange,
    placeholder,
    type = 'text',
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background transition outline-none focus:border-[#ED6A2F] focus:ring-2 focus:ring-[#ED6A2F]/50"
        />
    );
}

function Textarea({
    value,
    onChange,
    placeholder,
    rows = 3,
}: {
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    rows?: number;
}) {
    return (
        <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            className="w-full resize-y rounded-lg border bg-background px-3 py-2 text-sm ring-offset-background transition outline-none focus:border-[#ED6A2F] focus:ring-2 focus:ring-[#ED6A2F]/50"
        />
    );
}

function AiApiKeyInput({
    value,
    onChange,
}: {
    value: string;
    onChange: (v: string) => void;
}) {
    const [show, setShow] = useState(false);

    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border bg-background px-3 py-2 pr-10 text-sm ring-offset-background transition outline-none focus:border-[#ED6A2F] focus:ring-2 focus:ring-[#ED6A2F]/50"
            />
            <button
                type="button"
                onClick={() => setShow((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={show ? 'Sembunyikan API key' : 'Tampilkan API key'}
            >
                {show ? (
                    <EyeOff className="size-4" />
                ) : (
                    <Eye className="size-4" />
                )}
            </button>
        </div>
    );
}

function ImageUpload({
    label,
    currentPath,
    onFileSelect,
    aspectHint,
}: {
    label: string;
    currentPath: string | null;
    onFileSelect: (file: File | null) => void;
    aspectHint?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [preview, setPreview] = useState<string | null>(
        storageUrl(currentPath),
    );
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = (file: File | null) => {
        onFileSelect(file);
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setPreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
    };

    const handleRemove = () => {
        setPreview(null);
        onFileSelect(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
                {label}
            </label>
            <div
                className={`relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
                    isDragging
                        ? 'border-[#ED6A2F] bg-[#ED6A2F]/5'
                        : 'border-border bg-muted/30 hover:border-[#ED6A2F]/50'
                }`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
            >
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt={label}
                            className="max-h-48 w-full object-contain p-2"
                        />
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow hover:opacity-90"
                        >
                            <X className="size-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                        <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                            <Upload className="size-5" />
                        </div>
                        <p className="text-sm font-medium">
                            Klik atau drag & drop gambar
                        </p>
                        {aspectHint && <p className="text-xs">{aspectHint}</p>}
                        <p className="text-xs">PNG, JPG, WEBP</p>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                />
            </div>
        </div>
    );
}

export default function AdminSettings({ settings }: SettingsProps) {
    const get = (key: string) => settings[key] ?? '';

    const { data, setData, post, processing } = useForm<
        Record<string, string | File | null | boolean>
    >({
        site_name: get('site_name'),
        site_tagline: get('site_tagline'),
        site_description: get('site_description'),
        site_meta_description: get('site_meta_description'),
        site_meta_keywords: get('site_meta_keywords'),
        site_logo_url: null,
        site_favicon_url: null,
        login_banner_url: null,
        facebook_url: get('facebook_url'),
        instagram_url: get('instagram_url'),
        linkedin_url: get('linkedin_url'),
        twitter_url: get('twitter_url'),
        youtube_url: get('youtube_url'),
        support_email: get('support_email'),
        support_phone: get('support_phone'),
        whatsapp_number: get('whatsapp_number'),
        about_title: get('about_title'),
        about_tagline: get('about_tagline'),
        about_description: get('about_description'),
        about_content: get('about_content'),
        about_employee_count: get('about_employee_count'),
        about_founded_year: get('about_founded_year'),
        about_headquarters: get('about_headquarters'),
        about_hero_image: null,
        about_office_image: null,
        maintenance_mode: get('maintenance_mode') === '1',
        maintenance_message: get('maintenance_message'),
        office_maps_embed_url: get('office_maps_embed_url'),
        recaptcha_site_key: get('recaptcha_site_key'),
        recaptcha_secret_key: get('recaptcha_secret_key'),
        privacy_title: get('privacy_title'),
        terms_title: get('terms_title'),
        ai_api_key: get('ai_api_key'),
        pakasir_project: get('pakasir_project'),
        pakasir_api_key: get('pakasir_api_key'),
    });

    const [activeTab, setActiveTab] = useState('umum');

    const tabs: Tab[] = [
        { key: 'umum', label: 'Umum', icon: Globe },
        { key: 'media', label: 'Media', icon: ImageIcon },
        { key: 'sosial', label: 'Sosial & Kontak', icon: Share2 },
        { key: 'tentang', label: 'Tentang Kami', icon: Building2 },
        { key: 'ai', label: 'AI', icon: Bot },
        { key: 'pembayaran', label: 'Pembayaran', icon: CreditCard },
        { key: 'sistem', label: 'Sistem', icon: ShieldOff },
    ];

    const str = (key: string) => (data[key] as string) ?? '';
    const set = (key: string) => (v: string) =>
        setData(key as never, v as never);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(settingsUpdate.url(), {
            forceFormData: true,
            onError: () => {
                toast.error('Periksa kembali pengaturan yang diisi.');
            },
        });
    };

    return (
        <>
            <Head title="Setting Web" />

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-5">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-normal">
                                Setting Web
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Kelola konfigurasi umum, tampilan, dan informasi
                                platform Karivia.
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-[#ED6A2F] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#d45a22] disabled:opacity-60"
                        >
                            {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>

                    {/* Tabs */}
                    <div>
                        <CustomTabs
                            tabs={tabs}
                            active={activeTab}
                            onChange={setActiveTab}
                        />

                        {/* Tab: Umum */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'umum' ? '' : 'hidden'}`}
                        >
                            <Section icon={Globe} title="Identitas Situs">
                                <Field label="Nama Situs">
                                    <Input
                                        value={str('site_name')}
                                        onChange={set('site_name')}
                                        placeholder="Karivia"
                                    />
                                </Field>
                                <Field label="Tagline">
                                    <Input
                                        value={str('site_tagline')}
                                        onChange={set('site_tagline')}
                                        placeholder="Job Portal Terpercaya"
                                    />
                                </Field>
                                <Field label="Deskripsi Singkat" full>
                                    <Textarea
                                        value={str('site_description')}
                                        onChange={set('site_description')}
                                        placeholder="Deskripsi situs..."
                                    />
                                </Field>
                                <Field label="Meta Description" full>
                                    <Textarea
                                        value={str('site_meta_description')}
                                        onChange={set('site_meta_description')}
                                        placeholder="Meta description untuk SEO..."
                                    />
                                </Field>
                                <Field label="Meta Keywords" full>
                                    <Input
                                        value={str('site_meta_keywords')}
                                        onChange={set('site_meta_keywords')}
                                        placeholder="lowongan kerja, job portal, ..."
                                    />
                                </Field>
                            </Section>
                        </div>

                        {/* Tab: Media */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'media' ? '' : 'hidden'}`}
                        >
                            <Section icon={ImageIcon} title="Media & Gambar">
                                <ImageUpload
                                    label="Logo Situs"
                                    currentPath={
                                        settings['site_logo_url'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'site_logo_url' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint="Disarankan: 200×60px"
                                />
                                <ImageUpload
                                    label="Favicon"
                                    currentPath={
                                        settings['site_favicon_url'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'site_favicon_url' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint="Disarankan: 32×32px atau 64×64px"
                                />
                                <div className="sm:col-span-2">
                                    <ImageUpload
                                        label="Banner Halaman Login"
                                        currentPath={
                                            settings['login_banner_url'] ?? null
                                        }
                                        onFileSelect={(file) =>
                                            setData(
                                                'login_banner_url' as never,
                                                file as never,
                                            )
                                        }
                                        aspectHint="Disarankan: 1200×800px"
                                    />
                                </div>
                            </Section>
                        </div>

                        {/* Tab: Sosial & Kontak */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'sosial' ? '' : 'hidden'}`}
                        >
                            <Section icon={Share2} title="Media Sosial">
                                <Field label="Facebook URL">
                                    <Input
                                        value={str('facebook_url')}
                                        onChange={set('facebook_url')}
                                        placeholder="https://facebook.com/..."
                                    />
                                </Field>
                                <Field label="Instagram URL">
                                    <Input
                                        value={str('instagram_url')}
                                        onChange={set('instagram_url')}
                                        placeholder="https://instagram.com/..."
                                    />
                                </Field>
                                <Field label="LinkedIn URL">
                                    <Input
                                        value={str('linkedin_url')}
                                        onChange={set('linkedin_url')}
                                        placeholder="https://linkedin.com/company/..."
                                    />
                                </Field>
                                <Field label="Twitter / X URL">
                                    <Input
                                        value={str('twitter_url')}
                                        onChange={set('twitter_url')}
                                        placeholder="https://x.com/..."
                                    />
                                </Field>
                                <Field label="YouTube URL">
                                    <Input
                                        value={str('youtube_url')}
                                        onChange={set('youtube_url')}
                                        placeholder="https://youtube.com/@..."
                                    />
                                </Field>
                            </Section>

                            <Section icon={Mail} title="Kontak">
                                <Field label="Email Support">
                                    <Input
                                        value={str('support_email')}
                                        onChange={set('support_email')}
                                        type="email"
                                        placeholder="support@karivia.id"
                                    />
                                </Field>
                                <Field label="Nomor Telepon">
                                    <Input
                                        value={str('support_phone')}
                                        onChange={set('support_phone')}
                                        placeholder="+62 21 1234 5678"
                                    />
                                </Field>
                                <Field label="Nomor WhatsApp">
                                    <Input
                                        value={str('whatsapp_number')}
                                        onChange={set('whatsapp_number')}
                                        placeholder="6281234567890"
                                    />
                                </Field>
                            </Section>
                        </div>

                        {/* Tab: Tentang Kami */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'tentang' ? '' : 'hidden'}`}
                        >
                            <Section
                                icon={Building2}
                                title="Halaman Tentang Kami"
                            >
                                <Field label="Judul">
                                    <Input
                                        value={str('about_title')}
                                        onChange={set('about_title')}
                                        placeholder="Tentang Karivia"
                                    />
                                </Field>
                                <Field label="Tagline">
                                    <Input
                                        value={str('about_tagline')}
                                        onChange={set('about_tagline')}
                                        placeholder="Tagline halaman about..."
                                    />
                                </Field>
                                <Field label="Jumlah Karyawan">
                                    <Input
                                        value={str('about_employee_count')}
                                        onChange={set('about_employee_count')}
                                        placeholder="50+ orang"
                                    />
                                </Field>
                                <Field label="Tahun Berdiri">
                                    <Input
                                        value={str('about_founded_year')}
                                        onChange={set('about_founded_year')}
                                        placeholder="2023"
                                    />
                                </Field>
                                <Field label="Kantor Pusat">
                                    <Input
                                        value={str('about_headquarters')}
                                        onChange={set('about_headquarters')}
                                        placeholder="Jakarta, Indonesia"
                                    />
                                </Field>
                                <Field label="Deskripsi" full>
                                    <Textarea
                                        value={str('about_description')}
                                        onChange={set('about_description')}
                                        rows={3}
                                        placeholder="Deskripsi singkat perusahaan..."
                                    />
                                </Field>
                                <Field label="Konten (HTML)" full>
                                    <Textarea
                                        value={str('about_content')}
                                        onChange={set('about_content')}
                                        rows={5}
                                        placeholder="<p>Konten HTML tentang perusahaan...</p>"
                                    />
                                </Field>
                                <ImageUpload
                                    label="Hero Image"
                                    currentPath={
                                        settings['about_hero_image'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'about_hero_image' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint="Disarankan: 1200×600px"
                                />
                                <ImageUpload
                                    label="Office Image"
                                    currentPath={
                                        settings['about_office_image'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'about_office_image' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint="Disarankan: 800×600px"
                                />
                            </Section>
                        </div>

                        {/* Tab: AI */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'ai' ? '' : 'hidden'}`}
                        >
                            <Section icon={Bot} title="AI API Key">
                                <Field label="API Key" full>
                                    <AiApiKeyInput
                                        value={str('ai_api_key')}
                                        onChange={set('ai_api_key')}
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        Disimpan terenkripsi. API key digunakan
                                        untuk fitur AI Summary, AI Insight, AI
                                        Interview, dan AI Matching. Jangan
                                        bagikan key ini kepada siapapun.
                                    </p>
                                </Field>
                            </Section>
                        </div>

                        {/* Tab: Pembayaran */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'pembayaran' ? '' : 'hidden'}`}
                        >
                            <Section icon={CreditCard} title="Pakasir">
                                <Field label="Project Slug" full>
                                    <Input
                                        value={str('pakasir_project')}
                                        onChange={set('pakasir_project')}
                                        placeholder="jobportal"
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        Slug proyek Pakasir kamu. Terlihat di
                                        dashboard app.pakasir.com.
                                    </p>
                                </Field>
                                <Field label="API Key" full>
                                    <AiApiKeyInput
                                        value={str('pakasir_api_key')}
                                        onChange={set('pakasir_api_key')}
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        API key dari dashboard Pakasir. Jangan
                                        bagikan key ini kepada siapapun.
                                    </p>
                                </Field>
                            </Section>
                        </div>

                        {/* Tab: Sistem */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'sistem' ? '' : 'hidden'}`}
                        >
                            <Section icon={ShieldOff} title="Mode Maintenance">
                                <Field label="Status Maintenance" full>
                                    <label className="flex cursor-pointer items-center gap-3">
                                        <div className="relative shrink-0">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={Boolean(
                                                    data['maintenance_mode'],
                                                )}
                                                onChange={(e) =>
                                                    setData(
                                                        'maintenance_mode' as never,
                                                        e.target
                                                            .checked as never,
                                                    )
                                                }
                                            />
                                            <div
                                                className={`h-6 w-11 rounded-full transition-colors ${Boolean(data['maintenance_mode']) ? 'bg-[#ED6A2F]' : 'bg-muted-foreground/30'}`}
                                            />
                                            <div
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${Boolean(data['maintenance_mode']) ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                                            />
                                        </div>
                                        <span className="text-sm">
                                            {Boolean(data['maintenance_mode'])
                                                ? 'Aktif — situs dalam mode maintenance'
                                                : 'Tidak aktif'}
                                        </span>
                                    </label>
                                </Field>
                                <Field label="Pesan Maintenance" full>
                                    <Textarea
                                        value={str('maintenance_message')}
                                        onChange={set('maintenance_message')}
                                        placeholder="Website sedang dalam pemeliharaan..."
                                    />
                                </Field>
                            </Section>

                            <Section icon={MapPin} title="Peta Kantor">
                                <Field label="Google Maps Embed URL" full>
                                    <Textarea
                                        value={str('office_maps_embed_url')}
                                        onChange={set('office_maps_embed_url')}
                                        rows={3}
                                        placeholder="https://www.google.com/maps/embed?..."
                                    />
                                </Field>
                                {str('office_maps_embed_url') && (
                                    <div className="sm:col-span-2">
                                        <p className="mb-2 text-xs text-muted-foreground">
                                            Preview:
                                        </p>
                                        <iframe
                                            src={str('office_maps_embed_url')}
                                            className="h-64 w-full rounded-lg border"
                                            loading="lazy"
                                            title="Office Map"
                                        />
                                    </div>
                                )}
                            </Section>

                            <Section icon={KeyRound} title="Google reCAPTCHA">
                                <Field label="Site Key">
                                    <Input
                                        value={str('recaptcha_site_key')}
                                        onChange={set('recaptcha_site_key')}
                                        placeholder="Site key reCAPTCHA..."
                                    />
                                </Field>
                                <Field label="Secret Key">
                                    <Input
                                        value={str('recaptcha_secret_key')}
                                        onChange={set('recaptcha_secret_key')}
                                        placeholder="Secret key reCAPTCHA..."
                                        type="password"
                                    />
                                </Field>
                            </Section>

                            <Section icon={BookOpen} title="Legal & Kebijakan">
                                <Field label="Judul Halaman Privasi">
                                    <Input
                                        value={str('privacy_title')}
                                        onChange={set('privacy_title')}
                                        placeholder="Kebijakan Privasi Karivia"
                                    />
                                </Field>
                                <Field label="Judul Halaman Syarat & Ketentuan">
                                    <Input
                                        value={str('terms_title')}
                                        onChange={set('terms_title')}
                                        placeholder="Syarat & Ketentuan Penggunaan"
                                    />
                                </Field>
                            </Section>
                        </div>
                    </div>
                </div>
            </form>
        </>
    );
}
