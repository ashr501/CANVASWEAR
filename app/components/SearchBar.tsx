import {useState} from 'react';
import {Form} from '@remix-run/react';

/** ヘッダー左のアイコンをクリックすると検索窓が展開する。狭いヘッダーに常時
 *  テキスト入力を置くとロゴと干渉しやすいため、開閉式にしている。 */
export default function SearchBar() {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="商品を検索"
        className="flex items-center transition-opacity hover:opacity-70"
        style={{color: 'var(--color-text)'}}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    );
  }

  return (
    <Form
      action="/search"
      method="get"
      className="flex items-center gap-2"
      onSubmit={() => setOpen(false)}
    >
      <input
        type="search"
        name="q"
        placeholder="商品を検索"
        autoFocus
        className="w-32 md:w-48 text-xs px-3 py-1.5"
        style={{
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text)',
        }}
        onBlur={(e) => {
          if (!e.target.value) setOpen(false);
        }}
      />
      <button
        type="submit"
        aria-label="検索する"
        className="flex items-center transition-opacity hover:opacity-70"
        style={{color: 'var(--color-text)'}}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    </Form>
  );
}
