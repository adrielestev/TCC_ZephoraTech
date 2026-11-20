"""Gera os assets de marca do Zephora a partir de Logo_Zephora.png e chalkboard.png.

Uso (na raiz do projeto):  python3 tools/build_brand_assets.py
Requer: pip install pillow numpy

Saídas em assets/:
  chalk-doodles.png   rabiscos de giz (branco com transparência) — sobrepor a qualquer fundo azul
  icon.png            ícone do app (iOS/geral), fundo lousa azul + pássaro
  android-icon-*.png  ícone adaptativo (primeiro plano, fundo, monocromático)
  splash-icon.png     pássaro branco transparente (splash)
  favicon.png         ícone da aba do navegador
  grid-paper.png      papel quadriculado translúcido (fundo das telas de acesso)
"""
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ASSETS = Path(__file__).resolve().parent.parent / 'assets'
INK = (11, 27, 63)        # #0B1B3F  lousa
INK_LIGHT = (30, 58, 138)  # #1E3A8A
CHALK = (234, 241, 255)   # #EAF1FF  giz


def vertical_diag_gradient(size: int, c0, c1) -> Image.Image:
    """Gradiente diagonal (canto superior esquerdo -> inferior direito)."""
    y, x = np.mgrid[0:size, 0:size]
    t = ((x + y) / (2 * (size - 1)))[..., None]
    arr = (np.array(c0) * (1 - t) + np.array(c1) * t).astype(np.uint8)
    return Image.fromarray(arr, 'RGB')


def white_bird(logo: Image.Image, target_w: int) -> Image.Image:
    """Pássaro branco (mantém só o canal alfa do logo) redimensionado para target_w."""
    alpha = logo.getchannel('A')
    ratio = target_w / alpha.width
    alpha = alpha.resize((target_w, round(alpha.height * ratio)), Image.LANCZOS)
    bird = Image.new('RGBA', alpha.size, (255, 255, 255, 0))
    bird.putalpha(alpha)
    return bird


def paste_centered(base: Image.Image, layer: Image.Image, dy: int = 0) -> Image.Image:
    out = base.copy()
    out.alpha_composite(layer, ((base.width - layer.width) // 2, (base.height - layer.height) // 2 + dy))
    return out


def chalk_doodles() -> Image.Image:
    """Transforma a lousa em máscara de giz: luminância -> transparência."""
    lum = np.array(Image.open(ASSETS / 'chalkboard.png').convert('L')).astype(np.float32)
    a = np.clip((lum - 78) / (225 - 78), 0, 1) ** 0.9
    h, w = a.shape
    rgba = np.zeros((h, w, 4), np.uint8)
    rgba[..., :3] = 255
    rgba[..., 3] = (a * 255).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def grid_paper(size: int = 1600, step: int = 40, major: int = 5) -> Image.Image:
    """Papel quadriculado: linhas azuis translúcidas (a cada `major` quadrados a linha é mais forte)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    for i, pos in enumerate(range(0, size + 1, step)):
        alpha = 46 if i % major == 0 else 24
        d.line([(pos, 0), (pos, size)], fill=(37, 99, 235, alpha), width=2)
        d.line([(0, pos), (size, pos)], fill=(37, 99, 235, alpha), width=2)
    return img


def main() -> None:
    logo = Image.open(ASSETS / 'Logo_Zephora.png').convert('RGBA')
    doodles = chalk_doodles()
    doodles.save(ASSETS / 'chalk-doodles.png', optimize=True)

    size = 1024
    bg = vertical_diag_gradient(size, INK_LIGHT, INK).convert('RGBA')

    # fundo com rabiscos discretos (ícone iOS e fundo adaptativo)
    faint = doodles.resize((size, round(size * doodles.height / doodles.width)), Image.LANCZOS)
    faint = faint.crop((0, 0, size, size))
    faint.putalpha(faint.getchannel('A').point(lambda v: int(v * 0.16)))
    textured = bg.copy()
    textured.alpha_composite(faint)

    # ícone iOS / geral (sem transparência)
    icon = paste_centered(textured, white_bird(logo, 640), dy=-6).convert('RGB')
    icon.save(ASSETS / 'icon.png', optimize=True)

    # adaptativo Android: zona segura = 66% central
    fg = paste_centered(Image.new('RGBA', (size, size), (0, 0, 0, 0)), white_bird(logo, 560))
    fg.save(ASSETS / 'android-icon-foreground.png', optimize=True)
    textured.convert('RGB').save(ASSETS / 'android-icon-background.png', optimize=True)
    mono = paste_centered(Image.new('RGBA', (size, size), (0, 0, 0, 0)), white_bird(logo, 560))
    mono.save(ASSETS / 'android-icon-monochrome.png', optimize=True)

    # splash: pássaro branco transparente (o fundo vem do app.json)
    splash = paste_centered(Image.new('RGBA', (size, size), (0, 0, 0, 0)), white_bird(logo, 620))
    splash.save(ASSETS / 'splash-icon.png', optimize=True)

    # favicon: quadrado arredondado azul com pássaro
    fav = 128
    tile = vertical_diag_gradient(fav, INK_LIGHT, INK).convert('RGBA')
    mask = Image.new('L', (fav, fav), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, fav - 1, fav - 1), radius=28, fill=255)
    tile.putalpha(mask)
    tile = paste_centered(tile, white_bird(logo, 84))
    tile.resize((64, 64), Image.LANCZOS).save(ASSETS / 'favicon.png', optimize=True)
    grid_paper().save(ASSETS / 'grid-paper.png', optimize=True)
    print('ok')


if __name__ == '__main__':
    main()
