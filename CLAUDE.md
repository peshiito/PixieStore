# Pixie Store — Tienda de diamantes

## Contexto
Cliente: **Ezequiel**. Tienda web donde la gente compra diamantes (recarga por **ID de jugador**) sin crear cuenta.
Proyecto hermano de `../StarPage` (mismo modelo de negocio: Chytapay, proveedor con API, entrega automática).
Antes de resolver algo de pagos o proveedor, leer `../StarPage/CLAUDE.md` y `../StarPage/docs/` (`chytapay.md`, `recargasamerica-api.md`) para reutilizar.

## Forma de trabajo
- Por **etapas**. Cada etapa: plan mode → preguntas → plan aprobado → implementación.
- Al cerrar cada etapa: commit + push a `github.com/peshiito/PixieStore` (público) **sin pedir confirmación**.
- En tareas de diseño/UI cargar las skills de diseño (`impeccable`, `frontend-design`, `emil-design-eng`, `apple-design`, `ui-ux-pro-max`, `web-interface-guidelines`, etc.).
- Diseño: primero **Pencil** (`pixie-store.pen`, solo vía MCP `pencil`; exports en `design/exports/`); si no convence, **Stitch**.

## Etapas
1. Diseño de pantallas (Pencil) ✔
2. Frontend de la tienda ← siguiente
3. Backend, base de datos y pedidos
4. Pagos (Chytapay + otros métodos)
5. Integración API del proveedor (entrega automática)
6. Reseñas y moderación
7. Panel de administración (multiusuario con permisos)
8. Deploy

## Stack
- Frontend: React + Vite (JSX).
- Backend: Node + Express + Docker.

## Flujo del comprador (boceto: `assets/ref/boceto-flujo.pdf`)
1. Hero con logo + bienvenida + 2 botones. Al scrollear, el logo se desliza fluido hasta el header (no "teletransporte").
2. Las secciones aparecen al entrar en pantalla (lazy, solo se carga lo visible).
3. Reseñas → Productos → carrito.
4. Detalle de compra: nombre, teléfono, ID de jugador y "Recordarme" (sin cuenta de usuario).
5. Pago (Chytapay; después otros métodos).
6. Estado: Pago en verificación → Pedido pendiente → Pedido entregado. Si el pago falla, revisión manual.
7. Pedido entregado: mensaje de agradecimiento a la izquierda + ilustración del personaje a la derecha + invitación a dejar reseña.
- **Seguimiento:** por número de pedido (formato `AB790-803`) o por ID de jugador (historial).
- **Reseñas:** las dejan los clientes después de comprar, con captura opcional. 1–3 estrellas → moderación en el panel; 4–5 → se publican solas.
- **Mobile-first**: la mayoría compra desde el teléfono.

## Identidad visual (FIJA — no proponer otra paleta)
| Token | Hex | Uso |
|---|---|---|
| Merino | `#F5EEDD` | Fondo |
| Rock Blue | `#84B3CE` | Superficies, acentos, texto grande |
| Venice Blue | `#16587B` | Texto, botones |

- Títulos: fuente burbuja (referencia: "Simple Bubble" de Sahira Studio, comercial). Por ahora una gratuita de Google Fonts parecida.
- Logo: placeholder `assets/logo-shop-pixie.png` hasta el rediseño (será solo letras).
- Referencias: mikasoff.store (logo en el header, estructura), gamefast.lat.

## Decisiones de diseño (Etapa 1)
- Fuentes actuales: **Modak** (títulos, placeholder de Simple Bubble) + **Nunito** (cuerpo). Ambas de Google Fonts.
- Imagen de producto: tile con gradiente radial Rock Blue → Venice Blue + gemas en Merino (más gemas = paquete más grande). No usar arte de Garena/Free Fire.
- Estados del pedido (textos del PDF): Pago en verificación → Pedido pendiente → Pedido entregado. Formato de pedido `AB790-803`.
- Mobile: carrito como bottom sheet + barra de carrito fija abajo. Desktop: drawer a la derecha.
- Especificación de motion (logo hero→header, aparición progresiva, reduced-motion) en el frame `00 · Sistema de diseño + motion` del .pen.
- Los datos de reseñas, precios y conteos de las pantallas son de ejemplo, no reales.
