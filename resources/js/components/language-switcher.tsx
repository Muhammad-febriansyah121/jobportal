import { router } from '@inertiajs/react';
import { Check } from 'lucide-react';
import { useState } from 'react';
import { update as updateLocale } from '@/actions/App/Http/Controllers/LocaleController';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTranslate } from '@/hooks/use-translate';
import { cn } from '@/lib/utils';

type LocaleOption = {
    code: string;
    label: string;
    flag: string;
};

const LOCALE_OPTIONS: LocaleOption[] = [
    { code: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
];

type Props = {
    align?: 'start' | 'center' | 'end';
    variant?: 'icon' | 'inline';
    triggerClassName?: string;
};

export function LanguageSwitcher({
    align = 'end',
    variant = 'icon',
    triggerClassName,
}: Props) {
    const { locale, t } = useTranslate();
    const [pending, setPending] = useState(false);

    const current =
        LOCALE_OPTIONS.find((option) => option.code === locale) ??
        LOCALE_OPTIONS[0];

    const handleSelect = (code: string) => {
        if (code === locale || pending) {
            return;
        }
        setPending(true);
        const action = updateLocale();
        router.visit(action.url, {
            method: action.method,
            data: { locale: code },
            preserveScroll: true,
            onFinish: () => setPending(false),
        });
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size={variant === 'icon' ? 'icon' : 'sm'}
                    aria-label={t('language.label')}
                    disabled={pending}
                    className={cn(
                        variant === 'icon'
                            ? 'h-9 w-9 cursor-pointer'
                            : 'h-9 cursor-pointer gap-2 px-3',
                        triggerClassName,
                    )}
                >
                    <span className="text-base leading-none" aria-hidden>
                        {current.flag}
                    </span>
                    {variant === 'inline' ? (
                        <span className="text-sm font-semibold uppercase">
                            {current.code}
                        </span>
                    ) : null}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={align} className="w-44">
                {LOCALE_OPTIONS.map((option) => {
                    const isActive = option.code === locale;
                    return (
                        <DropdownMenuItem
                            key={option.code}
                            onSelect={() => handleSelect(option.code)}
                            className="cursor-pointer"
                        >
                            <span
                                className="mr-2 text-base leading-none"
                                aria-hidden
                            >
                                {option.flag}
                            </span>
                            <span className="flex-1 text-sm">
                                {option.label}
                            </span>
                            {isActive ? (
                                <Check className="ml-2 size-4 text-primary" />
                            ) : null}
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
