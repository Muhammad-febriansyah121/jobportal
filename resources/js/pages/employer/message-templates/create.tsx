import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import EmployerMessageTemplateController from '@/actions/App/Http/Controllers/Employer/EmployerMessageTemplateController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Textarea } from '@/components/ui/textarea';
import { index as indexRoute } from '@/routes/employer/message-templates';

type Channel = 'whatsapp' | 'email';

export default function EmployerMessageTemplatesCreate() {
    const form = useForm<{
        name: string;
        channel: Channel;
        subject: string;
        body: string;
        description: string;
        is_active: boolean;
    }>({
        name: '',
        channel: 'whatsapp',
        subject: '',
        body: '<p>Halo {nama},</p><p></p>',
        description: '',
        is_active: true,
    });

    const submit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        form.post(EmployerMessageTemplateController.store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Template berhasil dibuat.');
            },
            onError: () => {
                toast.error('Periksa form, ada isian yang belum sesuai.');
            },
        });
    };

    return (
        <>
            <Head title="Buat Template Pesan" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-center gap-3">
                    <Button asChild variant="outline" size="sm">
                        <Link href={indexRoute().url}>
                            <ArrowLeft className="size-4" />
                            Kembali
                        </Link>
                    </Button>
                </div>

                <Heading
                    title="Buat Template Pesan"
                    description="Simpan template yang bisa dipakai ulang untuk broadcast WA atau Email."
                />

                <form onSubmit={submit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detail template</CardTitle>
                            <CardDescription>
                                Variabel didukung:{' '}
                                <code className="font-mono">{'{nama}'}</code>,{' '}
                                <code className="font-mono">{'{posisi}'}</code>,{' '}
                                <code className="font-mono">
                                    {'{perusahaan}'}
                                </code>
                                .
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama template</Label>
                                <Input
                                    id="name"
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                    placeholder="Contoh: Undangan Walk-in Interview"
                                    maxLength={191}
                                />
                                <InputError message={form.errors.name} />
                            </div>

                            <div className="space-y-2">
                                <Label>Channel</Label>
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${form.data.channel === 'whatsapp' ? 'border-primary-500 bg-primary-50/50' : 'border-border'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="channel"
                                            value="whatsapp"
                                            checked={
                                                form.data.channel === 'whatsapp'
                                            }
                                            onChange={() =>
                                                form.setData(
                                                    'channel',
                                                    'whatsapp',
                                                )
                                            }
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-medium">
                                                WhatsApp
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Untuk pesan singkat ke nomor WA.
                                            </p>
                                        </div>
                                    </label>
                                    <label
                                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${form.data.channel === 'email' ? 'border-primary-500 bg-primary-50/50' : 'border-border'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="channel"
                                            value="email"
                                            checked={
                                                form.data.channel === 'email'
                                            }
                                            onChange={() =>
                                                form.setData('channel', 'email')
                                            }
                                            className="mt-1"
                                        />
                                        <div>
                                            <p className="font-medium">Email</p>
                                            <p className="text-xs text-muted-foreground">
                                                Untuk pesan formal dengan
                                                subject.
                                            </p>
                                        </div>
                                    </label>
                                </div>
                                <InputError message={form.errors.channel} />
                            </div>

                            {form.data.channel === 'email' ? (
                                <div className="space-y-2">
                                    <Label htmlFor="subject">
                                        Subject email
                                    </Label>
                                    <Input
                                        id="subject"
                                        value={form.data.subject}
                                        onChange={(e) =>
                                            form.setData(
                                                'subject',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Contoh: Update lamaran Anda di {perusahaan}"
                                        maxLength={191}
                                    />
                                    <InputError message={form.errors.subject} />
                                </div>
                            ) : null}

                            <div className="space-y-2">
                                <Label htmlFor="body">Isi pesan</Label>
                                <RichTextEditor
                                    value={form.data.body}
                                    onChange={(html) =>
                                        form.setData('body', html)
                                    }
                                    placeholder="Halo {nama}, ..."
                                    minHeightClass="min-h-48"
                                />
                                <InputError message={form.errors.body} />
                                <p className="text-xs text-muted-foreground">
                                    Format akan menyesuaikan channel: untuk
                                    Email dikirim sebagai HTML, untuk WhatsApp
                                    dikonversi ke format WA (*tebal*, _miring_).
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">
                                    Catatan internal
                                </Label>
                                <Textarea
                                    id="description"
                                    rows={3}
                                    value={form.data.description}
                                    onChange={(e) =>
                                        form.setData(
                                            'description',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Kapan template ini dipakai? Contoh: untuk reject otomatis kandidat tidak lolos."
                                />
                                <InputError
                                    message={form.errors.description}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Tidak ditampilkan ke kandidat. Untuk catatan
                                    tim saja.
                                </p>
                            </div>

                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                Aktifkan template (bisa dipilih saat broadcast)
                            </label>
                        </CardContent>
                    </Card>

                    <div className="flex items-center justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            asChild
                        >
                            <Link href={indexRoute().url}>Batal</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            <Save className="size-4" />
                            {form.processing ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

EmployerMessageTemplatesCreate.layout = {
    breadcrumbs: [
        { title: 'Template Pesan', href: indexRoute() },
        { title: 'Buat baru' },
    ],
};
