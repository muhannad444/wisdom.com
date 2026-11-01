/*
 * Little Wisdom — original illustrations, drawn as inline SVG.
 *
 * ART DIRECTION: one quiet Japanese home, seen at different hours and from different rooms.
 * Soft warm-brown ink lines (never pure black), muted washi/sage/blue/terracotta fills,
 * a single warm light source per scene. Paper grain and the daylight tint are added in CSS
 * (so they stay consistent and cheap); this file only draws shapes.
 * Eight scenes: home (panorama), rain, desk, morning, window, train, night, season.
 * No external images, so nothing can 404 and every scene scales cleanly.
 */
(function (root) {
  'use strict';

  const C = {
    washi: '#f4ecda', shoji: '#f1e6cb', shojiLit: '#fbf1d4', paper: '#efe6d3',
    line: '#5a4639', night: '#2c3646', charcoal: '#2f2722',
    wood: '#c4a27c', woodDeep: '#8c6a4a', tatami: '#c9c295', tatamiEdge: '#6b6f4f',
    sage: '#9fb097', sageDeep: '#5f7659', blue: '#8ea6bd', blueDeep: '#4d6178',
    pink: '#e3b7ae', terracotta: '#b9705a', maple: '#c0583f', amber: '#d89a58',
    glow: '#f2cf94', stone: '#b9b4a8', cream: '#fbf6ea'
  };
  const L = C.line;

  /* ---------- small drawing helpers (all return SVG markup strings) ---------- */
  const rainLines = (x0, y0, x1, y1, n, cls) => {
    let d = '';
    for (let i = 0; i < n; i++) {
      const x = x0 + ((i * 53) % (x1 - x0));
      const y = y0 + ((i * 37) % (y1 - y0 - 24));
      d += `M${x} ${y}l-5 18`;
    }
    return `<path class="${cls || 'rain'}" d="${d}" stroke="#e6edf2" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;
  };
  const lattice = (x, y, w, h, cols, rows, sw, op) => {
    let d = '';
    for (let i = 1; i < cols; i++) d += `M${x + (w * i) / cols} ${y}v${h}`;
    for (let j = 1; j < rows; j++) d += `M${x} ${y + (h * j) / rows}h${w}`;
    return `<path d="${d}" fill="none" stroke="${L}" stroke-width="${sw || 2}" opacity="${op || 0.7}"/>`;
  };
  const shoji = (x, y, w, h, cols, rows, lit) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${lit ? C.shojiLit : C.shoji}" stroke="${L}" stroke-width="3"/>` + lattice(x, y, w, h, cols, rows);
  const tatami = (x, y, w, h) => {
    let d = '';
    for (let yy = y + h * 0.34; yy < y + h; yy += h * 0.34) d += `M${x} ${yy}h${w}`;
    for (let xx = x + w * 0.27; xx < x + w; xx += w * 0.46) d += `M${xx} ${y}v${h * 0.34}`;
    for (let xx = x + w * 0.5; xx < x + w; xx += w * 0.46) d += `M${xx} ${y + h * 0.34}v${h * 0.33}`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.tatami}"/>` +
      `<path d="${d}" stroke="${C.tatamiEdge}" stroke-width="2.5" opacity=".55"/>` +
      `<path d="M${x} ${y}h${w}" stroke="${L}" stroke-width="3"/>`;
  };
  const planks = (x, y, w, h) => {
    let d = '';
    for (let yy = y + h / 3; yy < y + h - 1; yy += h / 3) d += `M${x} ${yy}h${w}`;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.wood}" stroke="${L}" stroke-width="3"/>` +
      `<path d="${d}" stroke="${L}" stroke-width="1.6" opacity=".5"/>`;
  };
  const steam = (x, y) =>
    `<path class="steam" d="M${x} ${y}c-7-9 7-14 0-24M${x + 12} ${y + 2}c-7-9 7-14 0-24" fill="none" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" opacity=".75"/>`;
  const cup = (x, y) =>
    `<ellipse cx="${x + 17}" cy="${y + 31}" rx="26" ry="5" fill="${L}" opacity=".18"/>` +
    `<path d="M${x} ${y}h34l-4 30h-26z" fill="${C.cream}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>` +
    `<ellipse cx="${x + 17}" cy="${y + 1}" rx="17" ry="4" fill="${C.sageDeep}" stroke="${L}" stroke-width="2.5"/>` + steam(x + 10, y - 6);
  const lanternStone = (x, y) => // y = ground line
    `<rect x="${x - 17}" y="${y - 20}" width="34" height="20" fill="${C.stone}" stroke="${L}" stroke-width="3"/>` +
    `<rect x="${x - 6}" y="${y - 62}" width="12" height="44" fill="${C.stone}" stroke="${L}" stroke-width="3"/>` +
    `<rect x="${x - 19}" y="${y - 98}" width="38" height="38" fill="${C.stone}" stroke="${L}" stroke-width="3"/>` +
    `<rect x="${x - 8}" y="${y - 90}" width="16" height="22" fill="${C.glow}" stroke="${L}" stroke-width="2.5"/>` +
    `<path d="M${x - 32} ${y - 98}L${x} ${y - 124}L${x + 32} ${y - 98}z" fill="${C.stone}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>`;
  const mapleTree = (x, y) => // y = ground; trunk then clustered foliage
    `<path d="M${x} ${y}q8-60-4-118" fill="none" stroke="${C.woodDeep}" stroke-width="9" stroke-linecap="round"/>` +
    `<g stroke="${L}" stroke-width="2.5"><circle cx="${x - 4}" cy="${y - 136}" r="42" fill="${C.maple}"/><circle cx="${x + 34}" cy="${y - 118}" r="28" fill="${C.amber}"/><circle cx="${x - 40}" cy="${y - 112}" r="26" fill="${C.terracotta}"/><circle cx="${x + 8}" cy="${y - 168}" r="24" fill="${C.amber}"/></g>`;
  /** The shared rain-garden vignette, drawn in a 380 x 260 box. */
  const garden = (id) =>
    `<defs><linearGradient id="${id}sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb0bd"/><stop offset="1" stop-color="#d3dbd8"/></linearGradient></defs>` +
    `<rect width="380" height="260" fill="url(#${id}sky)"/>` +
    `<path d="M0 150q50-34 100-12t100-8 100 8 80-6V260H0z" fill="#8aa08a" opacity=".85"/>` +
    `<path d="M0 190q70-24 150-8t140-6 90 4V260H0z" fill="${C.sageDeep}"/>` +
    mapleTree(70, 252) + lanternStone(268, 252) +
    `<ellipse cx="168" cy="250" rx="30" ry="6" fill="${C.stone}" stroke="${L}" stroke-width="2.5"/><ellipse cx="206" cy="256" rx="20" ry="4" fill="${C.stone}" stroke="${L}" stroke-width="2.5"/>` +
    rainLines(0, 0, 380, 260, 30);

  const glowDef = (id, color, op) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${color}" stop-opacity="${op || 0.85}"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient>`;

  /* ---------- the scenes ---------- */
  const SCENES = {
    /** Panorama used by the hero: the whole room at once. */
    home: {
      viewBox: '0 0 1200 520',
      alt: 'A quiet Japanese room on a rainy afternoon: open shoji onto a garden, a low desk with tea and a book, a paper lantern, and a hanging scroll with a brush-drawn circle.',
      altAr: 'غرفة يابانية هادئة في عصر ماطر: أبواب شوجي مفتوحة على حديقة، ومكتب منخفض عليه شاي وكتاب، وفانوس ورقي، ولوحة معلّقة فيها دائرة بخط الفرشاة.',
      svg: (id) => `
        <defs>${glowDef(id + 'l', C.glow, 0.9)}${glowDef(id + 'w', '#fff3cf', 0.55)}</defs>
        <rect width="1200" height="520" fill="${C.washi}"/>
        <rect width="1200" height="44" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>
        <g transform="translate(70 70) scale(1.37 1.12)"><svg width="380" height="260" viewBox="0 0 380 260" overflow="hidden">${garden(id)}</svg></g>
        <rect x="70" y="70" width="520" height="291" fill="none" stroke="${L}" stroke-width="5"/>
        ${shoji(0, 44, 70, 316, 2, 8, true)}${shoji(590, 44, 60, 316, 2, 8, true)}
        ${planks(0, 360, 700, 34)}
        <circle cx="260" cy="395" r="120" fill="url(#${id}w)"/>
        ${tatami(0, 394, 1200, 126)}
        <circle cx="800" cy="250" r="260" fill="url(#${id}l)"/>
        <rect x="690" y="300" width="300" height="22" fill="${C.wood}" stroke="${L}" stroke-width="3"/>
        <rect x="716" y="322" width="16" height="70" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/><rect x="948" y="322" width="16" height="70" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>
        <path d="M730 300q50-24 100 0q50-24 100 0v-8q-50-22-100 0q-50-22-100 0z" fill="${C.cream}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M748 290q34-12 68 0M844 290q34-12 68 0" fill="none" stroke="${L}" stroke-width="1.6" opacity=".5"/>
        <ellipse cx="900" cy="282" rx="22" ry="17" fill="${C.sage}" stroke="${L}" stroke-width="3"/><path d="M920 276q16 4 4 18" fill="none" stroke="${L}" stroke-width="3"/>
        ${cup(826, 262)}
        <rect x="1000" y="214" width="62" height="110" rx="10" fill="${C.shojiLit}" stroke="${L}" stroke-width="3"/>
        <path d="M1031 214v110M1000 251h62M1000 288h62" stroke="${L}" stroke-width="1.8" opacity=".55"/>
        <rect x="1014" y="324" width="34" height="68" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>
        <rect x="1110" y="70" width="90" height="324" fill="${C.shoji}" stroke="${L}" stroke-width="3"/>
        <rect x="1122" y="96" width="66" height="232" fill="${C.cream}" stroke="${L}" stroke-width="2.5"/>
        <circle cx="1155" cy="180" r="24" fill="none" stroke="${L}" stroke-width="7" stroke-dasharray="130 28" stroke-linecap="round" transform="rotate(-70 1155 180)"/>
        <rect x="1118" y="326" width="74" height="12" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>
        <path d="M1155 326v-30M1143 296q12-16 24 0z" fill="${C.cream}" stroke="${L}" stroke-width="2.5"/>
        <path d="M1155 296q-8-24 4-40M1155 300q12-18 20-30" fill="none" stroke="${C.woodDeep}" stroke-width="3" stroke-linecap="round"/>`
    },

    rain: {
      alt: 'Rain falling on a Japanese garden seen through open shoji screens: a maple tree, a stone lantern, and a cup of tea on the wooden veranda.',
      altAr: 'مطر يتساقط على حديقة يابانية يُرى من خلف أبواب شوجي مفتوحة: شجرة قيقب وفانوس حجري وكوب شاي على الشرفة الخشبية.',
      svg: (id) => `
        <defs>${glowDef(id + 'w', '#fff3cf', 0.5)}</defs>
        <rect width="600" height="400" fill="${C.washi}"/>
        <g transform="translate(110 40)"><svg width="380" height="260" viewBox="0 0 380 260" overflow="hidden">${garden(id)}</svg></g>
        <rect x="110" y="40" width="380" height="260" fill="none" stroke="${L}" stroke-width="5"/>
        ${shoji(0, 28, 110, 272, 2, 7, true)}${shoji(490, 28, 110, 272, 2, 7, true)}
        <rect width="600" height="28" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>
        ${planks(0, 300, 600, 100)}
        <circle cx="300" cy="330" r="150" fill="url(#${id}w)"/>
        ${cup(420, 322)}`
    },

    desk: {
      alt: 'A low wooden desk in a lamp-lit room: an open book, a teapot and a cup of tea, with a shoji wall behind.',
      altAr: 'مكتب خشبي منخفض في غرفة مضاءة بمصباح ورقي: كتاب مفتوح وإبريق شاي وكوب، وجدار شوجي في الخلف.',
      svg: (id) => `
        <defs>${glowDef(id + 'l', C.glow, 0.9)}</defs>
        <rect width="600" height="400" fill="${C.shoji}"/>
        ${lattice(0, 0, 600, 262, 8, 4, 2.5, 0.4)}
        <rect width="600" height="262" fill="none" stroke="${L}" stroke-width="3"/>
        <circle cx="500" cy="210" r="250" fill="url(#${id}l)"/>
        ${tatami(0, 262, 600, 138)}
        <rect x="50" y="236" width="410" height="22" fill="${C.wood}" stroke="${L}" stroke-width="3"/>
        <rect x="76" y="258" width="16" height="64" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/><rect x="418" y="258" width="16" height="64" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>
        <path d="M96 236q50-22 100 0q50-22 100 0v-8q-50-22-100 0q-50-22-100 0z" fill="${C.cream}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
        <path d="M112 226q38-14 76 0M212 226q38-14 76 0" fill="none" stroke="${L}" stroke-width="1.6" opacity=".5"/>
        <ellipse cx="350" cy="220" rx="26" ry="19" fill="${C.sage}" stroke="${L}" stroke-width="3"/><path d="M372 214q18 4 4 20" fill="none" stroke="${L}" stroke-width="3"/>
        ${cup(396, 205)}
        <rect x="488" y="150" width="70" height="124" rx="12" fill="${C.shojiLit}" stroke="${L}" stroke-width="3"/>
        <path d="M523 150v124M488 191h70M488 232h70" stroke="${L}" stroke-width="1.8" opacity=".55"/>
        <rect x="506" y="274" width="34" height="14" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>`
    },

    morning: {
      alt: 'Morning sun through a shoji window casting a lattice of light onto the tatami floor, beside a low bookshelf and a small bonsai.',
      altAr: 'شمس الصباح تدخل من نافذة شوجي وترسم شبكة ضوء على أرضية التاتامي، بجانب رفّ كتب منخفض وشجرة بونساي صغيرة.',
      svg: (id) => `
        <defs><linearGradient id="${id}b" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.glow}" stop-opacity=".8"/><stop offset="1" stop-color="${C.glow}" stop-opacity=".25"/></linearGradient></defs>
        <rect width="600" height="400" fill="${C.washi}"/>
        ${shoji(40, 40, 260, 250, 4, 5, true)}
        ${tatami(0, 290, 600, 110)}
        <path d="M44 290h252l118 110H130z" fill="url(#${id}b)"/>
        <path d="M105 290L180 400M170 290L245 400M235 290L310 400M75 322h280M105 352h280M60 382h300" stroke="${C.woodDeep}" stroke-width="3" opacity=".28"/>
        <rect x="334" y="64" width="46" height="150" fill="${C.cream}" stroke="${L}" stroke-width="3"/>
        <path d="M357 92q-9 36 3 82" fill="none" stroke="${L}" stroke-width="6" stroke-linecap="round"/>
        <rect x="420" y="150" width="150" height="140" fill="${C.wood}" stroke="${L}" stroke-width="3"/>
        <path d="M420 220h150" stroke="${L}" stroke-width="3"/>
        <g stroke="${L}" stroke-width="2.5"><rect x="430" y="178" width="16" height="42" fill="${C.sage}"/><rect x="448" y="170" width="14" height="50" fill="${C.pink}"/><rect x="464" y="182" width="18" height="38" fill="${C.blue}"/><rect x="484" y="174" width="14" height="46" fill="${C.cream}"/><rect x="434" y="246" width="26" height="44" fill="${C.blue}"/><rect x="462" y="240" width="18" height="50" fill="${C.sage}"/><rect x="484" y="252" width="20" height="38" fill="${C.terracotta}"/></g>
        <path d="M500 150v-14h38v14z" fill="${C.woodDeep}" stroke="${L}" stroke-width="3"/>
        <path d="M519 136q-6-22 6-34M519 136q16-18 26-18M519 136q-18-10-30-6" fill="none" stroke="${C.sageDeep}" stroke-width="6" stroke-linecap="round"/>
        <circle cx="508" cy="100" r="16" fill="${C.sageDeep}" stroke="${L}" stroke-width="2.5"/><circle cx="534" cy="112" r="14" fill="${C.sage}" stroke="${L}" stroke-width="2.5"/>`
    },

    window: {
      alt: 'Someone sitting on a wooden veranda at dusk, back turned, looking out at a quiet garden and a pale moon.',
      altAr: 'شخص جالس على شرفة خشبية وقت الغروب، ظهره للمشاهد، يتأمل حديقة هادئة وقمرًا شاحبًا.',
      svg: (id) => `
        <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.blueDeep}"/><stop offset=".7" stop-color="#c9a99d"/><stop offset="1" stop-color="#e4cfa8"/></linearGradient>${glowDef(id + 'l', C.glow, 0.8)}</defs>
        <rect width="600" height="400" fill="url(#${id}s)"/>
        <circle cx="430" cy="110" r="34" fill="#f6ecd2"/>
        <path d="M0 250q90-50 190-18t170-10 240 14V320H0z" fill="#5d7185" opacity=".75"/>
        <path d="M0 290q120-34 250-8t200 0 150 10V320H0z" fill="${C.sageDeep}"/>
        <g stroke="${C.sageDeep}" stroke-width="7" stroke-linecap="round"><path d="M520 320V150M548 320V120M492 320V170" /></g>
        <path d="M514 190h12M542 160h12M486 210h12M514 250h12M542 220h12" stroke="${L}" stroke-width="3"/>
        <path d="M460 140q-30 8-50-4M470 200q-40 6-62-8" fill="none" stroke="${C.sage}" stroke-width="5" stroke-linecap="round"/>
        <g transform="translate(300 0)"><circle cx="0" cy="298" r="70" fill="url(#${id}l)"/>${lanternStone(0, 316).replace(/stroke-width="3"/g, 'stroke-width="2.5"')}</g>
        ${planks(0, 318, 600, 82)}
        ${shoji(0, 0, 80, 318, 2, 8, false)}
        <path d="M110 400v-80q0-52 52-52t52 52v80z" fill="${C.sage}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
        <circle cx="162" cy="226" r="30" fill="#f1d3bc" stroke="${L}" stroke-width="3"/>
        <path d="M130 224q2-34 32-32 28 2 32 32-18-14-36-8-16 4-28 8z" fill="${C.charcoal}"/>
        <circle cx="162" cy="190" r="12" fill="${C.charcoal}"/>
        ${cup(246, 320).replace(/<path class="steam"[^>]*\/>/, '')}`
    },

    train: {
      alt: 'A sunset over fields and a distant mountain seen from a train window, with hanging hand straps and a passenger in silhouette.',
      altAr: 'غروب الشمس فوق حقول وجبل بعيد من نافذة قطار، مع حلقات إمساك معلّقة وظلّ راكب.',
      svg: (id) => `
        <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.blue}"/><stop offset=".55" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.glow}"/></linearGradient></defs>
        <rect width="600" height="400" fill="#3b302a"/>
        <rect x="70" y="78" width="460" height="214" rx="16" fill="url(#${id}s)"/>
        <circle cx="400" cy="224" r="36" fill="#f9e1ae"/>
        <path d="M240 292L350 156L460 292z" fill="${C.blueDeep}" opacity=".85"/><path d="M326 186L350 156L374 186L362 181L350 192L338 181z" fill="#f4ede0"/>
        <path d="M70 268c80-30 150-6 230 0s160-28 230-6V292H70z" fill="${C.sage}"/>
        <path d="M70 284c120-14 260 8 460-6V292H70z" fill="#c4b57d"/>
        <path d="M70 118q115 36 230 0t230 0M70 138q115 36 230 0t230 0" fill="none" stroke="#3b302a" stroke-width="1.8" opacity=".7"/>
        <path d="M300 104v190" stroke="#3b302a" stroke-width="5"/>
        <rect x="70" y="78" width="460" height="214" rx="16" fill="none" stroke="#241c18" stroke-width="10"/><path d="M300 78v214" stroke="#241c18" stroke-width="9"/>
        <path d="M40 42h520" stroke="#bdb6a8" stroke-width="6" stroke-linecap="round"/>
        <g fill="none" stroke="#d9d1c0" stroke-width="4"><path d="M130 42v56M250 42v56M390 42v56M500 42v56"/><circle cx="130" cy="112" r="14"/><circle cx="250" cy="112" r="14"/><circle cx="390" cy="112" r="14"/><circle cx="500" cy="112" r="14"/></g>
        <rect y="318" width="600" height="82" fill="#46564f"/><path d="M0 318h600" stroke="#241c18" stroke-width="4"/><path d="M0 346h600" stroke="#2f3b36" stroke-width="3" stroke-dasharray="14 10"/>
        <path d="M96 400v-52q0-36 54-36t54 36v52z" fill="#1c1512"/><circle cx="150" cy="286" r="26" fill="#1c1512"/>`
    },

    night: {
      alt: 'A quiet lane at night in light rain: paper lanterns, a softly glowing vending machine, utility wires, and a person walking under an umbrella.',
      altAr: 'زقاق هادئ في الليل تحت مطر خفيف: فوانيس ورقية وآلة بيع مضيئة وأسلاك كهرباء، وشخص يمشي بمظلّة.',
      svg: (id) => `
        <defs>${glowDef(id + 'l', C.glow, 0.7)}${glowDef(id + 'v', '#cfe6f4', 0.75)}${glowDef(id + 'r', '#e0866a', 0.7)}</defs>
        <rect width="600" height="400" fill="${C.night}"/>
        <path d="M470 56a32 32 0 1 0 32 40 26 26 0 1 1-32-40z" fill="#f5ead0"/>
        <path d="M0 270V170l60-34 60 34v-28l60-30 60 30v128zM360 270V150h70V120l44-26 44 26v150z" fill="#3b4859" stroke="#222b38" stroke-width="3"/>
        <g fill="${C.glow}" opacity=".9"><rect x="22" y="188" width="20" height="26"/><rect x="132" y="170" width="20" height="26"/><rect x="190" y="200" width="20" height="26"/><rect x="410" y="170" width="18" height="24"/></g>
        <path d="M0 96q150 36 300 0t300 0M0 116q150 36 300 0t300 0" fill="none" stroke="#10151c" stroke-width="1.8"/>
        <path d="M296 70v230M268 96h56M274 118h44" stroke="#10151c" stroke-width="6"/>
        <circle cx="100" cy="226" r="62" fill="url(#${id}r)"/><circle cx="214" cy="236" r="56" fill="url(#${id}r)"/>
        <g stroke="#1a1410" stroke-width="2.5"><path d="M100 196v10M214 208v10" /><ellipse cx="100" cy="226" rx="17" ry="22" fill="${C.terracotta}"/><ellipse cx="214" cy="236" rx="15" ry="20" fill="${C.terracotta}"/></g>
        <path d="M86 220h28M86 232h28M200 230h28M200 242h28" stroke="#1a1410" stroke-width="1.6" opacity=".6"/>
        <circle cx="500" cy="236" r="90" fill="url(#${id}v)"/>
        <rect x="466" y="170" width="70" height="130" rx="6" fill="#dbe6ec" stroke="#222b38" stroke-width="3"/>
        <rect x="474" y="180" width="54" height="64" fill="#f8fcff"/><g><circle cx="486" cy="196" r="5" fill="${C.terracotta}"/><circle cx="502" cy="196" r="5" fill="${C.sage}"/><circle cx="518" cy="196" r="5" fill="${C.blue}"/><circle cx="486" cy="216" r="5" fill="${C.amber}"/><circle cx="502" cy="216" r="5" fill="${C.pink}"/><circle cx="518" cy="216" r="5" fill="${C.sage}"/></g>
        <rect x="480" y="256" width="40" height="28" fill="#2b3946"/>
        <rect y="300" width="600" height="100" fill="#1f2833"/>
        <path d="M100 310v70M214 316v66M500 310v80" stroke="${C.glow}" stroke-width="10" opacity=".14"/><path d="M0 346h600" stroke="${C.blueDeep}" stroke-width="3" stroke-dasharray="40 30"/>
        <path d="M360 318l-5-48M372 318l-3-48" stroke="#10151c" stroke-width="9" stroke-linecap="round"/><rect x="348" y="214" width="34" height="58" rx="12" fill="#10151c"/><circle cx="365" cy="202" r="12" fill="#10151c"/>
        <path d="M318 206q47-52 94 0z" fill="${C.pink}" stroke="#10151c" stroke-width="3"/>
        ${rainLines(0, 0, 600, 300, 34)}`
    },

    season: {
      alt: 'Red maple leaves on a branch, a few drifting down in soft autumn light.',
      altAr: 'أوراق قيقب حمراء على غصن، وبعضها يتساقط ببطء في ضوء خريفي ناعم.',
      svg: (id) => `
        <defs><linearGradient id="${id}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8e0e2"/><stop offset="1" stop-color="${C.cream}"/></linearGradient>
        <path id="${id}m" d="M0-19L4-11L10-15L8-6L17-8L12 0L16 6L7 6L6 14L0 10L0 20L0 10L-6 14L-7 6L-16 6L-12 0L-17-8L-8-6L-10-15L-4-11z" stroke="${L}" stroke-width="2" stroke-linejoin="round"/></defs>
        <rect width="600" height="400" fill="url(#${id}s)"/>
        <path d="M-10 70C110 100 200 60 330 120S500 150 620 100" fill="none" stroke="${C.woodDeep}" stroke-width="10" stroke-linecap="round"/>
        <path d="M210 92c20 34 14 66 40 96M410 132c-10 30 4 54-6 92" fill="none" stroke="${C.woodDeep}" stroke-width="5" stroke-linecap="round"/>
        <g>
          <use href="#${id}m" transform="translate(120 98) scale(1.5)" fill="${C.maple}"/><use href="#${id}m" transform="translate(180 84) scale(1.2) rotate(20)" fill="${C.amber}"/>
          <use href="#${id}m" transform="translate(262 120) scale(1.6) rotate(-15)" fill="${C.terracotta}"/><use href="#${id}m" transform="translate(340 134) scale(1.3) rotate(10)" fill="${C.maple}"/>
          <use href="#${id}m" transform="translate(452 150) scale(1.6) rotate(-8)" fill="${C.amber}"/><use href="#${id}m" transform="translate(530 124) scale(1.3) rotate(25)" fill="${C.terracotta}"/>
          <use href="#${id}m" transform="translate(252 200) scale(1.3) rotate(30)" fill="${C.maple}"/><use href="#${id}m" transform="translate(402 240) scale(1.4) rotate(-20)" fill="${C.amber}"/>
          <use href="#${id}m" transform="translate(150 262) scale(.9) rotate(50)" fill="${C.terracotta}" opacity=".9"/><use href="#${id}m" transform="translate(330 300) scale(.9) rotate(-40)" fill="${C.maple}" opacity=".9"/>
          <use href="#${id}m" transform="translate(480 310) scale(.8) rotate(15)" fill="${C.amber}" opacity=".9"/>
        </g>
        <path d="M0 356c120-26 220 8 340-8s190-22 260 4v52H0z" fill="${C.sage}"/><path d="M0 378c140-16 260 6 380-4s160-8 220 0v26H0z" fill="${C.sageDeep}"/>
        <ellipse cx="190" cy="372" rx="34" ry="8" fill="${C.stone}" stroke="${L}" stroke-width="2.5"/><ellipse cx="262" cy="386" rx="24" ry="6" fill="${C.stone}" stroke="${L}" stroke-width="2.5"/>`
    }
  };

  let counter = 0;

  /**
   * Returns a div holding the scene as an SVG.
   * Decorative scenes are hidden from assistive tech; meaningful ones get alt text.
   * options.live adds the gentle rain/steam motion (used on a few large images only).
   */
  function sceneElement(name, options) {
    const opts = options || {};
    const scene = SCENES[name] || SCENES.window;
    const id = 'sc' + (++counter) + '-';
    const wrap = document.createElement('div');
    wrap.className = 'art' + (opts.live ? ' art--live' : '') + (opts.className ? ' ' + opts.className : '');
    const alt = (document.documentElement.lang === 'ar' && scene.altAr) || scene.alt;
    const label = opts.decorative ? 'aria-hidden="true"' : `role="img" aria-label="${alt.replace(/"/g, '&quot;')}"`;
    // Content is static, authored in this file; it never contains user text.
    wrap.innerHTML = `<svg viewBox="${scene.viewBox || '0 0 600 400'}" preserveAspectRatio="xMidYMid slice" ${label} focusable="false">${scene.svg(id)}</svg>`;
    return wrap;
  }

  root.SCENES = SCENES;
  root.sceneElement = sceneElement;
})(window);
