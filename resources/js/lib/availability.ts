type TranslateFn = (key: string, replacements?: Record<string, string | number>) => string;

const AVAILABILITY_LABEL_KEYS: Record<string, string> = {
    none: 'candidate.profile.availability_none',
    lt_1_month: 'candidate.profile.availability_lt_1_month',
    '1_month': 'candidate.profile.availability_1_month',
    '2_months': 'candidate.profile.availability_2_months',
    gt_2_months: 'candidate.profile.availability_gt_2_months',
};

export function formatAvailability(
    value: string | null | undefined,
    t: TranslateFn,
): string {
    if (!value) {
        return '-';
    }

    const key = AVAILABILITY_LABEL_KEYS[value];

    return key ? t(key) : value;
}
