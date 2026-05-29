'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Typography from '@tiptap/extension-typography';

import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, ImagePlus,
  List, ListOrdered, Quote, Code, Minus,
  Link as LinkIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Undo, Redo, Pilcrow,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEffect, useCallback, useRef } from 'react';

interface TipTapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  minHeight?: string;
}

// Heading levels config
const HEADING_LEVELS = [
  { level: 1, label: 'Heading 1', className: 'text-2xl font-bold' },
  { level: 2, label: 'Heading 2', className: 'text-xl font-bold' },
  { level: 3, label: 'Heading 3', className: 'text-lg font-semibold' },
  { level: 4, label: 'Heading 4', className: 'text-base font-semibold' },
  { level: 5, label: 'Heading 5', className: 'text-sm font-semibold' },
  { level: 6, label: 'Heading 6', className: 'text-xs font-semibold uppercase tracking-wide' },
] as const;

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing here…',
  editable = true,
  minHeight = '220px',
}: TipTapEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4, 5, 6] },
        bulletList: {
          HTMLAttributes: { class: 'list-disc pl-6 space-y-1' },
        },
        orderedList: {
          HTMLAttributes: { class: 'list-decimal pl-6 space-y-1' },
        },
        blockquote: {
          HTMLAttributes: {
            class: 'border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-4',
          },
        },
        code: {
          HTMLAttributes: {
            class: 'bg-muted rounded px-1.5 py-0.5 font-mono text-sm text-primary',
          },
        },
        codeBlock: {
          HTMLAttributes: {
            class: 'bg-muted rounded-lg p-4 font-mono text-sm overflow-x-auto my-4',
          },
        },
        horizontalRule: {
          HTMLAttributes: { class: 'border-border my-6' },
        },
      }),
      Underline,
      Typography, // smart quotes, em-dashes, ellipsis, etc.
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline underline-offset-2 hover:text-primary/80 transition-colors',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.extend({
        draggable: true,
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: '50%',
              renderHTML: attributes => ({
                style: `width: ${attributes.width}; height: auto;`,
              }),
            },
          };
        },
      }).configure({
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg border border-border shadow-sm max-w-full my-2 inline-block mx-1 align-middle cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-primary/50 transition-all',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({
        placeholder,
        showOnlyWhenEditable: true,
      }),
    ],
    content,
    editable,
    editorProps: {
      attributes: {
        class: [
          'prose prose-sm sm:prose-base dark:prose-invert max-w-none focus:outline-none',
          'px-5 py-4 bg-background',
          // Heading styles injected via prose + custom overrides below
          '[&_h1]:text-3xl [&_h1]:font-extrabold [&_h1]:tracking-tight [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-foreground',
          '[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h2]:mt-5 [&_h2]:mb-2.5 [&_h2]:text-foreground',
          '[&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-foreground',
          '[&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1.5 [&_h4]:text-foreground',
          '[&_h5]:text-base [&_h5]:font-semibold [&_h5]:mt-3 [&_h5]:mb-1 [&_h5]:text-foreground',
          '[&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-widest [&_h6]:mt-3 [&_h6]:mb-1 [&_h6]:text-muted-foreground',
          '[&_p]:leading-7 [&_p]:my-2',
          '[&_a]:text-primary [&_a]:underline',
          '[&_hr]:border-border',
          // Helper to make horizontal dragging easier to see
          '[&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-primary',
        ].join(' '),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
  });

  // Sync external content (e.g. when edit modal opens with existing data)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (content !== current) {
      editor.commands.setContent(content || '', { emitUpdate: false });
    }
  }, [editor, content]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const prev = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter URL:', prev);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

const addImage = useCallback(() => {
  fileInputRef.current?.click();
}, []);

const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
  if (!editor) return;
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    const base64 = reader.result as string;
    editor.chain().focus().setImage({ src: base64 }).run();
  };
  reader.readAsDataURL(file);

  // Reset so the same file can be picked again
  e.target.value = '';
}, [editor]);

  if (!editor) {
    return (
      <div
        className="border rounded-md flex items-center justify-center text-muted-foreground text-sm"
        style={{ minHeight }}
      >
        <span className="w-4 h-4 rounded-full border-2 border-primary/20 border-t-primary animate-spin mr-2" />
        Loading editor…
      </div>
    );
  }

  // Which heading is active (for dropdown label)
  const activeHeading = HEADING_LEVELS.find(h => editor.isActive('heading', { level: h.level }));
  const headingLabel = activeHeading?.label ?? 'Paragraph';

  const TB = ({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    title?: string;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`h-7 w-7 p-0 rounded transition-colors ${
        isActive
          ? 'bg-primary/15 text-primary hover:bg-primary/20'
          : 'text-foreground/70 hover:bg-muted hover:text-foreground'
      }`}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-background shadow-sm">

      {editable && (
        <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-border bg-muted/40">

          {/* ── Heading / Paragraph dropdown ── */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-medium min-w-[100px] justify-between gap-1 text-foreground/80 hover:bg-muted"
              >
                {headingLabel}
                <span className="text-muted-foreground">▾</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={`flex items-center gap-2 ${!editor.isActive('heading') ? 'bg-primary/10 text-primary' : ''}`}
              >
                <Pilcrow className="w-4 h-4" />
                <span className="text-sm">Paragraph</span>
              </DropdownMenuItem>
              {HEADING_LEVELS.map(({ level, label, className }) => (
                <DropdownMenuItem
                  key={level}
                  onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
                  className={`flex items-center gap-2 ${editor.isActive('heading', { level }) ? 'bg-primary/10 text-primary' : ''}`}
                >
                  <span className="w-6 text-center text-xs font-bold text-muted-foreground">H{level}</span>
                  <span className={className}>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* ── Text formatting ── */}
          <TB onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)">
            <Bold className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)">
            <Italic className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)">
            <UnderlineIcon className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} title="Strikethrough">
            <Strikethrough className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleCode().run()} isActive={editor.isActive('code')} title="Inline code">
            <Code className="w-3.5 h-3.5" />
          </TB>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* ── Lists ── */}
          <TB onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} title="Bullet list">
            <List className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} title="Numbered list">
            <ListOrdered className="w-3.5 h-3.5" />
          </TB>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* ── Blocks ── */}
          <TB onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} title="Blockquote">
            <Quote className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} title="Code block">
            <Code className="w-3.5 h-3.5 opacity-70" />
          </TB>
          <TB onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
            <Minus className="w-3.5 h-3.5" />
          </TB>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* ── Link ── */}
          <TB onClick={setLink} isActive={editor.isActive('link')} title="Insert link">
            <LinkIcon className="w-3.5 h-3.5" />
          </TB>

          {/* ── Image ── */}
          <TB onClick={addImage} title="Insert image">
            <ImagePlus className="w-3.5 h-3.5" />
          </TB>

          {/* ── Image Resizing ── */}
          {editor.isActive('image') && (
            <>
              <Separator orientation="vertical" className="h-5 mx-1" />
              <TB onClick={() => editor.chain().focus().updateAttributes('image', { width: '25%' }).run()} title="Small (25%)">
                <span className="text-[10px] font-bold">25%</span>
              </TB>
              <TB onClick={() => editor.chain().focus().updateAttributes('image', { width: '50%' }).run()} title="Medium (50%)">
                <span className="text-[10px] font-bold">50%</span>
              </TB>
              <TB onClick={() => editor.chain().focus().updateAttributes('image', { width: '100%' }).run()} title="Full (100%)">
                <span className="text-[10px] font-bold">100%</span>
              </TB>
            </>
          )}

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* ── Alignment ── */}
          <TB onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} title="Align left">
            <AlignLeft className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} title="Align center">
            <AlignCenter className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} title="Align right">
            <AlignRight className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} title="Justify">
            <AlignJustify className="w-3.5 h-3.5" />
          </TB>

          <Separator orientation="vertical" className="h-5 mx-1" />

          {/* ── History ── */}
          <TB onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo (Ctrl+Z)">
            <Undo className="w-3.5 h-3.5" />
          </TB>
          <TB onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo (Ctrl+Y)">
            <Redo className="w-3.5 h-3.5" />
          </TB>
        </div>
      )}

      {/* ── Editor area ── */}
      <div style={{ minHeight }}>
        <EditorContent editor={editor} />
      </div>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleImageUpload}
      />

      {/* ── Status bar ── */}
      {editable && (
        <div className="flex items-center justify-between px-4 py-1.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground">
          <span>
            {editor.storage?.characterCount?.characters?.() ?? editor.getText().length} chars
            {' · '}
            {editor.getText().trim().split(/\s+/).filter(Boolean).length} words
          </span>
          <span className="opacity-60">
            {activeHeading ? activeHeading.label : 'Paragraph'}
          </span>
        </div>
      )}
    </div>
  );
}
