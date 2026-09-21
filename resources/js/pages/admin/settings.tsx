import { Head, useForm } from '@inertiajs/react';
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
import { toast } from 'sonner';
import { RichEditor } from '@/components/rich-editor';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslate } from '@/hooks/use-translate';
import { smtpTest as settingsSmtpTest, update as settingsUpdate } from '@/routes/admin/settings';

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
                            ? 'border-[#136BB4] text-[#136BB4]'
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

const imageFieldKeys = [
    'site_logo_url',
    'site_favicon_url',
    'login_banner_url',
    'about_hero_image',
    'about_office_image',
] as const;

function storageUrl(path: string | null | undefined): string | null {
    if (!path) {
return null;
}

    if (path.startsWith('http')) {
return path;
}

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
        <Card>
            <div className="flex items-center gap-3 border-b px-6 py-4">
                <div className="flex size-8 items-center justify-center rounded-lg bg-[#136BB4]/10">
                    <Icon className="size-4 text-[#136BB4]" />
                </div>
                <h2 className="text-base font-semibold">{title}</h2>
            </div>
            <CardContent className="grid gap-5 pt-6 sm:grid-cols-2">{children}</CardContent>
        </Card>
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
            className="w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-background transition outline-none focus:border-[#136BB4] focus:ring-2 focus:ring-[#136BB4]/50"
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
            className="w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm ring-offset-background transition outline-none focus:border-[#136BB4] focus:ring-2 focus:ring-[#136BB4]/50"
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
    const { t } = useTranslate();
    const [show, setShow] = useState(false);

    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="sk-..."
                className="w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm ring-offset-background transition outline-none focus:border-[#136BB4] focus:ring-2 focus:ring-[#136BB4]/50"
            />
            <button
                type="button"
                onClick={() => setShow((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={show ? t('admin.settings.input.hide_api_key') : t('admin.settings.input.show_api_key')}
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
    const { t } = useTranslate();
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

        if (file && file.type.startsWith('image/')) {
handleFile(file);
}
    };

    const handleRemove = () => {
        setPreview(null);
        onFileSelect(null);

        if (inputRef.current) {
inputRef.current.value = '';
}
    };

    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
                {label}
            </label>
            <div
                className={`relative flex min-h-36 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
                    isDragging
                        ? 'border-[#136BB4] bg-[#136BB4]/5'
                        : 'border-border bg-muted/30 hover:border-[#136BB4]/50'
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
                            {t('admin.settings.image_upload.drag_drop')}
                        </p>
                        {aspectHint && <p className="text-xs">{aspectHint}</p>}
                        <p className="text-xs">{t('admin.settings.image_upload.formats')}</p>
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
    const { t } = useTranslate();
    const get = (key: string) => settings[key] ?? '';

    const smtpTestForm = useForm({ to: '' });

    const { data, setData, post, processing, transform } = useForm<
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
        google_login_client_id: get('google_login_client_id'),
        google_login_client_secret: get('google_login_client_secret'),
        privacy_title: get('privacy_title'),
        terms_title: get('terms_title'),
        ai_api_key: get('ai_api_key'),
        ai_model: get('ai_model') || 'gpt-5',
        whatsapp_gateway_url: get('whatsapp_gateway_url'),
        whatsapp_gateway_api_key: get('whatsapp_gateway_api_key'),
        whatsapp_gateway_default_session_id: get('whatsapp_gateway_default_session_id'),
        whatsapp_gateway_connect_timeout:
            get('whatsapp_gateway_connect_timeout') || '3',
        whatsapp_gateway_timeout: get('whatsapp_gateway_timeout') || '10',
        pakasir_project: get('pakasir_project'),
        pakasir_api_key: get('pakasir_api_key'),
        smtp_host: get('smtp_host'),
        smtp_port: get('smtp_port') || '587',
        smtp_encryption: get('smtp_encryption') || 'tls',
        smtp_auth: (get('smtp_auth') || '1') === '1',
        smtp_username: get('smtp_username'),
        smtp_password: '',
        smtp_password_set: get('smtp_password_set') === '1',
        smtp_from_address: get('smtp_from_address'),
        smtp_from_name: get('smtp_from_name'),
    });

    const [activeTab, setActiveTab] = useState('umum');

    const tabs: Tab[] = [
        { key: 'umum', label: t('admin.settings.tabs.general'), icon: Globe },
        { key: 'media', label: t('admin.settings.tabs.media'), icon: ImageIcon },
        { key: 'sosial', label: t('admin.settings.tabs.social'), icon: Share2 },
        { key: 'tentang', label: t('admin.settings.tabs.about'), icon: Building2 },
        // Tab AI & Pembayaran disembunyikan — secret dikelola via .env
        // { key: 'ai', label: t('admin.settings.tabs.ai'), icon: Bot },
        // { key: 'pembayaran', label: t('admin.settings.tabs.payment'), icon: CreditCard },
        { key: 'sistem', label: t('admin.settings.tabs.system'), icon: ShieldOff },
    ];

    const str = (key: string) => (data[key] as string) ?? '';
    const set = (key: string) => (v: string) =>
        setData(key as never, v as never);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        transform((formData) => {
            const payload = { ...formData };

            for (const imageKey of imageFieldKeys) {
                if (!(payload[imageKey] instanceof File)) {
                    delete payload[imageKey];
                }
            }

            return payload;
        });

        post(settingsUpdate.url(), {
            forceFormData: true,
            onError: (formErrors) => {
                const firstError = Object.values(formErrors)[0];
                toast.error(
                    typeof firstError === 'string'
                        ? firstError
                        : t('admin.settings.error_message'),
                );
            },
        });
    };

    return (
        <>
            <Head title={t('admin.settings.title')} />

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6 p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b pb-5">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-normal">
                                {t('admin.settings.title')}
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {t('admin.settings.subtitle')}
                            </p>
                        </div>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-[#136BB4] px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#093579] disabled:opacity-60"
                        >
                            {processing ? t('admin.settings.saving') : t('admin.settings.save_changes')}
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
                            <Section icon={Globe} title={t('admin.settings.general.identity')}>
                                <Field label={t('admin.settings.general.site_name')}>
                                    <Input
                                        value={str('site_name')}
                                        onChange={set('site_name')}
                                        placeholder="Karivia"
                                    />
                                </Field>
                                <Field label={t('admin.settings.general.tagline')}>
                                    <Input
                                        value={str('site_tagline')}
                                        onChange={set('site_tagline')}
                                        placeholder="Job Portal Terpercaya"
                                    />
                                </Field>
                                <Field label={t('admin.settings.general.description')} full>
                                    <Textarea
                                        value={str('site_description')}
                                        onChange={set('site_description')}
                                        placeholder={t('admin.settings.general.desc_placeholder')}
                                    />
                                </Field>
                                <Field label={t('admin.settings.general.meta_desc')} full>
                                    <Textarea
                                        value={str('site_meta_description')}
                                        onChange={set('site_meta_description')}
                                        placeholder={t('admin.settings.general.meta_desc_placeholder')}
                                    />
                                </Field>
                                <Field label={t('admin.settings.general.meta_keywords')} full>
                                    <Input
                                        value={str('site_meta_keywords')}
                                        onChange={set('site_meta_keywords')}
                                        placeholder={t('admin.settings.general.meta_keys_placeholder')}
                                    />
                                </Field>
                            </Section>
                        </div>

                        {/* Tab: Media */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'media' ? '' : 'hidden'}`}
                        >
                            <Section icon={ImageIcon} title={t('admin.settings.media.title')}>
                                <ImageUpload
                                    label={t('admin.settings.media.logo')}
                                    currentPath={
                                        settings['site_logo_url'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'site_logo_url' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint={t('admin.settings.media.logo_hint')}
                                />
                                <ImageUpload
                                    label={t('admin.settings.media.favicon')}
                                    currentPath={
                                        settings['site_favicon_url'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'site_favicon_url' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint={t('admin.settings.media.favicon_hint')}
                                />
                                <div className="sm:col-span-2">
                                    <ImageUpload
                                        label={t('admin.settings.media.login_banner')}
                                        currentPath={
                                            settings['login_banner_url'] ?? null
                                        }
                                        onFileSelect={(file) =>
                                            setData(
                                                'login_banner_url' as never,
                                                file as never,
                                            )
                                        }
                                        aspectHint={t('admin.settings.media.login_banner_hint')}
                                    />
                                </div>
                            </Section>
                        </div>

                        {/* Tab: Sosial & Kontak */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'sosial' ? '' : 'hidden'}`}
                        >
                            <Section icon={Share2} title={t('admin.settings.social.title')}>
                                <Field label={t('admin.settings.social.facebook')}>
                                    <Input
                                        value={str('facebook_url')}
                                        onChange={set('facebook_url')}
                                        placeholder="https://facebook.com/..."
                                    />
                                </Field>
                                <Field label={t('admin.settings.social.instagram')}>
                                    <Input
                                        value={str('instagram_url')}
                                        onChange={set('instagram_url')}
                                        placeholder="https://instagram.com/..."
                                    />
                                </Field>
                                <Field label={t('admin.settings.social.linkedin')}>
                                    <Input
                                        value={str('linkedin_url')}
                                        onChange={set('linkedin_url')}
                                        placeholder="https://linkedin.com/company/..."
                                    />
                                </Field>
                                <Field label={t('admin.settings.social.twitter')}>
                                    <Input
                                        value={str('twitter_url')}
                                        onChange={set('twitter_url')}
                                        placeholder="https://x.com/..."
                                    />
                                </Field>
                                <Field label={t('admin.settings.social.youtube')}>
                                    <Input
                                        value={str('youtube_url')}
                                        onChange={set('youtube_url')}
                                        placeholder="https://youtube.com/@..."
                                    />
                                </Field>
                            </Section>

                            <Section icon={Mail} title={t('admin.settings.contact.title')}>
                                <Field label={t('admin.settings.contact.email')}>
                                    <Input
                                        value={str('support_email')}
                                        onChange={set('support_email')}
                                        type="email"
                                        placeholder="support@karivia.id"
                                    />
                                </Field>
                                <Field label={t('admin.settings.contact.phone')}>
                                    <Input
                                        value={str('support_phone')}
                                        onChange={set('support_phone')}
                                        placeholder="+62 21 1234 5678"
                                    />
                                </Field>
                                <Field label={t('admin.settings.contact.whatsapp')}>
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
                                title={t('admin.settings.about.title')}
                            >
                                <Field label={t('admin.settings.about.page_title')}>
                                    <Input
                                        value={str('about_title')}
                                        onChange={set('about_title')}
                                        placeholder={t('admin.settings.about.title_placeholder')}
                                    />
                                </Field>
                                <Field label={t('admin.settings.general.tagline')}>
                                    <Input
                                        value={str('about_tagline')}
                                        onChange={set('about_tagline')}
                                        placeholder={t('admin.settings.about.tagline_placeholder')}
                                    />
                                </Field>
                                <Field label={t('admin.settings.about.employee_count')}>
                                    <Input
                                        value={str('about_employee_count')}
                                        onChange={set('about_employee_count')}
                                        placeholder={t('admin.settings.about.employee_count_placeholder')}
                                    />
                                </Field>
                                <Field label={t('admin.settings.about.founded_year')}>
                                    <Input
                                        value={str('about_founded_year')}
                                        onChange={set('about_founded_year')}
                                        placeholder="2023"
                                    />
                                </Field>
                                <Field label={t('admin.settings.about.headquarters')}>
                                    <Input
                                        value={str('about_headquarters')}
                                        onChange={set('about_headquarters')}
                                        placeholder="Jakarta, Indonesia"
                                    />
                                </Field>
                                <Field label={t('admin.settings.about.description')} full>
                                    <RichEditor
                                        value={str('about_description')}
                                        onChange={set('about_description')}
                                        placeholder={t('admin.settings.about.desc_placeholder')}
                                        minHeight="160px"
                                    />
                                </Field>
                                <Field label={t('admin.settings.about.content')} full>
                                    <RichEditor
                                        value={str('about_content')}
                                        onChange={set('about_content')}
                                        placeholder={t('admin.settings.about.content_placeholder')}
                                        minHeight="320px"
                                    />
                                </Field>
                                <ImageUpload
                                    label={t('admin.settings.about.hero_image')}
                                    currentPath={
                                        settings['about_hero_image'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'about_hero_image' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint={t('admin.settings.about.hero_hint')}
                                />
                                <ImageUpload
                                    label={t('admin.settings.about.office_image')}
                                    currentPath={
                                        settings['about_office_image'] ?? null
                                    }
                                    onFileSelect={(file) =>
                                        setData(
                                            'about_office_image' as never,
                                            file as never,
                                        )
                                    }
                                    aspectHint={t('admin.settings.about.office_hint')}
                                />
                            </Section>
                        </div>

                        {/* Tab: AI */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'ai' ? '' : 'hidden'}`}
                        >
                            <Section icon={Bot} title={t('admin.settings.ai.title')}>
                                <Field label={t('admin.settings.ai.model')} full>
                                    <Input
                                        value={str('ai_model')}
                                        onChange={set('ai_model')}
                                        placeholder="gpt-5"
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        {t('admin.settings.ai.model_hint')}
                                    </p>
                                </Field>
                                <Field label={t('admin.settings.ai.api_key')} full>
                                    <AiApiKeyInput
                                        value={str('ai_api_key')}
                                        onChange={set('ai_api_key')}
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        {t('admin.settings.ai.api_key_hint')}
                                    </p>
                                </Field>
                            </Section>

                            <Section icon={Bot} title={t('admin.settings.wa_gateway.title')}>
                                <Field label={t('admin.settings.wa_gateway.url')} full>
                                    <Input
                                        value={str('whatsapp_gateway_url')}
                                        onChange={set('whatsapp_gateway_url')}
                                        placeholder="http://127.0.0.1:3000"
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        {t('admin.settings.wa_gateway.url_hint')}
                                    </p>
                                </Field>
                                <Field label={t('admin.settings.wa_gateway.api_key')} full>
                                    <AiApiKeyInput
                                        value={str('whatsapp_gateway_api_key')}
                                        onChange={set(
                                            'whatsapp_gateway_api_key',
                                        )}
                                    />
                                </Field>
                                {/* Default Session ID, Connect Timeout, Request Timeout — hidden */}
                            </Section>
                        </div>

                        {/* Tab: Pembayaran */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'pembayaran' ? '' : 'hidden'}`}
                        >
                            <Section icon={CreditCard} title={t('admin.settings.payment.title')}>
                                <Field label={t('admin.settings.payment.project_slug')} full>
                                    <Input
                                        value={str('pakasir_project')}
                                        onChange={set('pakasir_project')}
                                        placeholder="jobportal"
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        {t('admin.settings.payment.project_slug_hint')}
                                    </p>
                                </Field>
                                <Field label={t('admin.settings.ai.api_key')} full>
                                    <AiApiKeyInput
                                        value={str('pakasir_api_key')}
                                        onChange={set('pakasir_api_key')}
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        {t('admin.settings.payment.api_key_hint')}
                                    </p>
                                </Field>
                            </Section>
                        </div>

                        {/* Tab: Sistem */}
                        <div
                            className={`mt-5 flex flex-col gap-5 ${activeTab === 'sistem' ? '' : 'hidden'}`}
                        >
                            <Section icon={ShieldOff} title={t('admin.settings.system.maintenance_title')}>
                                <Field label={t('admin.settings.system.maintenance_status')} full>
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
                                                className={`h-6 w-11 rounded-full transition-colors ${data['maintenance_mode'] ? 'bg-[#136BB4]' : 'bg-muted-foreground/30'}`}
                                            />
                                            <div
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data['maintenance_mode'] ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                                            />
                                        </div>
                                        <span className="text-sm">
                                            {data['maintenance_mode']
                                                ? t('admin.settings.system.maintenance_active')
                                                : t('admin.settings.system.maintenance_inactive')}
                                        </span>
                                    </label>
                                </Field>
                                <Field label={t('admin.settings.system.maintenance_message')} full>
                                    <Textarea
                                        value={str('maintenance_message')}
                                        onChange={set('maintenance_message')}
                                        placeholder={t('admin.settings.system.maintenance_message_placeholder')}
                                    />
                                </Field>
                            </Section>

                            <Section icon={Mail} title={t('admin.settings.system.smtp_title')}>
                                <Field label={t('admin.settings.system.smtp_host')}>
                                    <Input
                                        value={str('smtp_host')}
                                        onChange={set('smtp_host')}
                                        placeholder="mail.karivia.id"
                                    />
                                </Field>
                                <Field label={t('admin.settings.system.smtp_port')}>
                                    <Input
                                        type="number"
                                        value={str('smtp_port')}
                                        onChange={set('smtp_port')}
                                        placeholder="587"
                                    />
                                </Field>
                                <Field label={t('admin.settings.system.smtp_encryption')}>
                                    <select
                                        value={str('smtp_encryption')}
                                        onChange={(e) =>
                                            setData(
                                                'smtp_encryption' as never,
                                                e.target.value as never,
                                            )
                                        }
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="tls">STARTTLS (587)</option>
                                        <option value="ssl">SSL/TLS (465)</option>
                                        <option value="none">{t('admin.settings.system.smtp_encryption_none')}</option>
                                    </select>
                                </Field>
                                <Field label={t('admin.settings.system.smtp_auth')}>
                                    <label className="flex cursor-pointer items-center gap-3">
                                        <div className="relative shrink-0">
                                            <input
                                                type="checkbox"
                                                className="sr-only"
                                                checked={Boolean(data['smtp_auth'])}
                                                onChange={(e) =>
                                                    setData(
                                                        'smtp_auth' as never,
                                                        e.target.checked as never,
                                                    )
                                                }
                                            />
                                            <div
                                                className={`h-6 w-11 rounded-full transition-colors ${data['smtp_auth'] ? 'bg-[#136BB4]' : 'bg-muted-foreground/30'}`}
                                            />
                                            <div
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${data['smtp_auth'] ? 'translate-x-5.5' : 'translate-x-0.5'}`}
                                            />
                                        </div>
                                        <span className="text-sm">
                                            {data['smtp_auth']
                                                ? t('admin.settings.system.smtp_auth_yes')
                                                : t('admin.settings.system.smtp_auth_no')}
                                        </span>
                                    </label>
                                </Field>
                                <Field label={t('admin.settings.system.smtp_email')}>
                                    <Input
                                        type="email"
                                        value={str('smtp_username')}
                                        onChange={set('smtp_username')}
                                        placeholder="support@karivia.id"
                                    />
                                </Field>
                                <Field label={t('admin.settings.system.smtp_password')}>
                                    <Input
                                        type="password"
                                        value={str('smtp_password')}
                                        onChange={set('smtp_password')}
                                        placeholder={
                                            data['smtp_password_set']
                                                ? t('admin.settings.system.smtp_password_filled')
                                                : t('admin.settings.system.smtp_password_empty')
                                        }
                                    />
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        {t('admin.settings.system.smtp_password_hint')}
                                    </p>
                                </Field>
                                <Field label={t('admin.settings.system.smtp_from_address')}>
                                    <Input
                                        type="email"
                                        value={str('smtp_from_address')}
                                        onChange={set('smtp_from_address')}
                                        placeholder="support@karivia.id"
                                    />
                                </Field>
                                <Field label={t('admin.settings.system.smtp_from_name')}>
                                    <Input
                                        value={str('smtp_from_name')}
                                        onChange={set('smtp_from_name')}
                                        placeholder="Karivia"
                                    />
                                </Field>
                                <Field label={t('admin.settings.system.smtp_test_to')} full>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <input
                                            type="email"
                                            value={smtpTestForm.data.to}
                                            onChange={(e) =>
                                                smtpTestForm.setData(
                                                    'to',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="email-tujuan@domain.com"
                                            className="w-full rounded-lg border bg-white px-3 py-2 text-sm ring-offset-background transition outline-none focus:border-[#136BB4] focus:ring-2 focus:ring-[#136BB4]/50"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                smtpTestForm.post(
                                                    settingsSmtpTest.url(),
                                                    {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            smtpTestForm.reset();
                                                        },
                                                        onError: (errors) => {
                                                            const firstError =
                                                                Object.values(
                                                                    errors,
                                                                )[0];
                                                            toast.error(
                                                                typeof firstError ===
                                                                    'string'
                                                                    ? firstError
                                                                    : t(
                                                                          'admin.settings.system.smtp_test_failed',
                                                                      ),
                                                            );
                                                        },
                                                    },
                                                )
                                            }
                                            disabled={
                                                smtpTestForm.processing ||
                                                smtpTestForm.data.to === ''
                                            }
                                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#136BB4] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#136BB4]/90 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {smtpTestForm.processing
                                                ? t('admin.settings.system.smtp_test_sending')
                                                : t('admin.settings.system.smtp_test_send')}
                                        </button>
                                    </div>
                                    <p className="mt-1.5 text-xs text-muted-foreground">
                                        {t('admin.settings.system.smtp_test_hint')}
                                    </p>
                                </Field>
                            </Section>

                            <Section icon={MapPin} title={t('admin.settings.system.maps_title')}>
                                <Field label={t('admin.settings.system.maps_url')} full>
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
                                            {t('admin.settings.system.maps_preview')}
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

                            <Section icon={KeyRound} title={t('admin.settings.system.recaptcha_title')}>
                                <Field label={t('admin.settings.system.recaptcha_site')}>
                                    <Input
                                        value={str('recaptcha_site_key')}
                                        onChange={set('recaptcha_site_key')}
                                        placeholder="Site key reCAPTCHA..."
                                    />
                                </Field>
                                <Field label={t('admin.settings.system.recaptcha_secret')}>
                                    <Input
                                        value={str('recaptcha_secret_key')}
                                        onChange={set('recaptcha_secret_key')}
                                        placeholder="Secret key reCAPTCHA..."
                                        type="password"
                                    />
                                </Field>
                            </Section>

                            {/* Section Google Login disembunyikan — Client ID/Secret dikelola via .env */}
                            <div className="hidden">
                                <Section icon={KeyRound} title={t('admin.settings.system.google_login')}>
                                    <Field label={t('admin.settings.system.google_client_id')} full>
                                        <Input
                                            value={str('google_login_client_id')}
                                            onChange={set('google_login_client_id')}
                                            placeholder="304084128651-xxxx.apps.googleusercontent.com"
                                        />
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                            {t('admin.settings.system.google_client_id_hint')}
                                        </p>
                                    </Field>
                                    <Field label={t('admin.settings.system.google_client_secret')} full>
                                        <Input
                                            value={str('google_login_client_secret')}
                                            onChange={set('google_login_client_secret')}
                                            placeholder="GOCSPX-xxxx..."
                                            type="password"
                                        />
                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                            {t('admin.settings.system.google_client_secret_hint')}
                                        </p>
                                    </Field>
                                </Section>
                            </div>

                            <Section icon={BookOpen} title={t('admin.settings.legal.title')}>
                                <Field label={t('admin.settings.legal.privacy_title')}>
                                    <Input
                                        value={str('privacy_title')}
                                        onChange={set('privacy_title')}
                                        placeholder={t('admin.settings.legal.privacy_placeholder')}
                                    />
                                </Field>
                                <Field label={t('admin.settings.legal.terms_title')}>
                                    <Input
                                        value={str('terms_title')}
                                        onChange={set('terms_title')}
                                        placeholder={t('admin.settings.legal.terms_placeholder')}
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
