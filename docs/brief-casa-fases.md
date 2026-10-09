# 🎨 BRIEF DE ILUSTRACIÓN — "LA SUPERCASA" EN 21 FASES DE CONSTRUCCIÓN
### Fundación Segundos de Vida · Landing de recaudación · Octubre 2026

> **Para la IA que va a generar las imágenes:** lee el documento completo antes de empezar. Lo más importante es la **sección 4 (consistencia)**: las 21 imágenes se van a mostrar una encima de otra en una página web, como si fueran los cuadros de una animación. Si la cámara, el encuadre o el edificio se mueven un solo píxel entre una imagen y otra, la animación se ve rota.

---

## 1. CONTEXTO

La **Fundación Segundos de Vida** (Bogotá, Colombia) está construyendo **LA SUPERCASA**: un hogar para 15 niños y niñas en tratamiento y sus cuidadores. Está en Galerías, un barrio seguro, central, con transporte masivo y muy bonito de Bogotá.

Los personajes de la fundación son los **Super Calvitos**: niños calvos con antifaz de colores y capa de superhéroe, en estilo 3D caricaturesco.

En la landing, la casa se ve **construyéndose a medida que llegan las donaciones**. La meta es de $250.000.000 COP, y **cada 5 % del recaudo debe aparecer algo nuevo en la casa**. Por eso necesitamos **21 imágenes**: 0 %, 5 %, 10 % … 95 % y 100 %.

La primera imagen es la obra gris, que es el estado real hoy. La última es la casa terminada y llena de vida. Esa última debe verse **igual al dibujo oficial** que se adjunta (`supercasa-render.webp`).

---

## 2. ENTREGABLES

| # | Archivo | Qué es |
|---|---|---|
| 21 | `supercasa-000.png` … `supercasa-100.png` | Una imagen por cada 5 % (ver tabla de la sección 6) |
| 1 | `supercasa-fondo.png` | *(Opcional, recomendado)* Solo el fondo, sin el edificio: cielo, ciudad, calle |
| 1 | `supercasa-hoja-de-contacto.png` | Las 21 imágenes en miniatura en una cuadrícula de 7 × 3, para revisarlas de un vistazo |

**Nombres de archivo:** siempre con tres dígitos: `supercasa-000.png`, `supercasa-005.png`, `supercasa-010.png` … `supercasa-095.png`, `supercasa-100.png`.

---

## 3. FORMATO TÉCNICO (obligatorio)

| Parámetro | Valor |
|---|---|
| **Tamaño** | **1600 × 1200 px** (proporción **4:3**, horizontal) — exactamente igual en las 21 |
| **Formato de entrega** | **PNG** sin compresión con pérdida (nosotros lo convertimos a WebP para la web) |
| **Color** | sRGB |
| **Fondo** | Opaco (cielo incluido). No transparente |
| **Texto** | Ningún texto en la imagen, **excepto** el letrero "LA SUPER CASA" (desde la fase 75 %) |
| **Marcas de agua / firmas** | Ninguna |
| **Márgenes de seguridad** | Nada importante a menos de **80 px** de los bordes (en celular la imagen se recorta un poco a los lados) |

Si la herramienta no permite 1600 × 1200 exactos, usa cualquier tamaño **4:3** de al menos 1200 × 900, pero **el mismo en las 21 imágenes**.

---

## 4. CONSISTENCIA ENTRE FASES (lo más importante)

Las 21 imágenes se cruzan con un fundido suave en la web. Para que parezca que la casa *crece* y no que cambia de dibujo:

1. **Cámara fija.** Vista frontal, a la altura de la calle y levemente desde abajo, igual que el dibujo oficial. Sin zoom, sin rotar, sin cambiar la perspectiva.
2. **Edificio en el mismo lugar y del mismo tamaño** en todas las fases. Ocupa el **centro-izquierda** del cuadro: más o menos del 25 % al 65 % del ancho y del 12 % al 88 % del alto. El letrero queda a la derecha.
3. **Fondo idéntico** en las 21: el mismo cielo, las mismas nubes, el mismo sol arriba a la derecha, los mismos edificios de colores de la ciudad, la misma calle y el mismo andén. Lo único que cambia es la casa y lo que la rodea en primer plano.
4. **Misma luz.** Día soleado, sol arriba a la derecha y sombras suaves hacia la izquierda. La luz no cambia entre fases; las luces de la casa se encienden, pero el día sigue siendo de día.
5. **Acumulativo.** Cada fase incluye todo lo de la anterior, más lo nuevo. Solo se quitan elementos de obra (grúa, andamio, cerca y materiales) donde la tabla lo indica.
6. **Un cambio visible por fase.** Cada 5 % debe notarse a simple vista en un celular, aunque la imagen sea pequeña (≈ 340 px de ancho).

### Método de trabajo recomendado (para mantener la consistencia)
Las IAs de imagen suelen cambiar el dibujo cuando se les pide "la misma imagen, pero…". Para evitarlo:

1. **Primero genera la fase 100 %**, lo más fiel posible al dibujo oficial, en 1600 × 1200. Esta es la **imagen maestra**.
2. **Trabaja hacia atrás con edición de imagen** (*inpainting*, "editar imagen"): 100 → 95 → 90 → … → 0. En cada paso, **quita** lo que agrega esa fase y deja el resto intacto. Quitar cosas de una imagen conserva mucho mejor la consistencia que inventarlas.
3. En las fases de obra gris (0 % a 35 %), la fachada se reemplaza por concreto gris. Hazlo con edición sobre la misma imagen, para que ventanas, pisos y proporciones queden en el mismo lugar.
4. Al terminar, **superpón las 21 imágenes** (por ejemplo, como capas en Photoshop, Figma o Photopea) y revisa que el edificio no "salte".

---

## 5. ESTILO VISUAL

**Referencia principal:** `supercasa-render.webp` (adjunto). Respeta su estilo:

- **3D caricaturesco tipo juguete / plastilina suave**, como una película animada infantil: formas redondeadas, materiales limpios y brillantes, sin texturas sucias ni realismo fotográfico.
- **Alegre, cálido y esperanzador.** Nada triste, oscuro ni hospitalario: no aparecen hospitales, ambulancias, sueros ni batas médicas.
- **Paleta de la fundación:** azul cielo `#6EC1F0`, rojo `#E53935`, amarillo `#FFD400`, verde `#4CAF50`, rosa `#F06292` y violeta `#8E5CC9`, sobre cielo celeste.
- Coherente con los Super Calvitos oficiales (`calvito.webp`, `calvita.webp`, adjuntos).

### Descripción del edificio terminado (fase 100 %)
- **Edificio de 5 niveles** (planta baja + 4 pisos), fachada de **ladrillo beige claro** con juntas finas y esquinas limpias.
- **Ventanas grandes de marco negro**, 3 por piso, con vidrio dividido en cuadros. Por dentro se ven luz cálida amarilla, lámparas colgantes y plantas.
- En la **planta baja y el primer piso, al lado derecho**, hay un **gran ventanal en forma de casa** (con techo en punta, a dos aguas) con **marco verde lima** (`#C6D930`). Por dentro se ven una sala acogedora (sofá morado, plantas y lámpara).
- **Azotea con jardín:** jardineras de madera, arbustos redondos y enredaderas que caen un poco por la fachada, más una guirnalda de bombillos cálidos.
- **Letrero de superhéroe** a la derecha, colgado de un **soporte negro** que sale del edificio, con dos lamparitas: es un **escudo** con borde azul, fondo amarillo y una banda roja en diagonal. Dice **"LA" (pequeño), "SUPER" (blanco sobre la banda roja) y "CASA" (rojo)**. Es el único texto de las imágenes.
- **Reja negra ornamental** en el frente, de barrotes verticales, a la altura de la planta baja.
- **Árboles redondos** (copas verdes esféricas, troncos cafés) a ambos lados y **arbustos** a lo largo de la reja.
- **Farol** de calle a la derecha.
- **Fondo:** ciudad de juguete con edificios de colores (azul, amarillo, rojo y verde) más bajos que la SUPERCASA, cielo celeste con nubes blancas esponjosas y sol amarillo arriba a la derecha.

---

## 6. LAS 21 FASES

Cada fila dice **qué se ve nuevo** respecto a la anterior. Las fases marcadas con ⭐ son **hitos**: en la web van acompañadas de un mensaje de celebración, así que el cambio debe ser más notorio.

| Archivo | % | Qué aparece (o desaparece) | Notas de dibujo |
|---|---|---|---|
| `supercasa-000` | 0 % | **Obra gris.** Estructura de concreto gris con columnas y placas visibles, **huecos oscuros** donde irán las ventanas y el ventanal-casa (ya con su forma en punta), varillas de acero saliendo arriba, **grúa amarilla** a la izquierda con el brazo sobre el edificio, **andamio** metálico en el costado izquierdo y **cerca de obra** naranja y blanca al frente | Es el estado real de hoy. Debe verse sólida pero "gris y fría". Sin plantas, sin luces, sin letrero |
| `supercasa-005` | 5 % | Llegan los **materiales**: pila de ladrillos y bultos de cemento en el andén, a la derecha | Pequeño pero visible |
| `supercasa-010` | 10 % | **Placa de cubierta** terminada arriba (se tapan las varillas) | La azotea se ve plana y lista |
| `supercasa-015` | 15 % | **Baranda negra** en la azotea. La grúa sostiene una carga (palé de ladrillos) | Obra "en movimiento" |
| `supercasa-020` | 20 % | **Jardineras de madera** vacías a lo largo de la azotea | |
| `supercasa-025` | 25 % | **Primeros brotes** verdes pequeños en las jardineras | |
| `supercasa-030` | 30 % | **Arbustos redondos** en la azotea, con algunas florecitas | |
| `supercasa-035` ⭐ | 35 % | **Jardín de la azotea completo:** enredaderas que caen por el borde superior y un arbolito en el centro | Hito: "¡La azotea ya tiene jardín!" |
| `supercasa-040` | 40 % | **Ladrillo beige** en la **planta baja y el primer piso** (los huecos de ventanas siguen oscuros) | Parte de abajo terminada, arriba sigue gris |
| `supercasa-045` | 45 % | **Ladrillo beige** en **todos los pisos** | Toda la fachada con color, sin ventanas todavía |
| `supercasa-050` ⭐ | 50 % | **Ventanas instaladas:** marcos negros y vidrio azul claro reflejando el cielo, aún sin luz adentro | Hito: "¡La fachada tiene color!" |
| `supercasa-055` | 55 % | **Ventanal en forma de casa** con marco **verde lima** y vidrio | Elemento icónico de la casa |
| `supercasa-060` | 60 % | **Cornisas y remates** claros entre pisos y alfeizares bajo las ventanas | Detalle de acabado |
| `supercasa-065` ⭐ | 65 % | **Luces cálidas encendidas** en las ventanas de los **pisos altos** | Hito: "¡Las luces se encendieron!" |
| `supercasa-070` | 70 % | **Luces cálidas en toda la casa**, incluido el ventanal-casa | La casa "respira" |
| `supercasa-075` | 75 % | **Letrero "LA SUPER CASA"** colgado de su soporte negro, con sus dos lamparitas | Único texto permitido |
| `supercasa-080` ⭐ | 80 % | **Interiores:** lámparas colgantes, plantas en cada ventana y la sala con sofá morado detrás del ventanal-casa | Hito: "¡La cocina y los baños están listos!" |
| `supercasa-085` | 85 % | **Árboles redondos** a ambos lados y arbustos al frente. **Se retira el andamio** | |
| `supercasa-090` | 90 % | **Reja negra ornamental** al frente. **Se retiran** la grúa, la cerca de obra y los materiales. Aparece el **farol** | Ya se ve como el dibujo oficial |
| `supercasa-095` ⭐ | 95 % | **¡Hogar listo!** Guirnalda de bombillos en la azotea, lamparitas del letrero encendidas y **una mamá con su hijo** (un Super Calvito pequeño de espaldas o de perfil, con capa) llegando por el andén con una maleta | Hito: "¡HOGAR LISTO!" |
| `supercasa-100` | 100 % | **Celebración:** confeti y estrellitas de colores en el cielo, guirnaldas de banderines entre los árboles y globos | Imagen maestra (ver sección 4) |

### Reglas por tipo de elemento
- **Grúa:** visible de 0 % a 85 %, siempre en el mismo lugar y con la misma forma. No aparece desde 90 %.
- **Andamio:** visible de 0 % a 80 %. No aparece desde 85 %.
- **Cerca de obra** (naranja y blanca): visible de 0 % a 85 %. Desde 90 % la reemplaza la reja negra.
- **Materiales en el andén:** visibles de 5 % a 85 %.
- **Personajes:** solo en 95 % y 100 %, pequeños (que no tapen la casa) y en el estilo de los Super Calvitos oficiales.

---

## 7. PROMPTS SUGERIDOS (en inglés, que funciona mejor en la mayoría de IAs de imagen)

### 7.1 Imagen maestra (100 %) — adjuntar `supercasa-render.webp` como referencia
```
3D cartoon illustration, toy-like clay style like a children's animated movie, bright and cheerful.
Front view at street level, slightly low angle, locked camera, 4:3 landscape, 1600x1200.
A 5-level apartment building centered-left in the frame: light beige brick facade, large black-framed
windows (3 per floor) with warm yellow light inside, hanging lamps and plants visible through the glass.
On the ground and first floor, right side: a big house-shaped window (gabled top) with a lime-green
frame (#C6D930), cozy living room inside with a purple sofa.
Rooftop garden with wooden planters, round bushes, vines hanging over the top edge, warm string lights.
On the right, a superhero shield sign hanging from a black metal bracket with two small lamps:
blue border, yellow background, diagonal red band; text "LA" small, "SUPER" white on the red band,
"CASA" in red. Black ornamental fence in front, round green trees on both sides, bushes, a street lamp.
Background: toy-like colorful city buildings (blue, yellow, red, green) lower than the main building,
light blue sky with fluffy white clouds, yellow sun in the top right corner. Sunny day, soft shadows.
Celebration: colorful confetti and little stars in the sky, bunting between the trees, balloons.
A mother and a small bald boy with a superhero cape and green mask arriving with a suitcase.
No other text, no logos, no watermark. Keep 80px safe margins.
Match the style and composition of the reference image.
```

### 7.2 Edición hacia atrás (de 100 % a 0 %), una fase a la vez
Sobre la imagen de la fase siguiente, usa la herramienta de edición con este patrón:
```
Edit this exact image. Keep the camera, framing, building position, size, proportions, background,
sky, city and lighting EXACTLY the same, pixel-aligned. Only change the following:
REMOVE: <lo que agrega la fase según la tabla>
ADD BACK: <lo que esa fase quita, por ejemplo: "the yellow construction crane on the left", "the
metal scaffolding on the left side", "the orange and white construction fence in front">
Do not change anything else.
```

Ejemplos:
- **100 → 95:** `REMOVE: the confetti, stars, bunting and balloons.`
- **90 → 85:** `REMOVE: the black ornamental fence and the street lamp. ADD BACK: the orange and white construction fence in front, the pile of bricks and cement bags on the sidewalk at the right, and the yellow construction crane on the left with its arm over the building (same position as before).`
- **50 → 45:** `REMOVE: all window frames and glass; leave dark empty window openings in the beige brick wall.`
- **40 → 35:** `REPLACE the beige brick on the ground and first floor with raw grey concrete. Keep the dark window openings in the same place.`
- **10 → 5:** `REMOVE the roof slab; show rebar sticking up from the top of the concrete columns.`

> Recomendación: deja **fija** desde 85 % la imagen con grúa, andamio y cerca, y úsala como base para todas las fases anteriores. Así esos elementos no cambian de forma entre fases.

---

## 8. CONTROL DE CALIDAD (antes de entregar)

- [ ] Las 21 imágenes miden **exactamente lo mismo** (1600 × 1200).
- [ ] Al superponerlas, **el edificio, la calle y el fondo no se mueven**.
- [ ] Cada fase tiene un cambio **visible en tamaño celular** (prueba a verla de 340 px de ancho).
- [ ] La fase 100 % se parece al dibujo oficial.
- [ ] El único texto es "LA SUPER CASA", sin errores de ortografía, y solo aparece desde 75 %.
- [ ] No aparecen hospitales, elementos médicos ni la palabra "cáncer".
- [ ] La grúa, el andamio y la cerca desaparecen donde dice la tabla.
- [ ] Sin marcas de agua ni firmas.
- [ ] Se entrega la hoja de contacto 7 × 3 con las 21 fases.

---

## 9. CÓMO SE USARÁN EN LA WEB (para el diseñador)

- Se muestran dentro de una tarjeta en la portada: unos **560 px de ancho en computador** y **unos 340 px en celular**. Por eso se piden en 1600 px, para que se vean nítidas en pantallas de alta densidad.
- Al subir el recaudo, la imagen nueva aparece con un **fundido de 1,2 s** sobre la anterior, con un pequeño "salto" del edificio. Si el edificio se mueve entre imágenes, el fundido lo delata.
- La grúa y el andamio pueden tener un **movimiento sutil** hecho en código encima de la imagen. Por eso conviene que la grúa esté siempre en el mismo sitio.
- Nosotros convertimos los PNG a WebP (≈ 150–250 KB cada uno) y solo se carga la imagen de la fase actual y la siguiente.

---

## 10. ARCHIVOS ADJUNTOS DE REFERENCIA

Sube junto con este brief:
1. `supercasa-render.webp` — **dibujo oficial de la casa terminada** (referencia principal de estilo y composición). Si existe una versión en mayor resolución, mejor.
2. `calvito.webp` y `calvita.webp` — personajes oficiales, para el estilo de la familia de la fase 95 %.
3. `logo-fsv.png` — logo de la fundación (solo como referencia de colores; **no** debe aparecer en las imágenes).
4. *(Opcional)* Captura de la casa animada actual de la landing, como ejemplo de lo que **no** queremos: ilustración plana y simple.

Los archivos están en el repositorio, en `public/img/`.
