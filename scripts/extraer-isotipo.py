"""Extrae la geometría del isotipo del manual de marca (PDF vectorial) y la escribe como SVG + módulo TS.
Se corre una sola vez; los archivos generados quedan versionados. Uso: python scripts/extraer-isotipo.py"""
import re

import fitz  # pymupdf

PDF = "docs/marca/Logo Covicen 2.pdf"
# En la página 1, el isotipo "uso preferente" es la imagen recortada por clip_14 (verificado el 2026-08-27).
CLIP_ID = "clip_14"
VIEWBOX = "120 120 784 784"  # la geometría vive en ~139..885; margen de 19 u por lado

svg = fitz.open(PDF)[0].get_svg_image()
clip = re.search(rf'<clipPath id="{CLIP_ID}">(.*?)</clipPath>', svg, re.S).group(1)
d = re.search(r' d="([^"]+)"', clip).group(1)
assert d.count("M") == 5, f"esperaba 5 subtrazos (C + ruta + 3 marcas), hay {d.count('M')}"

gradiente = (
    '<defs><linearGradient id="g" gradientUnits="userSpaceOnUse" x1="139" y1="139" x2="885" y2="885">'
    '<stop offset="0" stop-color="#68BCE1"/><stop offset=".4" stop-color="#4A92BA"/>'
    '<stop offset=".75" stop-color="#2C688F"/><stop offset="1" stop-color="#1E4870"/></linearGradient></defs>'
)
standalone = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{VIEWBOX}" role="img" aria-label="Covicen">'
    f'{gradiente}<path d="{d}" fill="url(#g)" fill-rule="evenodd"/></svg>'
)
open("src/assets/marca/isotipo.svg", "w", encoding="utf-8").write(standalone)
open("public/favicon.svg", "w", encoding="utf-8").write(standalone)
open("src/assets/marca/isotipo-path.ts", "w", encoding="utf-8").write(
    "// Generado por scripts/extraer-isotipo.py desde docs/marca/Logo Covicen 2.pdf. No editar a mano.\n"
    f'export const ISOTIPO_VIEWBOX = "{VIEWBOX}";\n'
    f'export const ISOTIPO_D = "{d}";\n'
)
print("ok:", len(d), "chars de path")
