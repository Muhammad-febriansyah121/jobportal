export type AdminOption = {
    value: string;
    label: string;
    parent?: string;
};

export type AdminField = {
    name: string;
    label: string;
    type:
        | 'cascading-select'
        | 'checkbox'
        | 'currency'
        | 'date'
        | 'file'
        | 'number'
        | 'search'
        | 'select'
        | 'textarea'
        | 'text';
    value?: boolean | number | string | null;
    options?: AdminOption[];
    placeholder?: string;
    required?: boolean;
    min?: number;
    max?: number;
    dependsOn?: string;
};

export type AdminAction = {
    label: string;
    href: string;
    icon: string;
    method?: 'delete' | 'get' | 'patch' | 'post' | 'put';
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'success' | 'violet' | 'warning';
    confirmTitle?: string;
    confirmDescription?: string;
    fields?: AdminField[];
    external?: boolean;
};

export type AdminColumn = {
    key: string;
    label: string;
};

export type AdminBadgeCell = {
    label: string;
    tone?: 'danger' | 'neutral' | 'success' | 'warning';
};

export type AdminImageCell = {
    type: 'image';
    src?: string | null;
    alt?: string | null;
};

export type AdminLinkCell = {
    type: 'link';
    href: string;
    label: string;
};

export type AdminCell =
    | AdminBadgeCell
    | AdminImageCell
    | AdminLinkCell
    | boolean
    | number
    | string
    | null;

export type AdminRow = {
    id: number | string;
    actions?: AdminAction[];
    [key: string]: AdminCell | AdminAction[] | number | string | undefined;
};

export type AdminPaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type AdminPaginatedRows = {
    data: AdminRow[];
    links?: AdminPaginationLink[];
    from?: number;
    to?: number;
    total?: number;
};

export type AdminSection = {
    title: string;
    items: Array<{
        label: string;
        value: boolean | number | string | null;
    }>;
};

export type AdminRelatedTable = {
    title: string;
    columns: AdminColumn[];
    rows: AdminRow[];
};

export type AdminAiSummary = {
    summary: string | null;
    generated_at: string;
};
