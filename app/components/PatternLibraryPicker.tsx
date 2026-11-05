import {useCallback, useEffect, useRef, useState} from 'react';

export type SelectedLibraryPattern = {code: string; category: string; thumb: string; full: string};

type ApiResult = {
  total: number;
  categories: Array<{name: string; count: number}>;
  items: SelectedLibraryPattern[];
  nextOffset: number | null;
  error?: string;
};

/**
 * 柄ライブラリ（約1万点）から柄を選ぶ画面。開いたときに初めて読み込み、60点ずつ表示する。
 * ZDの画像は参照元を送ると表示されないため、画像は referrerPolicy="no-referrer" で読む。
 */
export default function PatternLibraryPicker({
  onSelect,
  onClose,
}: {
  onSelect: (pattern: SelectedLibraryPattern) => void;
  onClose: () => void;
}) {
  const [category, setCategory] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState<ApiResult | null>(null);
  const [items, setItems] = useState<SelectedLibraryPattern[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<SelectedLibraryPattern | null>(null);
  const request = useRef(0);

  const load = useCallback(
    async (offset: number) => {
      const id = ++request.current;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({category, q: query, offset: String(offset)});
        const res = await fetch(`/api/patterns?${params}`);
        const json: ApiResult = await res.json();
        if (id !== request.current) return; // 古い検索の結果は捨てる
        if (!res.ok || json.error) throw new Error(json.error ?? '読み込めませんでした');
        setData(json);
        setItems((prev) => (offset === 0 ? json.items : [...prev, ...json.items]));
      } catch (e) {
        if (id === request.current) setError(e instanceof Error ? e.message : '読み込めませんでした');
      } finally {
        if (id === request.current) setLoading(false);
      }
    },
    [category, query],
  );

  // 分類・検索語が変わったら最初から読み直す（入力中は少し待つ）
  useEffect(() => {
    const timer = setTimeout(() => load(0), query ? 300 : 0);
    return () => clearTimeout(timer);
  }, [load, query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && (preview ? setPreview(null) : onClose());
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, preview]);

  const chip = (active: boolean) => ({
    border: '1px solid var(--color-border)',
    borderRadius: 999,
    backgroundColor: active ? 'var(--color-text)' : 'var(--color-bg)',
    color: active ? 'var(--color-bg)' : 'var(--color-text)',
  });
  const allCount = data?.categories.reduce((sum, c) => sum + c.count, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{backgroundColor: 'rgba(0,0,0,0.45)'}}
      role="dialog"
      aria-modal="true"
      aria-label="柄ライブラリから選ぶ"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full sm:max-w-3xl max-h-[92vh] flex flex-col"
        style={{backgroundColor: 'var(--color-bg)', borderRadius: '20px 20px 0 0'}}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{borderBottom: '1px solid var(--color-border)'}}>
          <h2 className="text-base" style={{fontFamily: 'var(--font-heading)', fontWeight: 700}}>
            柄ライブラリから選ぶ
          </h2>
          <button type="button" onClick={onClose} className="text-sm underline" style={{color: 'var(--color-text-muted)'}}>
            閉じる
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <button type="button" onClick={() => setCategory('')} className="px-3 py-1.5 text-xs" style={chip(category === '')}>
              すべて{allCount ? ` ${allCount.toLocaleString()}` : ''}
            </button>
            {data?.categories.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setCategory(c.name)}
                className="px-3 py-1.5 text-xs"
                style={chip(category === c.name)}
              >
                {c.name} {c.count.toLocaleString()}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="柄番号で探す（例：YSFE1211）"
            aria-label="柄番号で探す"
            className="w-full p-2.5 text-sm mb-2"
            style={{border: '1px solid var(--color-border)', borderRadius: 'var(--radius)', backgroundColor: 'var(--color-surface)'}}
          />
          <p className="text-xs mb-3" style={{color: 'var(--color-text-muted)'}}>
            {data ? `${data.total.toLocaleString()}点。` : '読み込み中...'}
            柄をタップすると大きく表示されます
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {error && (
            <p className="text-sm py-6 text-center" style={{color: '#B42318'}} role="alert">
              {error}
            </p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {items.map((p) => (
              <button key={p.code} type="button" onClick={() => setPreview(p)} className="text-left">
                <img
                  src={p.thumb}
                  alt={`柄 ${p.code}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-square object-cover"
                  style={{borderRadius: 8, backgroundColor: 'var(--color-surface)'}}
                />
                <span className="block text-[10px] mt-1 truncate" style={{color: 'var(--color-text-muted)'}}>
                  {p.code}
                </span>
              </button>
            ))}
          </div>
          {data?.nextOffset != null && (
            <button
              type="button"
              disabled={loading}
              onClick={() => load(data.nextOffset!)}
              className="btn-outline w-full mt-4 text-xs"
            >
              {loading ? '読み込み中...' : 'もっと見る（次の60点）'}
            </button>
          )}
        </div>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{backgroundColor: 'rgba(0,0,0,0.7)'}}
          onClick={(e) => e.target === e.currentTarget && setPreview(null)}
        >
          <div className="w-full max-w-md p-4" style={{backgroundColor: 'var(--color-bg)', borderRadius: 20}}>
            <img
              src={preview.full}
              alt={`柄 ${preview.code}`}
              referrerPolicy="no-referrer"
              className="w-full max-h-[60vh] object-contain"
              style={{borderRadius: 12, backgroundColor: 'var(--color-surface)'}}
            />
            <p className="text-sm mt-3" style={{color: 'var(--color-text)'}}>
              柄番号：<strong>{preview.code}</strong>（{preview.category}）
            </p>
            <div className="flex gap-2 mt-4">
              <button type="button" onClick={() => setPreview(null)} className="btn-outline flex-1 text-xs">
                戻る
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelect(preview);
                  onClose();
                }}
                className="btn-primary flex-1 text-xs"
              >
                この柄にする
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
