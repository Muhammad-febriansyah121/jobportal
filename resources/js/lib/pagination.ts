export type PaginationNavLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export function isPreviousPaginationLabel(label: string): boolean {
    return /laquo|previous|sebelumnya/i.test(label);
}

export function isNextPaginationLabel(label: string): boolean {
    return /raquo|next|berikutnya|selanjutnya/i.test(label);
}

export function cleanPaginationLabel(label: string): string {
    if (isPreviousPaginationLabel(label)) {
        return 'Sebelumnya';
    }

    if (isNextPaginationLabel(label)) {
        return 'Berikutnya';
    }

    return decodePaginationLabel(label);
}

export function shouldRenderPagination(links: PaginationNavLink[]): boolean {
    if (links.length === 0) {
        return false;
    }

    const pageLinks = links.filter(
        (link) =>
            !isPreviousPaginationLabel(link.label) &&
            !isNextPaginationLabel(link.label),
    );

    if (pageLinks.length > 1) {
        return true;
    }

    return links.some((link) => link.url !== null && !link.active);
}

function decodePaginationLabel(label: string): string {
    return label
        .replace('&laquo;', '')
        .replace('&raquo;', '')
        .replace(/<[^>]+>/g, '')
        .replace('pagination.previous', 'Sebelumnya')
        .replace('pagination.next', 'Berikutnya')
        .trim();
}
