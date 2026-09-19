"""Mapa de profundidad procedural para hero-ruta-nocturna.jpg (parallax 2.5D del hero).
No usa IA: modela la escena como un plano de suelo que se aleja hacia el horizonte + cielo lejano.
Canal R = disparidad (1 = muy cerca, 0 = infinito). Uso: python scripts/generar-profundidad.py"""
from PIL import Image, ImageFilter
import numpy as np

ORIGEN = "src/assets/atmosfera/hero-ruta-nocturna.jpg"
SALIDA = "src/assets/atmosfera/hero-ruta-nocturna.profundidad.png"
HORIZONTE = 0.595   # y del punto de fuga (fracción de la altura)
ANCHO, ALTO = 512, 288

y = np.linspace(0, 1, ALTO)[:, None]
x = np.linspace(0, 1, ANCHO)[None, :]

# Suelo: disparidad crece de 0 en el horizonte a 1 en el borde inferior, con la curva de un plano en perspectiva.
suelo = np.clip((y - HORIZONTE) / (1 - HORIZONTE), 0, 1) ** 1.35
# Franja de árboles y campo justo sobre el horizonte: un poco más cerca que el cielo.
franja = np.clip((y - (HORIZONTE - 0.04)) / 0.04, 0, 1) * 0.06
# Cielo: 0 (infinito). Un pelo de disparidad hacia arriba para que las estrellas no queden clavadas.
cielo = np.clip((HORIZONTE - y) / HORIZONTE, 0, 1) * 0.02
disparidad = np.where(y >= HORIZONTE, suelo, np.maximum(franja, cielo))
# El talud derecho está más cerca que la calzada a la misma altura: pequeño refuerzo lateral.
disparidad = disparidad * (1 + 0.15 * np.clip((x - 0.78) / 0.22, 0, 1) * (y >= HORIZONTE))
disparidad = np.clip(disparidad, 0, 1)

img = Image.fromarray((disparidad * 255).astype(np.uint8), mode="L").filter(ImageFilter.GaussianBlur(2))
img.save(SALIDA, optimize=True)
print("ok", SALIDA, img.size)
