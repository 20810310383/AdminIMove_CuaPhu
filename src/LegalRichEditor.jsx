import React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Heading2, Heading3, Pilcrow, Link2, Undo2, Redo2, RemoveFormatting, Quote, AlignLeft, AlignCenter, AlignRight, Palette } from 'lucide-react';

// Backend accepts only this structured document, not raw HTML; edited content
// is normalized using an allow-list before being sent across the network.
const ALLOWED = new Set(['paragraph', 'h2', 'h3', 'bullet', 'number', 'quote']);
const ALIGNS = new Set(['left', 'center', 'right', 'justify']);
const safeColor = (s) => {
  const value = String(s || '').trim();
  if (/^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  const match = value.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
  if (match && match.slice(1).every((v) => Number(v) <= 255)) return `#${match.slice(1).map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`;
  return '';
};
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeLink = (s) => {
  try {
    const uri = new URL(String(s || '').trim());
    return ['https:', 'http:'].includes(uri.protocol) ? uri.href : '';
  } catch { return ''; }
};
export function plainDocument(blocks = []) {
  return (Array.isArray(blocks) ? blocks : []).map((b) => (b.runs || []).map((r) => r.text || '').join('')).join('\n');
}
export function richToHtml(blocks = []) {
  const output = [];
  for (const block of (Array.isArray(blocks) ? blocks : [])) {
    if (!ALLOWED.has(block?.type)) continue;
    const inline = (block.runs || []).map((r) => {
      let content = escapeHtml(r.text).replace(/\n/g, '<br>');
      if (r.bold) content = `<strong>${content}</strong>`;
      if (r.italic) content = `<em>${content}</em>`;
      if (r.underline) content = `<u>${content}</u>`;
      const color = safeColor(r.color);
      if (color) content = `<span style=\"color:${color}\">${content}</span>`;
      const href = safeLink(r.href);
      if (href) content = `<a href="${escapeHtml(href)}">${content}</a>`;
      return content;
    }).join('') || '<br>';
    const kind = block.type;
    const align = ALIGNS.has(block.align) ? block.align : 'left';
    const alignAttr = align === 'left' ? '' : ` style=\"text-align:${align}\"`;
    if (kind === 'bullet' || kind === 'number') {
      const list = kind === 'bullet' ? 'ul' : 'ol';
      const last = output[output.length - 1];
      if (last && last.kind === kind && last.align === align) last.items.push(`<li${alignAttr}>${inline}</li>`);
      else output.push({ kind, align, items: [`<li${alignAttr}>${inline}</li>`], list });
    } else {
      const tag = kind === 'paragraph' ? 'p' : kind === 'quote' ? 'blockquote' : kind;
      output.push({ kind, html: `<${tag}${alignAttr}>${inline}</${tag}>` });
    }
  }
  return output.map((o) => o.items ? `<${o.list}>${o.items.join('')}</${o.list}>` : o.html).join('') || '<p><br></p>';
}

function runsFromNode(node, marks = {}, result = []) {
  if (node.nodeType === 3) {
    const text = node.nodeValue || '';
    if (text) result.push({ text, ...marks });
    return result;
  }
  if (node.nodeType !== 1) return result;
  const tag = node.tagName.toLowerCase();
  if (['script', 'style', 'iframe', 'object', 'svg', 'img', 'input', 'video'].includes(tag)) return result;
  if (tag === 'br') {
    result.push({ text: '\n', ...marks });
    return result;
  }
  const next = { ...marks };
  if (['b', 'strong'].includes(tag) || /(?:bold|[6-9]00)/i.test(node.style?.fontWeight || '')) next.bold = true;
  if (['em', 'i'].includes(tag) || node.style?.fontStyle === 'italic') next.italic = true;
  if (tag === 'u' || (node.style?.textDecoration || '').includes('underline')) next.underline = true;
  const color = safeColor(node.style?.color || node.getAttribute('color'));
  if (color) next.color = color;
  if (tag === 'a') {
    const href = safeLink(node.getAttribute('href'));
    if (href) next.href = href;
  }
  [...node.childNodes].forEach((child) => runsFromNode(child, next, result));
  return result;
}
function toBlock(node, type) {
  const runs = runsFromNode(node).filter((r) => r.text.length > 0);
  const align = String(node.style?.textAlign || node.getAttribute('align') || '').toLowerCase();
  return runs.length ? [{ type, runs, ...(ALIGNS.has(align) && align !== 'left' ? { align } : {}) }] : [];
}
export function editorToRich(root) {
  const blocks = [];
  if (!root) return blocks;
  const visit = (node) => {
    if (node.nodeType === 3) {
      const text = node.nodeValue?.trim();
      if (text) blocks.push({ type: 'paragraph', runs: [{ text }] });
      return;
    }
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (['script', 'style', 'svg', 'iframe', 'object'].includes(tag)) return;
    if (tag === 'ul' || tag === 'ol') {
      [...node.children].filter((el) => el.tagName.toLowerCase() === 'li').forEach((li) => blocks.push(...toBlock(li, tag === 'ul' ? 'bullet' : 'number')));
    } else if (tag === 'h1' || tag === 'h2') blocks.push(...toBlock(node, 'h2'));
    else if (tag === 'h3') blocks.push(...toBlock(node, 'h3'));
    else if (tag === 'blockquote') blocks.push(...toBlock(node, 'quote'));
    else if (['p', 'div', 'li'].includes(tag)) {
      if ([...node.children].some((el) => ['UL', 'OL', 'P', 'DIV', 'H1', 'H2', 'H3'].includes(el.tagName))) {
        [...node.childNodes].forEach(visit);
      } else blocks.push(...toBlock(node, 'paragraph'));
    } else blocks.push(...toBlock(node, 'paragraph'));
  };
  [...root.childNodes].forEach(visit);
  return blocks.slice(0, 400);
}

const TOOLS = [
  { name: 'Đậm', icon: Bold, cmd: 'bold' },
  { name: 'Nghiêng', icon: Italic, cmd: 'italic' },
  { name: 'Gạch chân', icon: Underline, cmd: 'underline' },
  { name: 'Đoạn văn', icon: Pilcrow, cmd: 'formatBlock', value: 'p' },
  { name: 'Tiêu đề lớn', icon: Heading2, cmd: 'formatBlock', value: 'h2' },
  { name: 'Tiêu đề nhỏ', icon: Heading3, cmd: 'formatBlock', value: 'h3' },
  { name: 'Danh sách', icon: List, cmd: 'insertUnorderedList' },
  { name: 'Đánh số', icon: ListOrdered, cmd: 'insertOrderedList' },
  { name: 'Trích dẫn', icon: Quote, cmd: 'formatBlock', value: 'blockquote' },
  { name: 'Căn trái', icon: AlignLeft, cmd: 'justifyLeft' },
  { name: 'Căn giữa', icon: AlignCenter, cmd: 'justifyCenter' },
  { name: 'Căn phải', icon: AlignRight, cmd: 'justifyRight' },
  { name: 'Chữ đỏ', icon: Palette, cmd: 'foreColor', value: '#e71939' },
  { name: 'Liên kết', icon: Link2, cmd: 'createLink' },
  { name: 'Bỏ định dạng', icon: RemoveFormatting, cmd: 'removeFormat' },
  { name: 'Hoàn tác', icon: Undo2, cmd: 'undo' },
  { name: 'Làm lại', icon: Redo2, cmd: 'redo' },
];
export default function LegalRichEditor({ value = [], onChange, disabled = false }) {
  const editor = React.useRef(null);
  const pushChanges = React.useCallback(() => onChange(editorToRich(editor.current)), [onChange]);
  React.useEffect(() => { if (editor.current) editor.current.innerHTML = richToHtml(value); }, []); // Remount when app/document changes.
  const execute = React.useCallback((tool) => {
    if (disabled || !editor.current) return;
    editor.current.focus();
    if (tool.cmd === 'createLink') {
      const address = window.prompt('Nhập liên kết (https://...)');
      if (!address) return;
      const href = safeLink(address);
      if (!href) return window.alert('Chỉ hỗ trợ liên kết http:// hoặc https://');
      document.execCommand(tool.cmd, false, href);
    } else document.execCommand(tool.cmd, false, tool.value || null);
    pushChanges();
  }, [disabled, pushChanges]);
  return (
    <div className={`legal23-rich-wrap ${disabled ? 'disabled' : ''}`}>
      <div className="legal23-toolbar" role="toolbar" aria-label="Công cụ định dạng văn bản">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return <button key={tool.name} type="button" title={tool.name} aria-label={tool.name} disabled={disabled}
            onMouseDown={(e) => e.preventDefault()} onClick={() => execute(tool)}><Icon size={17} /></button>;
        })}
      </div>
      <div ref={editor} className="legal23-rich-input" contentEditable={!disabled} suppressContentEditableWarning
        role="textbox" aria-label="Nội dung pháp lý" aria-multiline="true" spellCheck
        onInput={pushChanges} onBlur={pushChanges} onPaste={(e) => { e.preventDefault(); document.execCommand('insertText', false, e.clipboardData.getData('text/plain')); pushChanges(); }} data-placeholder="Nhập nội dung điều khoản, bôi đen văn bản và sử dụng thanh công cụ để định dạng..." />
    </div>
  );
}
