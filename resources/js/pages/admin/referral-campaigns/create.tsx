import { Head, useForm } from '@inertiajs/react';
import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { store } from '@/routes/admin/referral-campaigns';

export default function CreateReferralCampaign() {
    const form = useForm({
        name: '', slug: '', description: '', ai_token_amount: 0,
        cv_builder_quota: 1, ai_interview_quota: 2, validity_days: 30,
        starts_at: '', ends_at: '', max_redemptions: '', max_referrals_per_user: '', is_active: true,
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store.url());
    };

    return <>
        <Head title="Tambah referral campaign" />
        <div className="max-w-3xl space-y-6 p-6">
            <div><h1 className="text-xl font-semibold">Tambah referral campaign</h1><p className="mt-1 text-sm text-muted-foreground">Atur benefit dan batas referral. Kode akan dibuat otomatis untuk setiap jobseeker.</p></div>
            <form onSubmit={submit} className="space-y-5 rounded-xl border border-border bg-card p-6 shadow-none">
                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nama campaign" name="name" value={form.data.name} onChange={(v) => form.setData('name', v)} error={form.errors.name} />
                    <Field label="Slug" name="slug" value={form.data.slug} onChange={(v) => form.setData('slug', v)} error={form.errors.slug} />
                    <Field label="Masa berlaku (hari)" name="validity_days" type="number" value={form.data.validity_days} onChange={(v) => form.setData('validity_days', Number(v))} error={form.errors.validity_days} />
                    <Field label="Kuota CV Builder" name="cv_builder_quota" type="number" value={form.data.cv_builder_quota} onChange={(v) => form.setData('cv_builder_quota', Number(v))} error={form.errors.cv_builder_quota} />
                    <Field label="Kuota AI Interview" name="ai_interview_quota" type="number" value={form.data.ai_interview_quota} onChange={(v) => form.setData('ai_interview_quota', Number(v))} error={form.errors.ai_interview_quota} />
                    <Field label="AI token" name="ai_token_amount" type="number" value={form.data.ai_token_amount} onChange={(v) => form.setData('ai_token_amount', Number(v))} error={form.errors.ai_token_amount} />
                    <Field label="Batas redemption" name="max_redemptions" type="number" value={form.data.max_redemptions} onChange={(v) => form.setData('max_redemptions', v)} error={form.errors.max_redemptions} />
                    <Field label="Batas referral per user" name="max_referrals_per_user" type="number" value={form.data.max_referrals_per_user} onChange={(v) => form.setData('max_referrals_per_user', v)} error={form.errors.max_referrals_per_user} />
                </div>
                <div><Label htmlFor="description">Deskripsi</Label><textarea id="description" value={form.data.description} onChange={(e) => form.setData('description', e.target.value)} className="mt-2 min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-[#0F4C94]" /></div>
                <div className="flex justify-end"><Button type="submit" disabled={form.processing} className="bg-[#0F4C94] hover:bg-[#093579]">{form.processing ? 'Menyimpan…' : 'Simpan campaign'}</Button></div>
            </form>
        </div>
    </>;
}

function Field({ label, name, value, onChange, error, type = 'text' }: { label: string; name: string; value: string | number; onChange: (value: string) => void; error?: string; type?: string }) {
    return <div><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2" />{error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}</div>;
}
