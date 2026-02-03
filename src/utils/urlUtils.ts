export const fixAssetUrl = (url: string | undefined | null): string => {
    if (!url) return '';
    // If it's a data URL or absolute URL (http/https), return as is
    if (url.startsWith('data:') || url.startsWith('http')) return url;

    // If it starts with /uploads, prepend /api (or replace if you want to force it)
    // But wait, if we are running locally on port 3001, /uploads works.
    // If we are on prod, /uploads fails, /api/uploads works.
    // Since we added /api/uploads alias in server/index.js, /api/uploads works LOCALLY too.
    // So we should safely rewrite ALL /uploads to /api/uploads.

    if (url.startsWith('/uploads/')) {
        return '/api' + url;
    }

    // If it starts with /api/uploads, return as is
    if (url.startsWith('/api/uploads/')) return url;

    // If it doesn't start with a slash, it's likely a relative path/filename in uploads
    if (!url.startsWith('/')) {
        return '/api/uploads/' + url;
    }

    return url;
};
