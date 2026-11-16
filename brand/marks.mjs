// ロゴのシンボル案。40×40の枠で描き、色は役割名（ink / red / paper）で持つ。
// build-pen.mjs（Pencilファイル）とサイトの BrandLogo.tsx は、この形をもとにしている。
// path の d は絶対座標のコマンド（M L H V A Q C Z）だけで書く。bbox は [x, y, 幅, 高さ]。
const rot = (x, y, deg = 45, cx = 20, cy = 20) => {
  const t = (deg * Math.PI) / 180, dx = x - cx, dy = y - cy;
  return [cx + dx * Math.cos(t) - dy * Math.sin(t), cy + dx * Math.sin(t) + dy * Math.cos(t)].map((v) => Math.round(v * 100) / 100);
};
const poly = (pts) => 'M' + pts.map((p) => rot(...p).join(' ')).join('L') + 'Z';
const box = (pts) => {
  const r = pts.map((p) => rot(...p)), xs = r.map((p) => p[0]), ys = r.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)].map((v) => Math.round(v * 100) / 100);
};
const body = [[16.5, 7.5], [23.5, 7.5], [23.5, 25], [16.5, 25]];
const tip = [[16.5, 25], [23.5, 25], [20, 31.5]];

export const MARKS = {
  tiles: {
    name: '柄タイル',
    note: '水玉・曲線・しま・ひし形。4つの柄で「どんな柄でも」を表す。アプリのアイコンやタグにもそのまま使える。',
    els: [
      {t: 'rect', x: 0, y: 0, w: 18, h: 18, rx: 4.5, fill: 'red'},
      {t: 'circle', cx: 9, cy: 9, r: 4.2, fill: 'paper'},
      {t: 'rect', x: 22, y: 0, w: 18, h: 18, rx: 4.5, fill: 'ink'},
      {t: 'path', d: 'M26 18A14 14 0 0 1 40 4V18Z', bbox: [26, 4, 14, 14], fill: 'paper'},
      {t: 'rect', x: 0, y: 22, w: 18, h: 18, rx: 4.5, fill: 'ink'},
      {t: 'rect', x: 4, y: 27, w: 10, h: 2.6, rx: 1.3, fill: 'paper'},
      {t: 'rect', x: 4, y: 33, w: 10, h: 2.6, rx: 1.3, fill: 'paper'},
      {t: 'rect', x: 22, y: 22, w: 18, h: 18, rx: 4.5, fill: 'red'},
      {t: 'path', d: 'M31 26.5L35.5 31L31 35.5L26.5 31Z', bbox: [26.5, 26.5, 9, 9], fill: 'paper'},
    ],
  },
  hanger: {
    name: 'ハンガー × キャンバス',
    note: 'ハンガーに掛かった一枚のキャンバス。「着るもの」をTシャツの形を使わずに伝える。形がいちばん単純。',
    els: [
      {t: 'path', d: 'M17 6.5A3.2 3.2 0 1 1 21.6 9.4C20.6 9.9 20 10.6 20 11.7V13', bbox: [17, 3.32, 6.4, 9.68], stroke: 'ink', sw: 2.6},
      {t: 'path', d: 'M20 13L5 21.5H35Z', bbox: [5, 13, 30, 8.5], stroke: 'ink', sw: 2.6},
      {t: 'rect', x: 8, y: 21.5, w: 24, h: 17, rx: 3.5, fill: 'red'},
    ],
  },
  pencil: {
    name: '鉛筆 × キャンバス',
    note: 'キャンバスに描く鉛筆。「描いたものが、着るものになる」。自分のデザインで作る店だと伝わる。',
    els: [
      {t: 'rect', x: 1.5, y: 1.5, w: 37, h: 37, rx: 9, stroke: 'ink', sw: 3},
      {t: 'path', d: poly(body), bbox: box(body), fill: 'red'},
      {t: 'path', d: poly(tip), bbox: box(tip), fill: 'ink'},
    ],
  },
  hug: {
    name: 'Cがキャンバスを抱く',
    note: '頭文字のCの中に小さなキャンバス。すっきりしているが、何の店かは伝わりにくい。',
    els: [
      {t: 'path', d: 'M33.2 9.2A17 17 0 1 0 33.2 30.8', bbox: [3.07, 3, 30.13, 34], stroke: 'ink', sw: 6},
      {t: 'rect', x: 15, y: 14, w: 12, h: 12, rx: 3, fill: 'red'},
    ],
  },
  label: {
    name: '織りネーム',
    note: '服の内側に縫い付けるブランドタグ。縫い目の点線で「布もの」だと分かる。朱色の面が強い。',
    els: [
      {t: 'rect', x: 0, y: 0, w: 40, h: 40, rx: 9, fill: 'red'},
      {t: 'rect', x: 5, y: 5, w: 30, h: 30, rx: 5, stroke: 'cream', sw: 1.6, dash: [3.2, 2.6]},
      {t: 'path', d: 'M25.8 15.2A7 7 0 1 0 25.8 24.8', bbox: [13.7, 13, 12.1, 14], stroke: 'cream', sw: 3.4},
    ],
  },
};

/** 明るい背景用 / 暗い背景用の実際の色 */
export const colors = (dark) => ({ink: dark ? '#FBF7F2' : '#1F1B18', red: '#D43D24', paper: dark ? '#1F1B18' : '#FFFFFF', cream: '#FBF7F2'});

export function toSvg(key, {dark = false, size = 160} = {}) {
  const c = colors(dark);
  const paint = (e) => (e.fill ? `fill="${c[e.fill]}"` : `fill="none" stroke="${c[e.stroke]}" stroke-width="${e.sw}" stroke-linecap="round" stroke-linejoin="round"${e.dash ? ` stroke-dasharray="${e.dash.join(' ')}"` : ''}`);
  const body = MARKS[key].els.map((e) =>
    e.t === 'rect' ? `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="${e.rx}" ${paint(e)}/>`
    : e.t === 'circle' ? `<circle cx="${e.cx}" cy="${e.cy}" r="${e.r}" ${paint(e)}/>`
    : `<path d="${e.d}" ${paint(e)}/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="${size}" height="${size}">${body}</svg>`;
}
