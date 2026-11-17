// brand/canvaswears-brand.pen を作り直すスクリプト（node brand/build-pen.mjs）。
// Pencilで直接編集してもよい。色やコピーをまとめて変えたいときだけこちらを使う。
import {writeFileSync} from 'node:fs';
import {readFileSync} from 'node:fs';

// ロゴの形。サイト（app/lib/logo-data.json）と同じデータを使う。別案とカナは brand/logo-extra.json
const LOGO = JSON.parse(readFileSync(new URL('../app/lib/logo-data.json', import.meta.url), 'utf8'));
const EXTRA = JSON.parse(readFileSync(new URL('./logo-extra.json', import.meta.url), 'utf8'));
const CHEEK = '#F2A08F';

const INK = '#1F1B18', PAPER = '#FBF7F2', RED = '#D43D24', SAND = '#F6EADF', MUTED = '#62594F', LINE = '#EADFD3';
let n = 0;
const id = () => 'cw' + (n++).toString(36).padStart(3, '0');
const text = (content, o = {}) => ({type: 'text', id: id(), content, fontFamily: 'Outfit', fontSize: 16, fontWeight: '400', fill: INK, ...o});
const jp = (content, o = {}) => text(content, {fontFamily: 'Zen Kaku Gothic New', ...o});
const frame = (name, o = {}, children = []) => ({type: 'frame', id: id(), name, ...o, children});
const row = (name, o, children) => frame(name, {layout: 'horizontal', alignItems: 'center', ...o}, children);
const col = (name, o, children) => frame(name, {layout: 'vertical', ...o}, children);
const r = (v) => Math.round(v * 100) / 100;

/** 絶対座標のパスを、bboxの左上が原点になるようにずらして k 倍する */
function fitPath(d, [ox, oy], k) {
  return d.replace(/([MLHVAQCZ])([^MLHVAQCZ]*)/g, (_, c, rest) => {
    const v = (rest.match(/-?\d*\.?\d+/g) || []).map(Number);
    const X = (x) => r((x - ox) * k), Y = (y) => r((y - oy) * k);
    if (c === 'Z') return 'Z';
    if (c === 'H') return 'H' + X(v[0]);
    if (c === 'V') return 'V' + Y(v[0]);
    if (c === 'A') return 'A' + [r(v[0] * k), r(v[1] * k), v[2], v[3], v[4], X(v[5]), Y(v[6])].join(' ');
    return c + v.map((n, i) => (i % 2 ? Y(n) : X(n))).join(' ');
  });
}
const pathNode = (name, d, bbox, k, paint, dx = 0, dy = 0) => ({
  type: 'path', id: id(), name, x: r((bbox[0] + dx) * k), y: r((bbox[1] + dy) * k),
  width: r(bbox[2] * k), height: r(bbox[3] * k), geometry: fitPath(d, [bbox[0], bbox[1]], k), ...paint,
});
const roleColor = (role, dark) => ({ink: dark ? PAPER : INK, red: RED, cream: PAPER, cheek: CHEEK})[role];

/** シンボル（100×100の座標で定義）を size px の Pencil 図形にする */
function mark(els, size, dark = false, name = 'Mark') {
  const k = size / 100;
  const nodes = els.map((e, i) => {
    if (e.t === 'edge') return pathNode('Pinked edge', LOGO.EDGE, [5, 5, 90, 90], k, {fill: RED, stroke: {align: 'center', thickness: r(LOGO.EDGE_STROKE * k), fill: RED, join: 'round'}});
    if (e.t === 'ellipse') return {type: 'ellipse', id: id(), name: 'Dot ' + i, x: r((e.cx - e.rx) * k), y: r((e.cy - e.ry) * k), width: r(e.rx * 2 * k), height: r(e.ry * 2 * k), fill: roleColor(e.fill, dark)};
    return pathNode('Line ' + i, e.d, e.bbox, k, {stroke: {align: 'center', thickness: r(e.sw * k), fill: roleColor(e.stroke, dark), cap: 'round', join: 'round'}});
  });
  return frame(name, {layout: 'none', width: size, height: size}, nodes);
}
/** 横組みロゴ（シンボル＋文字）。高さ h px */
function logo(h, dark = false, els = LOGO.MARK) {
  const k = h / LOGO.WORD.height;
  const w = LOGO.WORD;
  return frame('Logo', {layout: 'none', width: r(w.width * k), height: h}, [
    mark(els, h, dark, 'Symbol'),
    pathNode('canvas', w.canvas.d, w.canvas.bbox, k, {fill: dark ? PAPER : INK}),
    pathNode('wears', w.wears.d, w.wears.bbox, k, {fill: RED}),
  ]);
}
/** 縦組み（シンボル／文字／カナ）。カナはブランド資料用 */
function stacked(scale = 1) {
  const w = LOGO.WORD, kana = EXTRA.KANA, k = scale;
  const wordW = (w.width - 124) * k, W = Math.max(wordW, kana.advance * k);
  return col('Logo stacked', {gap: r(16 * k), alignItems: 'center'}, [
    mark(LOGO.MARK, r(100 * k), false, 'Symbol'),
    frame('Word', {layout: 'none', width: r(wordW), height: r(32 * k)}, [
      pathNode('canvas', w.canvas.d, w.canvas.bbox, k, {fill: INK}, -124, -35),
      pathNode('wears', w.wears.d, w.wears.bbox, k, {fill: RED}, -124, -35),
    ]),
    frame('Kana', {layout: 'none', width: r(kana.bbox[2] * k), height: r(kana.bbox[3] * k)}, [
      pathNode('キャンバスウェアーズ', kana.d, kana.bbox, k, {fill: MUTED}, -kana.bbox[0], -kana.bbox[1]),
    ]),
  ]);
}

const label = (s) => text(s, {fontSize: 12, fontWeight: '500', fill: MUTED, letterSpacing: 2.4});
const card = (name, fill, children, o = {}) => col(name, {fill, cornerRadius: 20, padding: 40, gap: 32, width: 'fill_container', ...o}, children);
const board = (name, x, y, children) => col(name, {x, y, width: 1200, fill: PAPER, padding: 56, gap: 32}, children);
const title = (en, ja) => col('Title', {gap: 8}, [label(en), jp(ja, {fontSize: 32, fontWeight: '700'})]);
const note = (s, width) => jp(s, {fontSize: 14, fill: MUTED, lineHeight: 1.9, textGrowth: 'fixed-width', width});

const logoBoard = board('01 Logo', 0, 0, [
  title('LOGO', 'ロゴ：生地くん'),
  note('ピンキングばさみで切った生地の切れ端に、にっこり顔。「布にプリントする店」と「かわいい」を一つの形で伝えます。文字は丸みのある Fredoka を輪郭にしたもので、canvas は墨、wears は朱。', 1088),
  row('Main', {gap: 24, width: 'fill_container', alignItems: 'stretch'}, [
    card('On white', '#FFFFFF', [label('ON WHITE'), logo(96), logo(48),
      row('Sizes', {gap: 20}, [mark(LOGO.MARK, 64), mark(LOGO.MARK, 32), mark(LOGO.MARK, 16)])]),
    card('On ink', INK, [text('ON INK', {fontSize: 12, fontWeight: '500', fill: '#B9AEA2', letterSpacing: 2.4}), logo(96, true), logo(48, true),
      row('Sizes', {gap: 20}, [mark(LOGO.MARK, 64, true), mark(LOGO.MARK, 32, true), mark(LOGO.MARK, 16, true)])]),
  ]),
  row('Sub', {gap: 24, width: 'fill_container', alignItems: 'stretch'}, [
    card('Stacked', '#FFFFFF', [label('STACKED — 店頭・タグ・パッケージ'), stacked(1)], {alignItems: 'center'}),
    card('Sticker', '#FFFFFF', [label('STICKER — SNS・ステッカー用（ほっぺ付き）'),
      row('Row', {gap: 24}, [mark(EXTRA.MARKS.faceCheeks.els, 128), mark(EXTRA.MARKS.faceCheeks.els, 64)]),
      note('大きく使うときだけ、ほっぺを付けた版。32px より小さいところでは使わない。', 420)]),
  ]),
]);

const copies = [
  ['着るものぜんぶ、キャンバス。', '採用。ブランド名の意味をそのまま言い切る。サイトのトップに使用中'],
  ['どんな柄でも、1点から。', 'これまでのコピー。機能が一言で伝わるので、説明文・検索向けの文として継続'],
  ['写真も、絵も、そのまま服になる。', '初めての人に仕組みが伝わる。広告・SNS向き'],
  ['好きな柄を、着よう。', 'いちばん短い。バナーやタグ向き'],
  ['描いたものが、着るものになる。', 'イラストを描く人に向けた言い方'],
  ['世界に一着を、1点から。', 'ギフト・記念品の訴求向き'],
];
const copyBoard = board('03 Catchcopy', 1280, 0, [
  title('CATCHCOPY', 'キャッチコピー'),
  col('Main', {fill: INK, cornerRadius: 20, padding: 48, gap: 16, width: 'fill_container'}, [
    text('WEAR YOUR CANVAS', {fontSize: 13, fontWeight: '500', fill: RED, letterSpacing: 3.2}),
    jp('着るものぜんぶ、', {fontSize: 56, fontWeight: '900', fill: PAPER, lineHeight: 1.3}),
    jp('キャンバス。', {fontSize: 56, fontWeight: '900', fill: RED, lineHeight: 1.3}),
    jp('写真もイラストも、全面フルカラーの昇華プリントで。Tシャツからドレス、バッグまで、どんな柄でも1点からお作りします。', {fontSize: 15, fill: '#D8CEC2', lineHeight: 1.9, textGrowth: 'fixed-width', width: 560}),
  ]),
  ...copies.map(([c, note], i) => row('Copy ' + (i + 1), {gap: 24, width: 'fill_container', padding: [18, 0], stroke: {align: 'inside', thickness: {bottom: 1}, fill: LINE}}, [
    text(String(i + 1).padStart(2, '0'), {fontSize: 18, fontWeight: '700', fill: RED}),
    jp(c, {fontSize: 22, fontWeight: '700', textGrowth: 'fixed-width', width: 420}),
    jp(note, {fontSize: 13, fill: MUTED, lineHeight: 1.7, textGrowth: 'fixed-width', width: 540}),
  ])),
]);

const swatch = (name, hex, role, dark) => col('Swatch ' + name, {fill: hex, cornerRadius: 16, padding: 20, gap: 4, width: 'fill_container', height: 150, justifyContent: 'end', stroke: {align: 'inside', thickness: 1, fill: LINE}}, [
  jp(name, {fontSize: 15, fontWeight: '700', fill: dark ? PAPER : INK}),
  text(hex, {fontSize: 13, fill: dark ? PAPER : INK}),
  jp(role, {fontSize: 11, fill: dark ? '#F3D9D2' : MUTED}),
]);
const styleBoard = board('04 Color & Type', 1280, 1220, [
  title('COLOR & TYPE', '色と書体'),
  row('Colors', {gap: 16, width: 'fill_container'}, [
    swatch('朱（インク）', RED, 'ボタン・強調・ロゴ', true),
    swatch('墨', INK, '文字・ロゴ', true),
    swatch('生成り', PAPER, 'ページの地色', false),
    swatch('砂', SAND, '帯・アイコンの地', false),
    swatch('罫線', LINE, '枠線・区切り', false),
  ]),
  row('Type', {gap: 24, width: 'fill_container', alignItems: 'stretch'}, [
    card('Type JP', '#FFFFFF', [label('HEADING — ZEN KAKU GOTHIC NEW 700 / 900'), jp('カテゴリから探す', {fontSize: 34, fontWeight: '700'}), label('BODY — NOTO SANS JP 400 / 500'), text('写真もイラストも、全面フルカラーで再現できます。', {fontFamily: 'Noto Sans JP', fontSize: 15, fill: MUTED})], {gap: 16}),
    card('Type EN', '#FFFFFF', [label('DISPLAY — OUTFIT 300 / 500 / 700'), text('HOW TO ORDER  01 02 03', {fontSize: 30, fontWeight: '700'}), text('欧文の小見出し・数字・ロゴに使用', {fontFamily: 'Noto Sans JP', fontSize: 13, fill: MUTED})], {gap: 16}),
  ]),
]);

writeFileSync(new URL('./canvaswears-brand.pen', import.meta.url), JSON.stringify({version: '2.9', children: [logoBoard, copyBoard, styleBoard]}, null, 2) + '\n');
// 書き出しSVG
const svgMark = (els, dark) => `<path d="${LOGO.EDGE}" fill="${RED}" stroke="${RED}" stroke-width="${LOGO.EDGE_STROKE}" stroke-linejoin="round"/>` + els.filter((e) => e.t !== 'edge').map((e) => e.t === 'ellipse'
  ? `<ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${roleColor(e.fill, dark)}"/>`
  : `<path d="${e.d}" fill="none" stroke="${roleColor(e.stroke, dark)}" stroke-width="${e.sw}" stroke-linecap="round"/>`).join('');
const svgFile = (name, vb, body) => writeFileSync(new URL(`./${name}.svg`, import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>\n`);
const W = LOGO.WORD;
svgFile('logo', `-2 -2 ${r(W.width + 4)} 104`, svgMark(LOGO.MARK, false) + `<path d="${W.canvas.d}" fill="${INK}"/><path d="${W.wears.d}" fill="${RED}"/>`);
svgFile('logo-on-dark', `-2 -2 ${r(W.width + 4)} 104`, svgMark(LOGO.MARK, true) + `<path d="${W.canvas.d}" fill="${PAPER}"/><path d="${W.wears.d}" fill="${RED}"/>`);
svgFile('symbol', '-2 -2 104 104', svgMark(LOGO.MARK, false));
svgFile('symbol-sticker', '-2 -2 104 104', svgMark(EXTRA.MARKS.faceCheeks.els, false));
console.log('nodes:', n);
