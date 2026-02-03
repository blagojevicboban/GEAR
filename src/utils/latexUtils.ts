import katex from 'katex';

/**
 * Parses a string and replaces LaTeX patterns ($...$ and $$...$$) with rendered HTML.
 * @param html The HTML string usually from a rich text editor.
 * @returns HTML string with rendered Math.
 */
export const renderLatexInHtml = (html: string): string => {
    if (!html) return '';

    // We need to be careful not to break HTML tags.
    // A simple regex might replace '$' inside attributes.
    // However, for typical rich text content <p>text</p>, it is usually fine step-wise.

    // Better approach: regex that avoids HTML tags?
    // Or just simple regex for $...$ assuming user won't put $ inside tags for now.
    // Standard delimiters:
    // $$...$$ for display math
    // $...$ for inline math

    // Replace display math first
    // Note: [\s\S]*? to match across lines if needed, but usually display math might be one line.
    // Katex needs plain text. HTML entities might be an issue (e.g. &lt; instead of <).
    // But usually contentEditable gives raw chars for symbols unless escaped.

    // Function to render
    const render = (tex: string, displayMode: boolean) => {
        try {
            return katex.renderToString(tex, {
                displayMode,
                throwOnError: false,
            });
        } catch (e) {
            console.error(e);
            return '<span class="text-red-500">Latex Error</span>';
        }
    };

    let processed = html;

    // Display Math: $$...$$
    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (_, tex) => {
        // Unescape common HTML entities if necessary?
        // Usually, the editor might produce &nbsp; or encoded chars.
        // For now, assume pure string logic.
        return render(tex, true);
    });

    // Inline Math: $...$
    // We should avoid matching $ in price $100. So we usually require $...$ to not have space at inner edges?
    // Or just simplistic $...$.
    // Let's use simplistic but ensure it's not empty.
    processed = processed.replace(/\$([^\$\n]+?)\$/g, (_, tex) => {
        // If it starts with a space and ends with a space, maybe it is just text?
        // LaTeX usually discourages $ math $ (spaces).
        // But users might type it.
        return render(tex, false);
    });

    return processed;
};
