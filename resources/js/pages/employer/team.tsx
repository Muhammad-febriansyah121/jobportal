import { Head, useForm } from '@inertiajs/react';
import {
    Crown,
    Mail,
    MoreVertical,
    Plus,
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useTranslate } from '@/hooks/use-translate';
import { destroy, index, store, toggle } from '@/routes/employer/team';

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

function MemberAvatar({ name, url }: { name: string; url: string | null }) {
    if (url) {
        return (
            <img
                src={url}
                alt={name}
                className="size-10 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
        );
    }

    return (
        <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-[#0F4C94] text-sm font-bold text-white uppercase shadow-sm ring-2 ring-white">
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
                                            <TableHead>
                                                {t('employer.team.member')}
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

                {/* Info banner */}
                <Card className="border-dashed bg-gradient-to-br from-primary/5 to-transparent">
                    <CardContent className="flex items-start gap-3 py-4">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Users className="size-4" />
                        </div>
                        <div className="space-y-1">
                            <p className="text-sm font-semibold">
                                {t('employer.team.access_info_title')}
                            </p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                {t('employer.team.access_info_description')}
                            </p>
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
    const form = useForm({});

    const isThisOwner = member.user_id === currentOwnerId;

    function handleToggle() {
        form.patch(toggle({ teamMember: member.id }).url);
    }

    function handleDelete() {
        if (
            !confirm(t('employer.team.delete_confirm', { name: member.name }))
        ) {
            return;
        }

        form.delete(destroy({ teamMember: member.id }).url);
    }

    return (
        <TableRow className={!member.is_active ? 'opacity-60' : undefined}>
            {/* Member */}
            <TableCell>
                <div className="flex items-center gap-3">
                    <MemberAvatar name={member.name} url={member.avatar_url} />
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm leading-tight font-semibold">
                                {member.name}
                            </p>
                            {isThisOwner && (
                                <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
                                    <Crown className="size-3" />
                                    {t('employer.team.role_owner')}
                                </span>
                            )}
                        </div>
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                            <Mail className="size-3 shrink-0" />
                            {member.email}
                        </p>
                    </div>
                </div>
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
                <TableCell className="text-right">
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
                                    <MoreVertical className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
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
