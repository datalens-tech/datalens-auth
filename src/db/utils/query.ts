export function escapeStringForLike(str: string) {
    return str.replace(/[%_]/g, '\\$&');
}
