/**
 * どのページにも当てはまらないURLの受け皿。
 * これが無いと、/api/cart など Shopify が受け持つURLでもルートのミドルウェアが動かず404になる。
 * ミドルウェアで処理されなかったものは、ここで「ページが見つかりません」にする。
 */
export function loader() {
  throw new Response('Not Found', {status: 404});
}

export default function CatchAllRoute() {
  return null;
}
