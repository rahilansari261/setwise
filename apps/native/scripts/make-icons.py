"""Draws the Adonis mark (a V-taper torso inside a laurel wreath) and writes every app icon.

    python3 scripts/make-icons.py

The same geometry lives in src/components/adonis-mark.tsx for the in-app logo.
"""
import math
from PIL import Image, ImageDraw

BG = (11, 13, 16, 255)
ACCENT = (198, 255, 61, 255)
SS = 4  # supersampling for smooth edges

TORSO = [(296, 352), (448, 322), (576, 322), (728, 352), (752, 428), (706, 508), (618, 618),
         (572, 772), (452, 772), (406, 618), (318, 508), (272, 428)]
DELTS = [(284, 410, 54), (740, 410, 54)]  # shoulder caps: cx, cy, r
HEAD = (512, 232, 54)  # cx, cy, r
WREATH = dict(cx=512, cy=545, r=372)


def leaf(size_l, size_w, angle_deg, color):
    """A leaf (ellipse with pointed tips) rotated by angle."""
    w, h = int(size_l * 1.2), int(size_l * 1.2)
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy = w / 2, h / 2
    pts = []
    for i in range(0, 61):
        t = i / 60 * 2 * math.pi
        # lens shape: pointed at both ends
        x = math.cos(t) * size_l / 2
        y = math.sin(t) * size_w / 2 * (abs(math.sin(t)) ** 0.0)
        pts.append((cx + x, cy + y * (1 - 0.25 * abs(math.cos(t)))))
    d.polygon(pts, fill=color)
    return img.rotate(-angle_deg, resample=Image.BICUBIC, expand=False)


def wreath(draw_img, scale, color):
    cx, cy, r = WREATH["cx"] * scale, WREATH["cy"] * scale, WREATH["r"] * scale
    d = ImageDraw.Draw(draw_img)
    for side in (1, -1):
        # branch from the bottom (90 deg) up the side
        n = 10
        for i in range(n):
            t = i / (n - 1)
            theta = math.radians(98 + side * 0 + t * 120) if side == 1 else math.radians(82 - t * 120)
            px = cx + (-math.cos(theta) if side == 1 else math.cos(theta)) * 0
            # position on circle: left branch uses angle measured from bottom going clockwise
            ang = math.radians(90 + side * (8 + t * 118))
            x = cx + math.cos(ang) * r
            y = cy + math.sin(ang) * r
            tangent = math.degrees(ang) + 90 * side * -1
            size = (96 - 30 * t) * scale
            wid = (40 - 12 * t) * scale
            for off, rot in ((-26, -38), (26, 38)):
                lx = x + math.cos(ang) * off * scale
                ly = y + math.sin(ang) * off * scale
                lf = leaf(size, wid, math.degrees(ang) + 90 + rot * side * -1 + (0 if side == 1 else 180), color)
                draw_img.alpha_composite(lf, (int(lx - lf.width / 2), int(ly - lf.height / 2)))
        # stem
        pts = []
        for i in range(0, 41):
            t = i / 40
            ang = math.radians(90 + side * (4 + t * 124))
            pts.append((cx + math.cos(ang) * r, cy + math.sin(ang) * r))
        d.line(pts, fill=color, width=int(9 * scale), joint="curve")


def mark(size, fg, with_wreath=True, bg=None, pad=1.0, wreath_color=None):
    """Mark on a size x size canvas. pad < 1 shrinks it inside (adaptive icon safe zone)."""
    big = size * SS
    img = Image.new("RGBA", (big, big), bg or (0, 0, 0, 0))
    scale = big / 1024 * pad
    off = (big - 1024 * scale) / 2
    layer = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    if with_wreath:
        wr = Image.new("RGBA", (big, big), (0, 0, 0, 0))
        wreath_scaled = ImageDraw.Draw(wr)
        # draw wreath on an offset-aware canvas by temporarily shifting via a sub-image
        sub = Image.new("RGBA", (int(1024 * scale), int(1024 * scale)), (0, 0, 0, 0))
        wreath(sub, scale, wreath_color or fg)
        wr.alpha_composite(sub, (int(off), int(off)))
        layer.alpha_composite(wr)
    d = ImageDraw.Draw(layer)
    pts = [(off + x * scale, off + y * scale) for x, y in TORSO]
    d.polygon(pts, fill=fg)
    for dx, dy, dr in DELTS:
        d.ellipse([off + (dx - dr) * scale, off + (dy - dr) * scale, off + (dx + dr) * scale, off + (dy + dr) * scale], fill=fg)
    cx, cy, r = HEAD
    d.ellipse([off + (cx - r) * scale, off + (cy - r) * scale, off + (cx + r) * scale, off + (cy + r) * scale], fill=fg)
    img.alpha_composite(layer)
    return img.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    out = "assets/images"
    mark(1024, ACCENT, bg=BG, pad=0.82).convert("RGB").save(f"{out}/icon.png")
    mark(512, ACCENT, pad=0.68).save(f"{out}/android-icon-foreground.png")
    mark(432, (255, 255, 255, 255), pad=0.68).save(f"{out}/android-icon-monochrome.png")
    mark(1024, ACCENT, pad=0.9).save(f"{out}/splash-icon.png")
    mark(96, (255, 255, 255, 255), with_wreath=False, pad=0.95).save(f"{out}/notification-icon.png")
    mark(48, ACCENT, bg=BG, with_wreath=False, pad=0.9).save(f"{out}/favicon.png")
    print("icons written")
