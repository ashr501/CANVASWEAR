// brand/canvaswears-brand.pen を作り直すスクリプト（node brand/build-pen.mjs）。
// Pencilで直接編集してもよい。色やコピーをまとめて変えたいときだけこちらを使う。
import {writeFileSync} from 'node:fs';
import {MARKS, colors, toSvg} from './marks.mjs';

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
    const v = rest.trim().split(/[\s,]+/).filter(Boolean).map(Number);
    const X = (x) => r((x - ox) * k), Y = (y) => r((y - oy) * k);
    if (c === 'Z') return 'Z';
    if (c === 'H') return 'H' + X(v[0]);
    if (c === 'V') return 'V' + Y(v[0]);
    if (c === 'A') return 'A' + [r(v[0] * k), r(v[1] * k), v[2], v[3], v[4], X(v[5]), Y(v[6])].join(' ');
    return c + v.map((n, i) => (i % 2 ? Y(n) : X(n))).join(' ');
  });
}

/** marks.mjs のシンボルを Pencil の図形にする */
function mark(key, size, dark = false) {
  const k = size / 40, c = colors(dark);
  const paint = (e) => e.fill
    ? {fill: c[e.fill]}
    : {stroke: {align: 'center', thickness: r(e.sw * k), fill: c[e.stroke], cap: 'round', join: 'round', ...(e.dash ? {dashPattern: e.dash.map((v) => r(v * k))} : {})}};
  return frame('Mark / ' + MARKS[key].name, {layout: 'none', width: size, height: size}, MARKS[key].els.map((e) => {
    if (e.t === 'rect') return {type: 'rectangle', id: id(), x: r(e.x * k), y: r(e.y * k), width: r(e.w * k), height: r(e.h * k), cornerRadius: r(e.rx * k), ...paint(e)};
    if (e.t === 'circle') return {type: 'ellipse', id: id(), x: r((e.cx - e.r) * k), y: r((e.cy - e.r) * k), width: r(e.r * 2 * k), height: r(e.r * 2 * k), ...paint(e)};
    const [x, y, w, h] = e.bbox;
    return {type: 'path', id: id(), x: r(x * k), y: r(y * k), width: r(w * k), height: r(h * k), geometry: fitPath(e.d, [x, y], k), ...paint(e)};
  }));
}
const wordmark = (size, ink = INK) => row('Wordmark', {gap: 0}, [
  text('CANVAS', {fontSize: size, fontWeight: '700', fill: ink, letterSpacing: r(size * 0.06)}),
  text('WEARS', {fontSize: size, fontWeight: '300', fill: ink, letterSpacing: r(size * 0.06)}),
]);
const lockup = (key, m, w, dark = false) => row('Logo / ' + MARKS[key].name, {gap: r(m * 0.25)}, [mark(key, m, dark), wordmark(w, dark ? PAPER : INK)]);

const label = (s) => text(s, {fontSize: 12, fontWeight: '500', fill: MUTED, letterSpacing: 2.4});
const card = (name, fill, children, o = {}) => col(name, {fill, cornerRadius: 20, padding: 40, gap: 32, width: 'fill_container', ...o}, children);
const board = (name, x, y, children) => col(name, {x, y, width: 1200, fill: PAPER, padding: 56, gap: 32}, children);
const title = (en, ja) => col('Title', {gap: 8}, [label(en), jp(ja, {fontSize: 32, fontWeight: '700'})]);

const logoCard = (key, i) => card('Logo ' + (i + 1), '#FFFFFF', [
  jp(`${i + 1} — ${MARKS[key].name}`, {fontSize: 15, fontWeight: '700', fill: MUTED}),
  lockup(key, 48, 25),
  row('Sizes', {gap: 18}, [mark(key, 40), mark(key, 28), mark(key, 16)]),
  row('On ink', {fill: INK, cornerRadius: 12, padding: [12, 16]}, [lockup(key, 28, 18, true)]),
  jp(MARKS[key].note, {fontSize: 13, fill: MUTED, lineHeight: 1.8, textGrowth: 'fixed-width', width: 264}),
], {padding: 32, gap: 26});
const keys = Object.keys(MARKS);
const logoBoard = board('01 Logo — 5案', 0, 0, [
  title('LOGO', 'ロゴ案（Tシャツを使わない5方向）'),
  row('Row 1', {gap: 20, width: 'fill_container', alignItems: 'stretch'}, keys.slice(0, 3).map(logoCard)),
  row('Row 2', {gap: 20, width: 'fill_container', alignItems: 'stretch'}, [
    ...keys.slice(3).map((k, i) => logoCard(k, i + 3)),
    col('Spacer', {width: 'fill_container'}, []),
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
// 書き出しSVG（明るい背景用 / 暗い背景用）
for (const key of Object.keys(MARKS)) {
  writeFileSync(new URL(`./logo-${key}.svg`, import.meta.url), toSvg(key) + '\n');
  writeFileSync(new URL(`./logo-${key}-on-dark.svg`, import.meta.url), toSvg(key, {dark: true}) + '\n');
}
console.log('nodes:', n);
