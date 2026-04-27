import { Head, useForm } from '@inertiajs/react';
import { ShieldCheck, Save } from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageHeader } from '@/components/admin/admin-page-header';
import InputError from '@/components/input-error';
import { RichEditor } from '@/components/rich-editor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { update as privacyUpdate } from '@/routes/admin/legal/privacy';
import { edit as adminSettings } from '@/routes/admin/settings';

type PrivacyProps = {
    privacy_title: string;
    privacy_content: string;
};

export default function AdminLegalPrivacy({ privacy_title, privacy_content }: PrivacyProps) {
    const form = useForm({
        privacy_title,
        privacy_content,
    });

    function submit(e: React.FormEvent) {
        e.preventDefault();

        form.post(privacyUpdate().url, {
            preserveScroll: true,
            onError: () => toast.error('Periksa kembali data yang diisi.'),
        });
    }

    return (
        <>
            <Head title="Kebijakan Privasi" />

            <div className="flex flex-col gap-6 p-6">
                <AdminPageHeader
                    title="Kebijakan Privasi"
                    description="Kelola konten halaman Kebijakan Privasi yang tampil ke publik."
                    backHref={adminSettings().url}
                />

                <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_280px]">
                    {/* Main Content */}
                    <div className="space-y-6">
                        {/* Title */}
                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b pb-4">
                                <ShieldCheck className="size-4 text-primary" />
                                <h2 className="text-sm font-semibold text-gray-700">Informasi Halaman</h2>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="privacy_title">Judul Halaman</Label>
                                <Input
                                    id="privacy_title"
                                    value={form.data.privacy_title}
                                    onChange={(e) => form.setData('privacy_title', e.target.value)}
                                    placeholder="Kebijakan Privasi"
                                />
                                <InputError message={form.errors.privacy_title} />
                            </div>
                        </section>

                        {/* Content */}
                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center gap-2 border-b pb-4">
                                <ShieldCheck className="size-4 text-primary" />
                                <h2 className="text-sm font-semibold text-gray-700">Isi Konten</h2>
                            </div>
                            <RichEditor
                                value={form.data.privacy_content}
                                onChange={(val) => form.setData('privacy_content', val)}
                                error={form.errors.privacy_content}
                                placeholder="Tulis isi Kebijakan Privasi di sini..."
                                minHeight="520px"
                            />
                        </section>
                    </div>

                    {/* Sidebar */}
                    <aside className="space-y-4">
                        <section className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="mb-4 text-sm font-semibold text-gray-700">Publikasi</h3>

                            <div className="mb-4 rounded-lg bg-secondary-50 p-3 text-xs text-secondary-700">
                                Perubahan akan langsung tampil di halaman publik{' '}
                                <span className="font-semibold">/privacy</span> setelah disimpan.
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={form.processing}
                            >
                                <Save className="size-4" />
                                {form.processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </Button>
                        </section>

                        <section className="rounded-xl border bg-white p-5 shadow-sm">
                            <h3 className="mb-3 text-sm font-semibold text-gray-700">Tips Penulisan</h3>
                            <ul className="space-y-2 text-xs text-gray-500">
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    Jelaskan data apa yang dikumpulkan dan tujuannya.
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    Sertakan kebijakan penyimpanan dan retensi data.
                                </li>
                                <li className="flex items-start gap-1.5">
                                    <span className="mt-0.5 text-primary">•</span>
                                    Cantumkan kontak untuk pertanyaan terkait privasi.
                                </li>
                            </ul>
                        </section>
                    </aside>
                </form>
            </div>
        </>
    );
}
