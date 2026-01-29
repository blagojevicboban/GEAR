import React, { useRef, useEffect } from 'react';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Heading1,
    Heading2,
    Quote,
    Code,
    Undo,
    Redo,
} from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    onPaste?: (e: React.ClipboardEvent) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    value,
    onChange,
    placeholder,
    onPaste,
}) => {
    const editorRef = useRef<HTMLDivElement>(null);

    // Initial render sync
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            // Only update if significantly different to avoid cursor jumps
            // But for initial load it's needed. For typing, we rely on onInput.
            // A simple check: if empty and value exists, or if value is totally different.
            // Risk: Cursor resets on external update.
            // Strategy: Only set innerHTML on mount or if value changes externally (not from user typing ideally).
            // For now, simple implementation: set content if focused is false?
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const execCmd = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        if (editorRef.current) editorRef.current.focus();
    };

    return (
        <div className="flex flex-col bg-slate-950/50 border border-slate-700 rounded-lg overflow-hidden focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-slate-700">
                <ToolbarButton
                    onClick={() => execCmd('undo')}
                    icon={<Undo size={16} />}
                    title="Undo"
                />
                <ToolbarButton
                    onClick={() => execCmd('redo')}
                    icon={<Redo size={16} />}
                    title="Redo"
                />
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <ToolbarButton
                    onClick={() => execCmd('bold')}
                    icon={<Bold size={16} />}
                    title="Bold"
                />
                <ToolbarButton
                    onClick={() => execCmd('italic')}
                    icon={<Italic size={16} />}
                    title="Italic"
                />
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <ToolbarButton
                    onClick={() => execCmd('formatBlock', 'H2')}
                    icon={<Heading1 size={16} />}
                    title="Header 1"
                />
                <ToolbarButton
                    onClick={() => execCmd('formatBlock', 'H3')}
                    icon={<Heading2 size={16} />}
                    title="Header 2"
                />
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <ToolbarButton
                    onClick={() => execCmd('insertUnorderedList')}
                    icon={<List size={16} />}
                    title="Bullet List"
                />
                <ToolbarButton
                    onClick={() => execCmd('insertOrderedList')}
                    icon={<ListOrdered size={16} />}
                    title="Numbered List"
                />
                <div className="w-px h-4 bg-slate-700 mx-1" />
                <ToolbarButton
                    onClick={() => execCmd('formatBlock', 'BLOCKQUOTE')}
                    icon={<Quote size={16} />}
                    title="Quote"
                />
                <ToolbarButton
                    onClick={() => execCmd('formatBlock', 'PRE')}
                    icon={<Code size={16} />}
                    title="Code Block"
                />
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                className="flex-1 p-4 min-h-[200px] outline-none text-slate-300 prose prose-invert max-w-none text-sm overflow-y-auto"
                contentEditable
                onInput={handleInput}
                onPaste={onPaste}
                role="textbox"
                aria-multiline="true"
                data-placeholder={placeholder}
            />
            <style>{`
                [contentEditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #64748b;
                    cursor: text;
                }
            `}</style>
        </div>
    );
};

const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
}> = ({ onClick, icon, title }) => (
    <button
        onMouseDown={(e) => {
            e.preventDefault(); // Prevent focus loss
            onClick();
        }}
        title={title}
        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        type="button"
    >
        {icon}
    </button>
);

export default RichTextEditor;
