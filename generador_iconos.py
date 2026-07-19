"""
=============================================================================
  GENERADOR DE ÍCONOS — CFE 2020 PWA
  Ejecutar una sola vez para crear la carpeta icons/
=============================================================================
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Crear carpeta icons
os.makedirs("icons", exist_ok=True)

# Tamaños requeridos
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def create_icon(size):
    """Crea un ícono profesional para la app CFE 2020"""
    
    # Crear imagen con fondo oscuro
    img = Image.new('RGBA', (size, size), (10, 10, 10, 255))
    draw = ImageDraw.Draw(img)
    
    # Círculo exterior (verde)
    margin = size * 0.08
    circle_bbox = [margin, margin, size - margin, size - margin]
    draw.ellipse(circle_bbox, fill=(46, 125, 50, 255), outline=(76, 175, 80, 255), width=max(1, size//40))
    
    # Círculo interior (más claro)
    inner_margin = size * 0.18
    inner_bbox = [inner_margin, inner_margin, size - inner_margin, size - inner_margin]
    draw.ellipse(inner_bbox, fill=(27, 94, 32, 255))
    
    # Texto "CFE" centrado
    try:
        # Intentar con fuente del sistema
        font_size = size // 3
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
        except:
            try:
                font = ImageFont.truetype("arialbd.ttf", font_size)
            except:
                font = ImageFont.truetype("C:\\Windows\\Fonts\\Arialbd.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    # Medir texto
    bbox = draw.textbbox((0, 0), "CFE", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    
    # Posición centrada
    x = (size - text_w) // 2
    y = (size - text_h) // 2 - size * 0.02
    
    # Dibujar texto
    draw.text((x, y), "CFE", fill=(255, 255, 255, 255), font=font)
    
    # Línea decorativa "2020"
    font_small_size = size // 6
    try:
        font_small = ImageFont.truetype(font.path, font_small_size) if hasattr(font, 'path') else ImageFont.load_default()
    except:
        font_small = ImageFont.load_default()
    
    bbox2 = draw.textbbox((0, 0), "2020", font=font_small)
    text_w2 = bbox2[2] - bbox2[0]
    x2 = (size - text_w2) // 2
    y2 = y + text_h - size * 0.05
    
    draw.text((x2, y2), "2020", fill=(255, 152, 0, 255), font=font_small)
    
    # Guardar
    filename = f"icons/icon-{size}.png"
    img.save(filename, "PNG")
    print(f"✅ Creado: {filename} ({size}x{size})")

# Generar todos los tamaños
print("🎨 Generando íconos para CFE 2020 PWA...\n")
for size in SIZES:
    create_icon(size)

print(f"\n✅ ¡{len(SIZES)} íconos generados en la carpeta 'icons/'!")
print("📱 La app está lista para instalarse como PWA.")