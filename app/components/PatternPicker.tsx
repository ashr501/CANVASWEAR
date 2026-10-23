import {useMemo, useState} from 'react';
import type {CommonPattern} from '~/lib/pattern-picker';

const CATEGORIES = [
  {value: '', label: 'すべて'},
  {value: 'グラデーション', label: 'グラデーション'},
  {value: '花', label: '花柄'},
  {value: '葉・植物', label: '葉柄・植物'},
  {value: 'その他', label: 'その他の柄'},
];
const PAGE = 12;

/** Alo Loreと同じ「柄見本から選ぶ」。選んだ柄は 柄番号・柄名 として注文に残る */
export default function PatternPicker({
  patterns,
  selected,
  onSelect,
}: {
  patterns: CommonPattern[];
  selected: CommonPattern | null;
  onSelect: (pattern: CommonPattern | null) => void;
}) {
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE);

  // グラデーションは category が空で、柄番号の並びで区別される（Alo Loreと同じ分け方）
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/[-\s]/g, '');
    return patterns.filter((p) => {
      if (category === 'グラデーション' && p.category !== '') return false;
      if (category && category !== 'グラデーション' && p.category !== category) return false;
      if (!q) return true;
      return (
        p.id.toLowerCase().replace(/[-\s]/g, '').includes(q) || p.name.toLowerCase().includes(q)
      );
    });
  }, [patterns, category, query]);

  const shown = filtered.slice(0, limit);
  const border = '1px solid var(--color-border)';

  return (
    <div>
      <p className="text-xs leading-relaxed mb-3" style={{color: 'var(--color-text-muted)'}}>
        共通{patterns.length}柄から、番号・名前でお選びいただけます。柄見本は原柄です。着用イメージがない柄は、ご注文後に配置・仕上がりをご案内します。
      </p>

      {selected && (
        <div
          className="flex items-center gap-3 p-3 mb-3"
          style={{border: '1px solid var(--color-primary)', borderRadius: 'var(--radius)'}}
        >
          <img src={selected.swatch} alt="" className="w-14 h-14 object-cover" style={{borderRadius: 8}} />
          <p className="text-sm flex-1" style={{color: 'var(--color-text)'}}>
            選択中：<strong>{selected.id}</strong> {selected.name}
          </p>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs underline"
            style={{color: 'var(--color-text-muted)'}}
          >
            取り消す
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => {
              setCategory(c.value);
              setLimit(PAGE);
            }}
            aria-pressed={category === c.value}
            className="px-3 py-1.5 text-xs"
            style={{
              border,
              borderRadius: 999,
              backgroundColor: category === c.value ? 'var(--color-text)' : 'transparent',
              color: category === c.value ? 'var(--color-bg)' : 'var(--color-text)',
            }}
          >
            {c.label}
          </button>
        ))}
      </div>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setLimit(PAGE);
        }}
        placeholder="柄名・番号で探す（例：FAB166、トワイライト）"
        aria-label="柄名・番号で探す"
        className="w-full p-2.5 text-sm mb-2"
        style={{border, borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface)'}}
      />
      <p className="text-xs mb-2" style={{color: 'var(--color-text-muted)'}}>
        {shown.length} / {filtered.length}柄を表示
      </p>

      <div className="grid grid-cols-4 sm:grid-cols-6 gap-2" role="radiogroup" aria-label="共通柄から選ぶ">
        {shown.map((p) => {
          const active = selected?.id === p.id;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSelect(active ? null : p)}
              title={`${p.id} ${p.name}`}
              className="text-left"
            >
              <img
                src={p.swatch}
                alt={`${p.id} ${p.name}`}
                loading="lazy"
                className="w-full aspect-square object-cover"
                style={{
                  borderRadius: 8,
                  outline: active ? '3px solid var(--color-primary)' : 'none',
                  outlineOffset: 2,
                }}
              />
              <span className="block text-[10px] mt-1 leading-tight" style={{color: 'var(--color-text-muted)'}}>
                {p.id}
              </span>
            </button>
          );
        })}
      </div>
      {filtered.length > limit && (
        <button
          type="button"
          onClick={() => setLimit(limit + PAGE)}
          className="btn-outline w-full mt-3 text-xs"
        >
          もっと見る（次の{Math.min(PAGE, filtered.length - limit)}柄）
        </button>
      )}
    </div>
  );
}
