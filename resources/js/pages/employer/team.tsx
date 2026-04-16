import { Head, useForm } from '@inertiajs/react';
import { Crown, MoreHorizontal, Plus, ShieldCheck, User2 } from 'lucide-react';
import { useState } from 'react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store, update, destroy, toggle } from '@/routes/employer/team';

type Member = {
    id: number;
    user_id: number;
    name: string;
    email: string;
    avatar_url: string | null;
    role: string;
    is_active: boolean;
    invited_at: string;
    joined_at: string;
};

type TeamProps = {
    company: {
        id: number;
        name: string;
        owner_id: number;
    };
    members: Member[];
    isOwner: boolean;
};

const ROLE_LABELS: Record<string, string> = {
    owner: 'Owner',
    admin_hr: 'Admin HR',
    recruiter: 'Recruiter',
    viewer: 'Viewer',
};

const ROLE_COLORS: Record<string, string> = {
    owner: 'bg-amber-100 text-amber-700',
    admin_hr: 'bg-violet-100 text-violet-700',
    recruiter: 'bg-blue-100 text-blue-700',
    viewer: 'bg-gray-100 text-gray-600',
};

function RoleBadge({ role }: { role: string }) {
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[role] ?? 'bg-gray-100 text-gray-600'}`}
        >
            {role === 'owner' && <Crown className="size-3" />}
            {role === 'admin_hr' && <ShieldCheck className="size-3" />}
            {ROLE_LABELS[role] ?? role}
        </span>
    );
}

function Avatar({ name, url }: { name: string; url: string | null }) {
    if (url) {
        return (
            <img
                src={url}
                alt={name}
                className="size-9 rounded-full object-cover"
            />
        );
    }
    return (
        <div className="flex size-9 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground uppercase">
            {name.charAt(0)}
        </div>
    );
}

export default function EmployerTeam({ company, members, isOwner }: TeamProps) {
    const [addOpen, setAddOpen] = useState(false);

    const addForm = useForm({ email: '', role: 'recruiter' });

    function submitAdd(e: React.FormEvent) {
        e.preventDefault();
        addForm.post(store().url, {
            onSuccess: () => {
                setAddOpen(false);
                addForm.reset();
            },
        });
    }

    return (
        <>
            <Head title="Kelola Tim" />

            <div className="space-y-6 p-4 md:p-6">
                <div className="flex items-start justify-between gap-4">
                    <Heading
                        title="Kelola Tim"
                        description={`Anggota tim yang dapat mengakses panel employer ${company.name}.`}
                    />
                    {isOwner && (
                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="size-4" />
                                    Tambah Anggota
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Tambah Anggota Tim
                                    </DialogTitle>
                                    <DialogDescription>
                                        Masukkan email pengguna yang sudah
                                        terdaftar di Karivia. Mereka akan
                                        langsung dapat mengakses panel employer
                                        ini.
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={submitAdd}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email">
                                            Email pengguna
                                        </Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="febri@perusahaan.com"
                                            value={addForm.data.email}
                                            onChange={(e) =>
                                                addForm.setData(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={addForm.errors.email}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="role">Role</Label>
                                        <Select
                                            value={addForm.data.role}
                                            onValueChange={(v) =>
                                                addForm.setData('role', v)
                                            }
                                        >
                                            <SelectTrigger id="role">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin_hr">
                                                    Admin HR — kelola semua
                                                </SelectItem>
                                                <SelectItem value="recruiter">
                                                    Recruiter — posting &
                                                    pipeline
                                                </SelectItem>
                                                <SelectItem value="viewer">
                                                    Viewer — hanya lihat
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <InputError
                                            message={addForm.errors.role}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={addForm.processing}
                                        >
                                            Tambahkan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Anggota Tim</CardTitle>
                        <CardDescription>
                            {members.length} anggota aktif dan nonaktif.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="divide-y">
                        {members.length === 0 ? (
                            <p className="py-4 text-sm text-muted-foreground">
                                Belum ada anggota tim. Tambahkan anggota
                                pertama.
                            </p>
                        ) : (
                            members.map((member) => (
                                <MemberRow
                                    key={member.id}
                                    member={member}
                                    isOwner={isOwner}
                                    currentOwnerId={company.owner_id}
                                />
                            ))
                        )}
                    </CardContent>
                </Card>

                <Card className="border-dashed">
                    <CardHeader>
                        <CardTitle className="text-base">
                            Bagaimana anggota tim bisa mengakses?
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm text-muted-foreground">
                        <p>
                            1. Pastikan pengguna sudah mendaftar di Karivia
                            sebagai <strong>Employer</strong>.
                        </p>
                        <p>
                            2. Tambahkan email mereka dan pilih role yang
                            sesuai.
                        </p>
                        <p>
                            3. Mereka langsung dapat login dan mengakses panel
                            perusahaan ini.
                        </p>
                        <div className="mt-3 grid gap-2 rounded-lg bg-muted/40 p-3 sm:grid-cols-3">
                            <RoleDesc
                                role="admin_hr"
                                desc="Akses penuh: lowongan, kandidat, tim, billing"
                            />
                            <RoleDesc
                                role="recruiter"
                                desc="Posting lowongan dan kelola pipeline kandidat"
                            />
                            <RoleDesc
                                role="viewer"
                                desc="Hanya melihat data tanpa bisa mengubah"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function MemberRow({
    member,
    isOwner,
    currentOwnerId,
}: {
    member: Member;
    isOwner: boolean;
    currentOwnerId: number;
}) {
    const [roleOpen, setRoleOpen] = useState(false);
    const roleForm = useForm({ role: member.role });

    const isThisOwner = member.user_id === currentOwnerId;

    function submitRole(e: React.FormEvent) {
        e.preventDefault();
        roleForm.patch(update({ teamMember: member.id }).url, {
            onSuccess: () => setRoleOpen(false),
        });
    }

    function handleToggle() {
        roleForm.patch(toggle({ teamMember: member.id }).url);
    }

    function handleDelete() {
        if (!confirm(`Hapus ${member.name} dari tim?`)) return;
        roleForm.delete(destroy({ teamMember: member.id }).url);
    }

    return (
        <div className="flex items-center gap-4 py-4">
            <Avatar name={member.name} url={member.avatar_url} />
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                        {member.name}
                    </p>
                    <RoleBadge role={isThisOwner ? 'owner' : member.role} />
                    {!member.is_active && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600">
                            Nonaktif
                        </span>
                    )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                    {member.email}
                </p>
                <p className="text-xs text-muted-foreground">
                    Bergabung: {member.joined_at}
                </p>
            </div>

            {isOwner && !isThisOwner && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-8">
                            <MoreHorizontal className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
                            <DialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                >
                                    Ubah Role
                                </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        Ubah Role — {member.name}
                                    </DialogTitle>
                                </DialogHeader>
                                <form
                                    onSubmit={submitRole}
                                    className="space-y-4"
                                >
                                    <Select
                                        value={roleForm.data.role}
                                        onValueChange={(v) =>
                                            roleForm.setData('role', v)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="admin_hr">
                                                Admin HR
                                            </SelectItem>
                                            <SelectItem value="recruiter">
                                                Recruiter
                                            </SelectItem>
                                            <SelectItem value="viewer">
                                                Viewer
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <DialogFooter>
                                        <Button
                                            type="submit"
                                            disabled={roleForm.processing}
                                        >
                                            Simpan
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                        <DropdownMenuItem onSelect={handleToggle}>
                            {member.is_active
                                ? 'Nonaktifkan Akses'
                                : 'Aktifkan Akses'}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onSelect={handleDelete}
                            className="text-red-600 focus:text-red-600"
                        >
                            Hapus dari Tim
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
        </div>
    );
}

function RoleDesc({ role, desc }: { role: string; desc: string }) {
    return (
        <div className="flex flex-col gap-1">
            <RoleBadge role={role} />
            <p className="text-xs">{desc}</p>
        </div>
    );
}
