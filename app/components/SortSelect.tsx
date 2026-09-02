import {useNavigate, useSearchParams} from '@remix-run/react';
import {SORT_OPTIONS} from '~/lib/sort';

export default function SortSelect() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  return (
    <select
      value={searchParams.get('sort') ?? ''}
      onChange={(e) => {
        const next = new URLSearchParams(searchParams);
        // 並び替えを変えたらページネーションはリセットする
        next.delete('cursor');
        next.delete('direction');
        if (e.target.value) {
          next.set('sort', e.target.value);
        } else {
          next.delete('sort');
        }
        navigate(`?${next.toString()}`, {preventScrollReset: true});
      }}
      className="px-4 py-2 text-xs tracking-wider uppercase"
      style={{
        borderRadius: 'var(--radius)',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text)',
      }}
    >
      {SORT_OPTIONS.map(({value, label}) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
