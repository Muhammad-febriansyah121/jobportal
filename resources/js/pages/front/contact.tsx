import type { FormComponentRef } from '@inertiajs/core';
import { Form, Head, usePage } from '@inertiajs/react';
import { CheckCircle2, ChevronDown, Facebook, Instagram, Linkedin, Mail, MapPin, MessageCircle, Phone, Send, Sparkles, Twitter, Youtube } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import HomeLayout from '@/layouts/front/home-layout';
import { useTranslate } from '@/hooks/use-translate';

declare global {
    interface Window {
        grecaptcha: {
            ready: (callback: () => void) => void;
            execute: (siteKey: string, options: { action: string }) => Promise<string>;
        };
    }
}

type Faq = { id: number; title: string; description: string };

type ContactProps = {
    faqs: Faq[];
    site_name: string;
    support_email: string;
    support_phone: string;
    whatsapp_number: string;
    address: string;
    maps_embed_url: string;
    facebook_url: string;
    instagram_url: string;
    linkedin_url: string;
    twitter_url: string;
    youtube_url: string;
    recaptcha_site_key: string;
    recaptcha_enabled: boolean;
};

const socialLinks = [
    { key: 'instagram_url', icon: Instagram, label: 'Instagram', color: 'hover:text-pink-500' },
    { key: 'facebook_url', icon: Facebook, label: 'Facebook', color: 'hover:text-blue-600' },
    { key: 'linkedin_url', icon: Linkedin, label: 'LinkedIn', color: 'hover:text-sky-600' },
    { key: 'twitter_url', icon: Twitter, label: 'X / Twitter', color: 'hover:text-slate-900' },
    { key: 'youtube_url', icon: Youtube, label: 'YouTube', color: 'hover:text-red-600' },
] as const;


export default function Contact({
    faqs,
    site_name,
    support_email,
    support_phone,
    whatsapp_number,
    address,
    maps_embed_url,
    facebook_url,
    instagram_url,
    linkedin_url,
    twitter_url,
    youtube_url,
    recaptcha_site_key = '',
    recaptcha_enabled = false,
}: ContactProps) {
    const { t } = useTranslate();
    const { props } = usePage<{ flash: { success?: string } }>();
    const recaptchaInputRef = useRef<HTMLInputElement>(null);
    const formRef = useRef<FormComponentRef>(null);

    const subjectOptions = [
        t('front.contact.subject_general'),
        t('front.contact.subject_bug'),
        t('front.contact.subject_partnership'),
        t('front.contact.subject_feedback'),
        t('front.contact.subject_pricing'),
        t('front.contact.subject_other'),
    ];

    useEffect(() => {
        if (!recaptcha_enabled || !recaptcha_site_key) return;
        const script = document.createElement('script');
        script.src = `https://www.google.com/recaptcha/api.js?render=${recaptcha_site_key}`;
        script.async = true;
        document.head.appendChild(script);
        return () => { if (document.head.contains(script)) document.head.removeChild(script); };
    }, [recaptcha_enabled, recaptcha_site_key]);

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!recaptcha_enabled || !recaptcha_site_key || !recaptchaInputRef.current) return;
        e.preventDefault();
        try {
            await new Promise<void>((resolve) => window.grecaptcha.ready(resolve));
            const token = await window.grecaptcha.execute(recaptcha_site_key, { action: 'contact' });
            recaptchaInputRef.current.value = token;
        } catch {
            recaptchaInputRef.current.value = '';
        }
        formRef.current?.submit();
    };

    const socials = { instagram_url, facebook_url, linkedin_url, twitter_url, youtube_url };
    const waHref = whatsapp_number ? `https://wa.me/${whatsapp_number.replace(/\D/g, '')}` : null;

    const contactItems = [
        support_email && { icon: <Mail className="size-5 text-primary-600" />, label: t('front.contact.contact_email_label'), value: support_email, href: `mailto:${support_email}`, hint: t('front.contact.contact_email_hint') },
        support_phone && { icon: <Phone className="size-5 text-primary-600" />, label: t('front.contact.contact_phone_label'), value: support_phone, href: `tel:${support_phone.replace(/\s/g, '')}`, hint: t('front.contact.contact_phone_hint') },
        waHref && { icon: <MessageCircle className="size-5 text-green-600" />, label: t('front.contact.contact_wa_label'), value: support_phone || whatsapp_number, href: waHref, hint: t('front.contact.contact_wa_hint'), external: true },
        address && { icon: <MapPin className="size-5 text-primary-600" />, label: t('front.contact.contact_address_label'), value: address, hint: t('front.contact.contact_address_hint') },
    ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href?: string; hint?: string; external?: boolean }[];

    return (
        <HomeLayout>
            <Head title={t('front.contact.head_title')} />

            {/* Hero */}
            <section className="relative overflow-hidden bg-white pt-20 pb-14 text-center">
                <div className="pointer-events-none absolute -top-24 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="relative mx-auto max-w-2xl px-4">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-1.5 text-xs font-semibold text-primary-600">
                        <Sparkles className="size-3.5" />
                        {t('front.contact.hero_badge')}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                        {t('front.contact.hero_title_prefix')}{' '}
                        <span className="text-primary-600">{t('front.contact.hero_title_highlight')}</span>
                    </h1>
                    <p className="mt-4 text-base text-slate-500">
                        {t('front.contact.hero_subtitle', { site_name })}
                    </p>
                </div>
            </section>

            {/* Main content */}
            <section className="bg-[#f5f6f8] px-4 py-14">
                <div className="mx-auto max-w-5xl">
                    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

                        {/* Left — Form card */}
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                            <h2 className="text-xl font-bold text-slate-900">{t('front.contact.form_title')}</h2>
                            <p className="mt-1 text-sm text-slate-500">{t('front.contact.form_subtitle')}</p>

                            {props.flash?.success ? (
                                <div className="mt-6 flex items-start gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                                    <div>
                                        <p className="font-semibold text-emerald-800">{t('front.contact.success_heading')}</p>
                                        <p className="mt-0.5 text-sm text-emerald-700">{props.flash.success}</p>
                                    </div>
                                </div>
                            ) : (
                                <Form action="/contact" method="post" resetOnSuccess className="mt-6 space-y-4" ref={formRef}>
                                    {({ errors, processing }) => (
                                        <>
                                            <input ref={recaptchaInputRef} type="hidden" name="recaptcha_token" defaultValue="" />
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field label={t('front.contact.field_name')} error={errors.name}>
                                                    <input name="name" type="text" placeholder={t('front.contact.field_name_placeholder')} className="input-field" required />
                                                </Field>
                                                <Field label={t('front.contact.field_email')} error={errors.email}>
                                                    <input name="email" type="email" placeholder={t('front.contact.field_email_placeholder')} className="input-field" required />
                                                </Field>
                                            </div>
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <Field label={t('front.contact.field_phone')} error={errors.phone}>
                                                    <input name="phone" type="tel" placeholder="08xxxxxxxxxx" className="input-field" />
                                                </Field>
                                                <Field label={t('front.contact.field_subject')} error={errors.subject}>
                                                    <select name="subject" className="input-field" required>
                                                        <option value="">{t('front.contact.field_subject_placeholder')}</option>
                                                        {subjectOptions.map((opt) => (
                                                            <option key={opt} value={opt}>{opt}</option>
                                                        ))}
                                                    </select>
                                                </Field>
                                            </div>
                                            <Field label={t('front.contact.field_message')} error={errors.message}>
                                                <textarea name="message" rows={5} placeholder={t('front.contact.field_message_placeholder')} className="input-field resize-none" required />
                                            </Field>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                onClick={handleSubmit}
                                                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary-600 text-sm font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-[0.98] disabled:opacity-70 sm:w-auto sm:px-8"
                                            >
                                                <Send className="size-4" />
                                                {processing ? t('front.contact.submit_loading') : t('front.contact.submit')}
                                            </button>
                                            {recaptcha_enabled && (
                                                <p className="text-xs text-slate-400">
                                                    {t('front.contact.recaptcha_intro')}{' '}
                                                    <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">{t('front.contact.recaptcha_privacy')}</a>
                                                    {' '}& <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline hover:text-slate-600">{t('front.contact.recaptcha_terms')}</a> {t('front.contact.recaptcha_apply')}.
                                                </p>
                                            )}
                                        </>
                                    )}
                                </Form>
                            )}
                        </div>

                        {/* Right — Info sidebar */}
                        <div className="flex flex-col gap-5">

                            {/* Contact info */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-sm font-bold text-slate-900">{t('front.contact.info_title')}</h3>
                                <div className="space-y-4">
                                    {contactItems.map(({ icon, label, value, href, hint, external }) => {
                                        const content = (
                                            <div className="flex items-start gap-3">
                                                <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-50">
                                                    {icon}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                                                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{value}</p>
                                                    {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
                                                </div>
                                            </div>
                                        );
                                        if (!href) return <div key={label}>{content}</div>;
                                        return (
                                            <a key={label} href={href} className="block transition hover:opacity-80" {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                                                {content}
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Social media */}
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                                <h3 className="mb-4 text-sm font-bold text-slate-900">{t('front.contact.social_title')}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {socialLinks.map(({ key, icon: Icon, label }) => {
                                        const url = socials[key];
                                        if (!url) return null;
                                        return (
                                            <a
                                                key={key}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                title={label}
                                                className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 transition hover:border-primary-200 hover:bg-primary-50 hover:text-primary-600"
                                            >
                                                <Icon className="size-4" />
                                            </a>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Map */}
                            {maps_embed_url && (
                                <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                                    <iframe
                                        src={maps_embed_url}
                                        title={t('front.contact.map_title')}
                                        className="h-48 w-full"
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            {faqs.length > 0 && (
                <section className="bg-white px-4 py-16">
                    <div className="mx-auto max-w-3xl">
                        <div className="mb-10 text-center">
                            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                                {t('front.contact.faq_title')}
                            </h2>
                            <p className="mt-2 text-sm text-slate-500">
                                {t('front.contact.faq_subtitle')}
                            </p>
                        </div>
                        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {faqs.map((faq) => <FaqItem key={faq.id} faq={faq} />)}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Banner */}
            <section className="bg-primary-600 px-4 py-14 text-center">
                <div className="mx-auto max-w-xl">
                    <h2 className="text-2xl font-bold text-white sm:text-3xl">
                        {t('front.contact.cta_title', { site_name })}
                    </h2>
                    <p className="mt-3 text-sm text-primary-100">
                        {t('front.contact.cta_subtitle')}
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                        <a href="/jobs" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-bold text-primary-600 shadow-sm transition hover:bg-primary-50 active:scale-95">
                            {t('front.contact.cta_find_jobs')}
                        </a>
                        <a href="/pricing" className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-6 text-sm font-bold text-white backdrop-blur transition hover:bg-white/20 active:scale-95">
                            {t('front.contact.cta_for_companies')}
                        </a>
                    </div>
                </div>
            </section>
        </HomeLayout>
    );
}

function FaqItem({ faq }: { faq: Faq }) {
    const [open, setOpen] = useState(false);

    return (
        <div className={`transition-colors ${open ? 'bg-primary-50/40' : 'bg-white'}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
            >
                <span className="text-sm font-semibold text-slate-800 sm:text-base">{faq.title}</span>
                <span className={`flex size-7 shrink-0 items-center justify-center rounded-full transition-colors ${open ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <ChevronDown className={`size-4 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
                </span>
            </button>
            {open && (
                <div className="px-6 pb-5">
                    <p className="text-sm leading-relaxed text-slate-500">{faq.description}</p>
                </div>
            )}
        </div>
    );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
    return (
        <div className="grid gap-1.5">
            <label className="text-sm font-semibold text-slate-700">{label}</label>
            {children}
            {error && <p className="text-xs font-medium text-red-500">{error}</p>}
        </div>
    );
}
