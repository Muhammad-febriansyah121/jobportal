import { usePage } from '@inertiajs/react';
import { useCallback, useMemo } from 'react';

type Replacements = Record<string, string | number>;

type TranslateFn = (key: string, replacements?: Replacements) => string;

type UseTranslateResult = {
    t: TranslateFn;
    locale: string;
    availableLocales: string[];
};

function applyReplacements(value: string, replacements?: Replacements): string {
    if (!replacements) {
        return value;
    }

    return Object.keys(replacements).reduce((acc, key) => {
        const replacement = String(replacements[key]);
        return acc
            .replaceAll(`:${key}`, replacement)
            .replaceAll(`{${key}}`, replacement);
    }, value);
}

export function useTranslate(): UseTranslateResult {
    const page = usePage();
    const props = page.props as {
        translations?: Record<string, string>;
        locale?: string;
        available_locales?: string[];
    };

    const translations = props.translations ?? {};
    const locale = props.locale ?? 'id';
    const availableLocales = props.available_locales ?? ['id', 'en'];

    const t = useCallback<TranslateFn>(
        (key, replacements) => {
            const value = translations[key];
            if (typeof value === 'string') {
                return applyReplacements(value, replacements);
            }
            return applyReplacements(key, replacements);
        },
        [translations],
    );

    return useMemo(
        () => ({ t, locale, availableLocales }),
        [t, locale, availableLocales],
    );
}
