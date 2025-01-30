import {raw} from 'objection';

export function escapeStringForLike(str: string) {
    return str.replace(/[%_]/g, '\\$&');
}

export function getNextPageToken({
    page,
    pageSize,
    curPage,
}: {
    page: number;
    pageSize: number;
    curPage: unknown[];
}) {
    let nextPageToken;

    if (page >= 0 && curPage.length === pageSize) {
        nextPageToken = String(page + 1);
    }

    return nextPageToken;
}

export function searchSubstring({column, search}: {column: string; search: string}) {
    const filter = `%${escapeStringForLike(search.toLowerCase())}%`;
    return raw('LOWER(??) like ?', [column, filter]);
}

export function lowerEqual({column, value}: {column: string; value: string}) {
    const lowerValue = value.toLowerCase();
    return raw('LOWER(??) = ?', [column, lowerValue]);
}
