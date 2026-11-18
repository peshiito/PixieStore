const pptxgen = require("pptxgenjs");
const fs = require("fs");
const { execFileSync } = require("child_process");
const path = require("path");

const P = "/home/pedro/Escritorio/Programacion/Proyectos/PixieShop";
const EX = P + "/design/exports/";
const HERE = __dirname;
const T = (n) => path.join(HERE, "titles", n + ".png");
const sizeOf = (f) => {
  const b = fs.readFileSync(f);
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
};

const C = { merino: "F5EEDD", rock: "84B3CE", venice: "16587B", ink: "0F4462", deep: "123F57", abyss: "0B3A55", soft: "CFE2EC", white: "FFFFFF", mist: "E7EEEC" };
const BODY = "Calibri";
const FG = process.env.FG === "1";

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.title = "Pixie Store · Propuesta de diseño";
pres.author = "Pixie Store";

let order = 0;
const nm = (kind) => `${kind}_${++order}`;
const shadow = () => ({ type: "outer", color: C.abyss, blur: 18, offset: 6, angle: 90, opacity: 0.28 });

function title(slide, name, x, y, h) {
  const s = sizeOf(T(name));
  slide.addImage({ path: T(name), x, y, h, w: (h * s.w) / s.h, objectName: nm("a"), altText: "" });
}
function text(slide, str, o) {
  slide.addText(str, { isTextBox: true, fontFace: BODY, color: C.deep, fontSize: 16, margin: 0, valign: "top", objectName: nm("a"), ...o });
}
function frosted(slide, x, y, w, h, dark) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.12, y: y - 0.12, w: w + 0.24, h: h + 0.24, rectRadius: 0.42, fill: { color: dark ? C.venice : C.merino, transparency: 55 }, line: { type: "none" }, objectName: nm("a") });
  order--;
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.34, fill: { color: dark ? C.venice : C.merino, transparency: 6 }, line: { type: "none" }, shadow: shadow(), objectName: nm("a") });
  order--;
}
function card(slide, x, y, w, h, fill) {
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.3, fill: { color: fill || C.white }, line: { type: "none" }, shadow: shadow(), objectName: nm("a") });
}
function pill(slide, str, x, y, w, dark) {
  slide.addText(str, { isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.2, x, y, w, h: 0.42, fill: { color: dark ? C.venice : C.rock }, color: dark ? C.merino : C.ink, fontFace: BODY, fontSize: 14, bold: true, align: "center", valign: "middle", margin: 0, objectName: nm("a") });
}
function video(slide, file, poster, o) {
  if (FG) return;
  slide.addMedia({ type: "video", path: path.join(HERE, file), cover: poster ? "image/png;base64," + fs.readFileSync(poster).toString("base64") : undefined, objectName: "v_" + file, ...o });
}
function phone(slide, img, x, y, w, viewH) {
  const s = sizeOf(img);
  slide.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: x - 0.09, y: y - 0.09, w: w + 0.18, h: viewH + 0.18, rectRadius: 0.32, fill: { color: C.deep }, line: { type: "none" }, shadow: shadow(), objectName: nm("a") });
  order--;
  const h = (w * s.h) / s.w;
  let file = img, hh = h;
  if (h > viewH) {
    const cropH = Math.round((s.w * viewH) / w);
    file = path.join(HERE, "cache", "crop-" + path.basename(img));
    execFileSync("magick", [img, "-crop", `${s.w}x${cropH}+0+0`, "+repage", file]);
    hh = viewH;
  }
  slide.addImage({ path: file, x, y, w, h: hh, objectName: nm("a"), altText: path.basename(img, ".png").replace(/-/g, " ") });
  order--;
}
function circle(src) {
  const out = path.join(HERE, "cache", "circle-" + path.basename(src));
  if (!fs.existsSync(out)) execFileSync("magick", [src, "-alpha", "set", "-resize", "900x900^", "-gravity", "center", "-extent", "900x900", "(", "-size", "900x900", "xc:none", "-fill", "white", "-draw", "circle 450,450 450,6", ")", "-compose", "DstIn", "-composite", "PNG32:" + out]);
  return out;
}
const notes = (s, n) => s.addNotes(n);

// 1 · Portada
{
  order = 0;
  const s = pres.addSlide();
  s.background = FG ? { color: process.env.FGBG || "000000" } : { color: "94C2DE" };
  video(s, "ocean-surface.mp4", path.join(HERE, "poster-surface.png"), { x: 0, y: 0, w: 13.333, h: 7.5 });
  frosted(s, 0.75, 1.35, 6.4, 4.8, true);
  pill(s, "PROPUESTA DE DISEÑO · ETAPA 1", 1.2, 1.8, 3.6, false);
  s.addImage({ path: P + "/assets/hero/shop-logo-v2.png", x: 1.2, y: 2.25, w: 1.7, h: (1.7 * 651) / 1362, objectName: nm("a"), altText: "shop" });
  s.addImage({ path: P + "/assets/hero/pixie-logo-v2.png", x: 1.0, y: 2.95, w: 5.2, h: (5.2 * 1271) / 3383, objectName: nm("a"), altText: "PIXIE" });
  text(s, "Los precios que buscás, con la mejor tienda.", { x: 1.2, y: 4.95, w: 5.8, h: 0.5, fontSize: 20, bold: true, color: C.merino });
  text(s, "Para Ezequiel · noviembre 2026", { x: 1.2, y: 5.72, w: 5.6, h: 0.4, fontSize: 15, bold: true, color: C.soft });
  s.addImage({ path: circle(P + "/assets/logo-shop-pixie.png"), x: 8.0, y: 1.25, w: 4.4, h: 4.4, objectName: nm("a"), altText: "Logo shop Pixie" });
  notes(s, "Arrancamos con la propuesta visual. El fondo es el agua animada que va a tener la página. Esta etapa es solo diseño: todavía no hay código.");
}

// 2 · La idea
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.merino };
  text(s, "LA IDEA", { x: 0.75, y: 0.6, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  title(s, "idea", 0.75, 1.05, 0.7);
  text(s, "Desde el celular, sin crear cuenta.", { x: 0.75, y: 1.95, w: 10, h: 0.5, fontSize: 22, bold: true, color: C.deep });
  const items = [
    ["1", "Elegís tu paquete", "Lista de precios clara, con el más pedido destacado. Se arma un carrito."],
    ["2", "Pegás tu ID", "Nombre, teléfono e ID de jugador. Con «recordarme» la próxima vez no hace falta."],
    ["3", "Pagás y llega solo", "Chytapay confirma el pago y la recarga entra automática por la API del proveedor."],
  ];
  items.forEach(([n, h, d], i) => {
    const x = 0.75 + i * 4.05;
    card(s, x, 3.0, 3.75, 3.6);
    text(s, n, { x: x + 0.4, y: 3.25, w: 1, h: 1.0, fontSize: 60, bold: true, color: C.rock, fontFace: "Calibri" });
    order--;
    text(s, h, { x: x + 0.4, y: 4.35, w: 3.0, h: 0.5, fontSize: 22, bold: true, color: C.venice });
    order--;
    text(s, d, { x: x + 0.4, y: 4.95, w: 3.0, h: 1.4, fontSize: 15, color: C.deep });
    order--;
  });
  notes(s, "La prioridad es mobile: la mayoría compra desde el teléfono. Todo el recorrido se resuelve sin registrarse.");
}

// 3 · Identidad
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.merino };
  text(s, "IDENTIDAD", { x: 0.75, y: 0.6, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  title(s, "identidad", 0.75, 1.05, 0.7);
  const sw = [["Merino", "#F5EEDD · fondo", C.merino, C.venice], ["Rock Blue", "#84B3CE · agua y acentos", C.rock, C.ink], ["Venice Blue", "#16587B · texto y botones", C.venice, C.merino]];
  sw.forEach(([n, h, f, tc], i) => {
    const x = 0.75 + i * 4.05;
    s.addText([{ text: n, options: { fontSize: 30, bold: true, breakLine: true } }, { text: h, options: { fontSize: 15, bold: true } }], { isTextBox: true, shape: pres.shapes.ROUNDED_RECTANGLE, rectRadius: 0.3, x, y: 2.2, w: 3.75, h: 2.3, fill: { color: f }, line: i === 0 ? { color: C.rock, width: 2 } : { type: "none" }, color: tc, fontFace: BODY, valign: "bottom", margin: 18, shadow: shadow(), objectName: nm("a") });
  });
  const mk = sizeOf(T("modak"));
  s.addImage({ path: T("modak"), x: 0.75, y: 5.0, h: 0.9, w: (0.9 * mk.w) / mk.h, objectName: nm("a"), altText: "Modak" });
  text(s, "Títulos · reemplazo gratuito de Simple Bubble", { x: 0.75, y: 6.05, w: 4.5, h: 0.4, fontSize: 14, color: C.deep });
  order--;
  text(s, "Nunito", { x: 5.6, y: 5.05, w: 3, h: 0.8, fontSize: 40, bold: true, color: C.venice, fontFace: "Nunito" });
  text(s, "Textos, precios y formularios", { x: 5.6, y: 6.05, w: 3.5, h: 0.4, fontSize: 14, color: C.deep });
  order--;
  text(s, "Todos los textos cumplen contraste WCAG: mínimo 4.5:1 en texto chico.", { x: 9.3, y: 5.15, w: 3.3, h: 1.2, fontSize: 15, color: C.deep });
  notes(s, "Cuando tengamos la licencia de Simple Bubble se cambia Modak sin tocar el resto del diseño.");
}

// 4 · El fondo
{
  order = 0;
  const s = pres.addSlide();
  s.background = FG ? { color: process.env.FGBG || "000000" } : { color: C.venice };
  video(s, "ocean-descent.mp4", path.join(HERE, "poster-descent.png"), { x: 0, y: 0, w: 13.333, h: 7.5 });
  frosted(s, 0.75, 0.75, 6.3, 6.0);
  text(s, "EL FONDO", { x: 1.2, y: 1.15, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  order--;
  title(s, "oceano", 1.2, 1.62, 0.33);
  text(s, "Mientras la persona baja por la página, el agua se vuelve más profunda.", { x: 1.2, y: 2.3, w: 5.4, h: 0.8, fontSize: 17, bold: true, color: C.deep });
  const stops = [
    ["Superficie", "Inicio", "Agua clara con luz que ondula, como la de una pileta."],
    ["Profundidad", "Reseñas", "Rayos de sol y burbujas que suben."],
    ["Abismo", "Paquetes", "Azul profundo con partículas que caen."],
  ];
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 1.38, y: 3.35, w: 0.12, h: 3.05, rectRadius: 0.06, fill: { color: C.rock }, line: { type: "none" }, objectName: nm("a") });
  stops.forEach(([n, where, d], i) => {
    const y = 3.25 + i * 1.08;
    s.addShape(pres.shapes.OVAL, { x: 1.24, y: y + 0.02, w: 0.4, h: 0.4, fill: { color: [C.rock, C.venice, C.abyss][i] }, line: { color: C.white, width: 3 }, objectName: nm("a") });
    order--;
    s.addText([{ text: n + "  ", options: { bold: true, color: C.ink, fontSize: 18 } }, { text: "· " + where, options: { bold: true, color: C.venice, fontSize: 14 } }], { isTextBox: true, x: 1.9, y, w: 4.8, h: 0.4, fontFace: BODY, margin: 0, objectName: nm("a") });
    order--;
    text(s, d, { x: 1.9, y: y + 0.42, w: 4.8, h: 0.5, fontSize: 14, color: C.deep });
  });
  notes(s, "Esto que se ve es el fondo real en movimiento. En la web va atado al scroll. Con «reducir movimiento» activado queda como imagen quieta.");
}

// 5 · Inicio mobile
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.merino };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.86, y: 0.41, w: 3.48, h: 6.68, rectRadius: 0.36, fill: { color: C.deep }, line: { type: "none" }, shadow: shadow(), objectName: nm("a") });
  order--;
  video(s, "phone-m1.mp4", path.join(HERE, "phone-m1-poster.png"), { x: 0.95, y: 0.5, w: 3.3, h: 6.5 });
  text(s, "INICIO · MOBILE", { x: 5.2, y: 0.9, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  title(s, "inicio", 5.2, 1.35, 0.5);
  const rows = [["Hero", "Tarjeta póster: el personaje sale del logo, delante de «PIXIE» con sus colores."], ["Reseñas", "Clientes reales, con estrellas y captura de su recarga."], ["Paquetes", "Lista de precios fácil de tocar con el pulgar."], ["Carrito", "Barra fija abajo con el total, siempre a mano."]];
  rows.forEach(([k, d], i) => {
    const y = 2.5 + i * 1.1;
    pill(s, k, 5.2, y + 0.05, 1.5, true);
    order--;
    text(s, d, { x: 6.95, y, w: 5.6, h: 0.9, fontSize: 17, color: C.deep, valign: "middle" });
  });
  notes(s, "El celular se desplaza solo para mostrar la página entera. Una sola barra de navegación; al scrollear, la tarjeta del hero se achica y queda como logo en el header.");
}

// 6 · Compra
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.mist };
  text(s, "EL RECORRIDO DE COMPRA", { x: 0.75, y: 0.5, w: 6, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  title(s, "compra", 0.75, 0.95, 0.6);
  const ph = [["m3-carrito-datos", "1 · Carrito y datos"], ["m4-pago", "2 · Pago"], ["m5-estado-pedido", "3 · Estado"], ["m7-pedido-entregado", "4 · ¡Entregado!"]];
  ph.forEach(([f, l], i) => {
    const x = 0.95 + i * 3.1;
    phone(s, EX + f + ".png", x, 1.95, 2.55, 4.45);
    order++;
    pill(s, l, x + 0.1, 6.6, 2.35, true);
    order--;
  });
  notes(s, "Carrito como panel desde abajo, con nombre, teléfono, ID y «recordar mis datos». Estados del pedido como en tu boceto. Al final, agradecimiento con el logo e invitación a dejar reseña.");
}

// 7 · Seguimiento y reseñas
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.merino };
  text(s, "DESPUÉS DE COMPRAR", { x: 0.75, y: 0.6, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  title(s, "seguimiento", 0.75, 1.05, 0.5);
  card(s, 0.75, 2.2, 5.9, 2.0);
  text(s, "Seguí tu pedido", { x: 1.15, y: 2.5, w: 5.1, h: 0.45, fontSize: 22, bold: true, color: C.venice });
  order--;
  text(s, "Con el número de pedido (por ejemplo AB790-803) o con el ID de jugador, que muestra todo el historial.", { x: 1.15, y: 3.05, w: 5.1, h: 1.0, fontSize: 15, color: C.deep });
  order--;
  card(s, 0.75, 4.5, 5.9, 2.2);
  text(s, "Reseñas con moderación", { x: 1.15, y: 4.8, w: 5.1, h: 0.45, fontSize: 22, bold: true, color: C.venice });
  order--;
  text(s, "4 y 5 estrellas se publican solas. De 1 a 3 llegan al panel para que puedas responder y ayudar antes de publicarlas.", { x: 1.15, y: 5.35, w: 5.1, h: 1.1, fontSize: 15, color: C.deep });
  order--;
  phone(s, EX + "m6-seguir-pedido.png", 7.4, 1.0, 2.5, 5.4);
  order++;
  phone(s, EX + "m8-dejar-resena.png", 10.3, 1.0, 2.5, 5.4);
  order++;
  notes(s, "Nadie crea cuenta: el historial se consulta por ID de jugador. Las reseñas pueden llevar captura del juego.");
}

// 8 · Desktop
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.mist };
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.66, y: 1.06, w: 7.48, h: 4.78, rectRadius: 0.2, fill: { color: C.deep }, line: { type: "none" }, shadow: shadow(), objectName: nm("a") });
  order--;
  video(s, "browser-d1.mp4", path.join(HERE, "browser-d1-poster.png"), { x: 0.75, y: 1.15, w: 7.3, h: 4.6 });
  text(s, "EN COMPUTADORA", { x: 8.6, y: 1.0, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  title(s, "desktop", 8.6, 1.45, 0.34);
  text(s, "Título y botones a la izquierda, tarjeta póster a la derecha. Paquetes en dos columnas.", { x: 8.6, y: 2.0, w: 4.1, h: 0.9, fontSize: 15, color: C.deep });
  s.addImage({ path: EX + "d2-carrito-drawer.png", x: 8.6, y: 3.05, w: 4.0, h: 2.5, objectName: nm("a"), altText: "Carrito como panel lateral" });
  text(s, "Carrito como panel a la derecha", { x: 8.6, y: 5.65, w: 4, h: 0.4, fontSize: 13, color: C.deep });
  order--;
  notes(s, "En computadora el carrito se abre como panel lateral y el agradecimiento muestra el mensaje a la izquierda y el logo a la derecha, como en tu boceto.");
}

// 9 · Animaciones
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.venice };
  text(s, "ANIMACIONES", { x: 0.75, y: 0.6, w: 4, h: 0.4, fontSize: 14, bold: true, color: C.rock, charSpacing: 2 });
  title(s, "animaciones", 0.75, 1.05, 0.6);
  s.addImage({ path: P + "/assets/hero/personaje-v2.png", x: 10.8, y: 0.25, w: 1.9, h: 2.7, objectName: nm("a"), altText: "" });
  const cards = [["Logo al header", "Al scrollear, la tarjeta se desliza fluida hasta la barra de arriba."], ["Océano con scroll", "El agua ondula y se vuelve más profunda al bajar."], ["Aparición", "Cada sección entra al llegar a la pantalla: carga solo lo que se ve."], ["Flotación y brillo", "El personaje flota y una luz cruza el botón de compra."]];
  cards.forEach(([h, d], i) => {
    const x = 0.75 + i * 3.05;
    card(s, x, 3.3, 2.8, 3.3);
    s.addShape(pres.shapes.OVAL, { x: x + 0.35, y: 3.65, w: 0.7, h: 0.7, fill: { color: C.rock }, line: { type: "none" }, objectName: nm("a") });
    order--;
    text(s, String(i + 1), { x: x + 0.35, y: 3.65, w: 0.7, h: 0.7, fontSize: 22, bold: true, color: C.ink, align: "center", valign: "middle" });
    order--;
    text(s, h, { x: x + 0.3, y: 4.55, w: 2.4, h: 0.45, fontSize: 17, bold: true, color: C.venice });
    order--;
    text(s, d, { x: x + 0.35, y: 5.1, w: 2.2, h: 1.3, fontSize: 14, color: C.deep });
    order--;
  });
  notes(s, "Con «reducir movimiento» activado en el teléfono, las animaciones se apagan solas. Están pensadas para no trabar la página en celulares.");
}

// 10 · Próximos pasos
{
  order = 0;
  const s = pres.addSlide();
  s.background = { color: C.merino };
  text(s, "PRÓXIMOS PASOS", { x: 0.75, y: 0.6, w: 5, h: 0.4, fontSize: 14, bold: true, color: C.venice, charSpacing: 2 });
  title(s, "pasos", 0.75, 1.05, 0.7);
  const et = ["Frontend de la tienda (React)", "Backend, base de datos y pedidos", "Pagos con Chytapay", "API del proveedor: entrega automática", "Reseñas y moderación", "Panel de administración con permisos", "Publicación"];
  et.forEach((e, i) => {
    const y = 2.2 + i * 0.62;
    s.addShape(pres.shapes.OVAL, { x: 0.75, y, w: 0.46, h: 0.46, fill: { color: i === 0 ? C.venice : C.rock }, line: { type: "none" }, objectName: nm("a") });
    order--;
    text(s, String(i + 2), { x: 0.75, y, w: 0.46, h: 0.46, fontSize: 15, bold: true, color: i === 0 ? C.merino : C.ink, align: "center", valign: "middle" });
    order--;
    text(s, e, { x: 1.4, y: y + 0.02, w: 5.2, h: 0.42, fontSize: 17, bold: i === 0, color: C.deep, valign: "middle" });
  });
  card(s, 7.3, 2.1, 5.3, 4.6);
  text(s, "Necesitamos de vos", { x: 7.75, y: 2.45, w: 4.5, h: 0.5, fontSize: 22, bold: true, color: C.venice });
  order--;
  text(s, [
    { text: "El logo final, solo letras", options: { bullet: true, breakLine: true } },
    { text: "La ilustración del personaje en alta calidad", options: { bullet: true, breakLine: true } },
    { text: "Licencia de la fuente Simple Bubble (opcional)", options: { bullet: true, breakLine: true } },
    { text: "Lista de paquetes y precios reales", options: { bullet: true, breakLine: true } },
    { text: "Acceso a la API del proveedor y a Chytapay", options: { bullet: true } },
  ], { x: 7.75, y: 3.1, w: 4.5, h: 3.3, fontSize: 16, color: C.deep, paraSpaceAfter: 8 });
  order--;
  notes(s, "Las reseñas, precios y conteos de las pantallas son de ejemplo. Con tu aprobación del diseño arrancamos la etapa 2.");
}

// 11 · Gracias
{
  order = 0;
  const s = pres.addSlide();
  s.background = FG ? { color: process.env.FGBG || "000000" } : { color: C.abyss };
  video(s, "ocean-deep.mp4", path.join(HERE, "poster-deep.png"), { x: 0, y: 0, w: 13.333, h: 7.5 });
  s.addImage({ path: circle(P + "/assets/logo-shop-pixie.png"), x: 5.29, y: 0.9, w: 2.75, h: 2.75, objectName: nm("a"), altText: "Logo shop Pixie" });
  const g = sizeOf(T("gracias"));
  s.addImage({ path: T("gracias"), x: (13.333 - (1.25 * g.w) / g.h) / 2, y: 4.0, h: 1.25, w: (1.25 * g.w) / g.h, objectName: nm("a"), altText: "¡Gracias!" });
  text(s, "¿Qué te gustó y qué cambiarías?", { x: 2.5, y: 5.6, w: 8.333, h: 0.6, fontSize: 24, bold: true, color: C.soft, align: "center" });
  notes(s, "Cerramos con preguntas. Lo que ajustemos acá se aplica antes de empezar a programar.");
}

pres.writeFile({ fileName: path.join(HERE, FG ? "fg.pptx" : "raw.pptx") }).then((f) => console.log("written", f));
