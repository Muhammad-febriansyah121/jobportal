import { Head, useForm } from '@inertiajs/react';
import {
    Crown,
    Plus,
    ShieldCheck,
    UserCheck,
    UserMinus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { destroy, store, toggle, update } from '@/routes/employer/team';
import { index } from '@/routes/employer/team';

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

const ROLE_STYLES: Record<string, string> = {
    owner: 'bg-secondary-50 text-secondary-700 border-secondary-200',
    admin_hr: 'bg-violet-50 text-violet-700 border-violet-200',
    recruiter: 'bg-blue-50 text-blue-700 border-blue-200',
    viewer: 'bg-slate-50 text-slate-600 border-slate-200',
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
    admin_hr: 'employer.team.role_desc_admin_hr',
    recruiter: 'employer.team.role_desc_recruiter',
    viewer: 'employer.team.role_desc_viewer',
};

function RoleBadge({ role }: { role: string }) {
    const { t } = useTranslate();

    const roleLabels: Record<string, string> = {
        owner: t('employer.team.role_owner'),
        admin_hr: t('employer.team.role_admin_hr'),
        recruiter: t('employer.team.role_recruiter'),
        viewer: t('employer.team.role_viewer'),
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[role] ?? 'border-slate-200 bg-slate-50 text-slate-600'}`}
        >
            {role === 'owner' && <Crown className="size-3" />}
            {role === 'admin_hr' && <ShieldCheck className="size-3" />}
            {roleLabels[role] ?? role}
        </span>
    );
}

function MemberAvatar({ name, url }: { name: string; url: string | null }) {
    if (url) {
        return (
            <img
                src={url}
                alt={name}
                className="size-9 rounded-full object-cover ring-1 ring-border"
            />
        );
    }

    return (
        <div className="flex size-9 items-center justify-center rounded-full bg-[#111827] text-sm font-semibold text-white uppercase">
            {name.charAt(0)}
        </div>
    );
}

export default function EmployerTeam({ company, members, isOwner }: TeamProps) {
    const { t } = useTranslate();
    const [addOpen, setAddOpen] = useState(false);
    const addForm = useForm({
        name: '',
        email: '',
        password: '',
        role: 'recruiter',
    });

    const activeCount = members.filter((m) => m.is_active).length;

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
            <Head title={t('employer.team.page_title')} />

            <div className="space-y-6 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <Heading
                        title={t('employer.team.page_title')}
                        description={t('employer.team.page_description', {
                            company: company.name,
                        })}
                    />
                    {isOwner && (
                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <DialogTrigger asChild>
                                <Button className="shrink-0">
                                    <Plus className="size-4" />
                                    {t('employer.team.add_member')}
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {t('employer.team.add_member_title')}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {t(
                                            'employer.team.add_member_description',
                                        )}
                                    </DialogDescription>
                                </DialogHeader>
                                <form
                                    onSubmit={submitAdd}
                                    className="space-y-4"
                                >
                                    <div className="space-y-1.5">
                                        <Label htmlFor="add-name">
                                            {t('employer.team.full_name')}
                                        </Label>
                                        <Input
                                            id="add-name"
                                            type="text"
                                            placeholder={t(
                                                'employer.team.full_name_placeholder',
                                            )}
                                            value={addForm.data.name}
                                            onChange={(e) =>
                                                addForm.setData(
                                                    'name',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={addForm.errors.name}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="add-email">
                                            {t('employer.team.email')}
                                        </Label>
                                        <Input
                                            id="add-email"
                                            type="email"
                                            placeholder={t(
                                                'employer.team.email_placeholder',
                                            )}
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
                                        <Label htmlFor="add-password">
                                            {t('employer.team.password')}
                                        </Label>
                                        <Input
                                            id="add-password"
                                            type="password"
                                            placeholder={t(
                                                'employer.team.password_placeholder',
                                            )}
                                            value={addForm.data.password}
                                            onChange={(e) =>
                                                addForm.setData(
                                                    'password',
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={addForm.errors.password}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="add-role">
                                            {t('employer.team.role')}
                                        </Label>
                                        <Select
                                            value={addForm.data.role}
                                            onValueChange={(v) =>
                                                addForm.setData('role', v)
                                            }
                                        >
                                            <SelectTrigger id="add-role">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="admin_hr">
                                                    {t(
                                                        'employer.team.role_admin_hr_option',
                                                    )}
                                                </SelectItem>
                                                <SelectItem value="recruiter">
                                                    {t(
                                                        'employer.team.role_recruiter_option',
                                                    )}
                                                </SelectItem>
                                                <SelectItem value="viewer">
                                                    {t(
                                                        'employer.team.role_viewer_option',
                                                    )}
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
                                            {t('employer.team.add')}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>

                {/* Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard
                        icon={Users}
                        label={t('employer.team.total_members')}
                        value={members.length}
                        tone="slate"
                    />
                    <StatCard
                        icon={UserCheck}
                        label={t('employer.team.active_members')}
                        value={activeCount}
                        tone="green"
                    />
                    <StatCard
                        icon={UserMinus}
                        label={t('employer.team.inactive_members')}
                        value={members.length - activeCount}
                        tone="red"
                    />
                </div>

                {/* Member table */}
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {t('employer.team.members_title')}
                        </CardTitle>
                        <CardDescription>
                            {t('employer.team.members_summary', {
                                total: members.length,
                                active: activeCount,
                            })}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {members.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-12 text-center">
                                <div className="flex size-12 items-center justify-center rounded-lg bg-[#f8fafc] text-[#64748b]">
                                    <Users className="size-6" />
                                </div>
                                <p className="font-medium">
                                    {t('employer.team.empty_title')}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t('employer.team.empty_description')}
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table className="min-w-160">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-70">
                                                {t('employer.team.member')}
                                            </TableHead>
                                            <TableHead>
                                                {t('employer.team.role')}
                                            </TableHead>
                                            <TableHead>
                                                {t('employer.team.status')}
                                            </TableHead>
                                            <TableHead>
                                                {t('employer.team.joined')}
                                            </TableHead>
                                            {isOwner && (
                                                <TableHead className="w-12" />
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {members.map((member) => (
                                            <MemberRow
                                                key={member.id}
                                                member={member}
                                                isOwner={isOwner}
                                                currentOwnerId={
                                                    company.owner_id
                                                }
                                            />
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Role guide */}
                <Card className="border-dashed bg-muted/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">
                            {t('employer.team.role_guide')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {t('employer.team.role_guide_description')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {(['admin_hr', 'recruiter', 'viewer'] as const).map(
                                (role) => (
                                    <div
                                        key={role}
                                        className="flex flex-col gap-2 rounded-lg border bg-white p-3"
                                    >
                                        <RoleBadge role={role} />
                                        <p className="text-xs text-muted-foreground">
                                            {t(ROLE_DESCRIPTIONS[role])}
                                        </p>
                                    </div>
                                ),
                            )}
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
    const { t } = useTranslate();
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
        if (
            !confirm(t('employer.team.delete_confirm', { name: member.name }))
        ) {
            return;
        }

        roleForm.delete(destroy({ teamMember: member.id }).url);
    }

    return (
        <TableRow className={!member.is_active ? 'opacity-60' : undefined}>
            {/* Member */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <MemberAvatar name={member.name} url={member.avatar_url} />
                    <div className="min-w-0">
                        <p className="truncate text-sm leading-tight font-medium">
                            {member.name}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                            {member.email}
                        </p>
                    </div>
                </div>
            </TableCell>

            {/* Role */}
            <TableCell>
                <RoleBadge role={isThisOwner ? 'owner' : member.role} />
            </TableCell>

            {/* Status */}
            <TableCell>
                {member.is_active ? (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                        {t('employer.team.active')}
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                        <span className="size-1.5 rounded-full bg-red-400" />
                        {t('employer.team.inactive')}
                    </span>
                )}
            </TableCell>

            {/* Joined */}
            <TableCell>
                <span className="text-sm text-muted-foreground">
                    {member.joined_at}
                </span>
            </TableCell>

            {/* Actions */}
            {isOwner && (
                <TableCell>
                    {!isThisOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-8"
                                >
                                    <span className="sr-only">
                                        {t('employer.team.actions')}
                                    </span>
                                    <svg
                                        className="size-4"
                                        fill="currentColor"
                                        viewBox="0 0 16 16"
                                    >
                                        <circle cx="8" cy="3" r="1.5" />
                                        <circle cx="8" cy="8" r="1.5" />
                                        <circle cx="8" cy="13" r="1.5" />
                                    </svg>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <Dialog
                                    open={roleOpen}
                                    onOpenChange={setRoleOpen}
                                >
                                    <DialogTrigger asChild>
                                        <DropdownMenuItem
                                            onSelect={(e) => e.preventDefault()}
                                        >
                                            {t('employer.team.change_role')}
                                        </DropdownMenuItem>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>
                                                {t(
                                                    'employer.team.change_role_title',
                                                )}{' '}
                                                <span className="font-semibold">
                                                    {member.name}
                                                </span>
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
                                                        {t(
                                                            'employer.team.role_admin_hr_option',
                                                        )}
                                                    </SelectItem>
                                                    <SelectItem value="recruiter">
                                                        {t(
                                                            'employer.team.role_recruiter_option',
                                                        )}
                                                    </SelectItem>
                                                    <SelectItem value="viewer">
                                                        {t(
                                                            'employer.team.role_viewer_option',
                                                        )}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <DialogFooter>
                                                <Button
                                                    type="submit"
                                                    disabled={
                                                        roleForm.processing
                                                    }
                                                >
                                                    {t('employer.team.save')}
                                                </Button>
                                            </DialogFooter>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                <DropdownMenuItem onSelect={handleToggle}>
                                    {member.is_active
                                        ? t('employer.team.deactivate_access')
                                        : t('employer.team.activate_access')}
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onSelect={handleDelete}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    {t('employer.team.remove_from_team')}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </TableCell>
            )}
        </TableRow>
    );
}

function StatCard({
    icon: Icon,
    label,
    value,
    tone,
}: {
    icon: typeof Users;
    label: string;
    value: number;
    tone: 'green' | 'red' | 'slate';
}) {
    const tones = {
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-500',
        slate: 'bg-slate-100 text-slate-600',
    };

    return (
        <div className="rounded-lg border bg-white p-4 shadow-sm">
            <div
                className={`mb-3 flex size-9 items-center justify-center rounded-lg ${tones[tone]}`}
            >
                <Icon className="size-4" />
            </div>
            <p className="text-2xl font-semibold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
        </div>
    );
}

EmployerTeam.layout = {
    breadcrumbs: [
        {
            title: 'Tim',
            href: index(),
        },
    ],
};
