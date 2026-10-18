import clsx from 'clsx';
import {useCart, useCartForm} from '~/lib/cart';

type LineLike = {id: string; quantity: number};

/**
 * カートの1行分の数量変更・削除フォーム。カートページとドロワーで共用する。
 * 数量の入力欄・＋−・削除はすべて同じフォームから送り、表示は先に変わる（楽観的更新）。
 */
export function CartLineControls({line, showRemove = true}: {line: LineLike; showRemove?: boolean}) {
  const {formProps, register} = useCartForm();
  const pendingLines = useCart((state) => state.pending.lines);
  const lineErrors = useCart((state) => state.errors.lines);
  const pending = pendingLines.has(line.id);
  const error = lineErrors.get(line.id)?.userErrors[0]?.message;
  const errorId = `cart-line-error-${line.id}`;

  const boxStyle = {border: '1px solid var(--color-border)', color: 'var(--color-text)'};

  return (
    <form {...formProps()} className="mt-3">
      <button {...register('set')} />
      <input type="hidden" {...register('lineId', {value: line.id})} />
      <div className="flex items-center gap-3">
        <button
          {...register('decrease')}
          className="w-7 h-7 flex items-center justify-center text-sm transition-opacity hover:opacity-60"
          style={boxStyle}
          aria-label="数量を減らす"
        >
          −
        </button>
        <input
          {...register('quantity', {value: line.quantity, interactive: true})}
          inputMode="numeric"
          aria-label="数量"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={clsx('w-10 h-7 text-center text-xs bg-transparent', pending && 'opacity-40')}
          style={boxStyle}
        />
        <button
          {...register('increase')}
          className="w-7 h-7 flex items-center justify-center text-sm transition-opacity hover:opacity-60"
          style={boxStyle}
          aria-label="数量を増やす"
        >
          +
        </button>
        {showRemove && (
          <button
            {...register('remove')}
            className="text-xs underline ml-2 transition-opacity hover:opacity-60"
            style={{color: 'var(--color-text-muted)'}}
          >
            削除
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs mt-2" style={{color: '#B42318'}}>
          {error}
        </p>
      )}
    </form>
  );
}
