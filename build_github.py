from pathlib import Path
import re
import time

BASE_DIR = Path(__file__).resolve().parent
template_path = BASE_DIR / "templates" / "index.html"
output_path = BASE_DIR / "index.html"

# Genera un número de versión único basado en la hora exacta de compilación
version_hash = int(time.time())

html = template_path.read_text(encoding="utf-8")

# 1. Limpiar posibles parámetros ?v= previos en la plantilla
html = re.sub(r"\?v=\d+", "", html)

# 2. Reemplazar etiquetas Jinja2 agregando ?v=TIMESTAMP para forzar descarga nueva en navegadores
html = html.replace(
    "{{ url_for('static', filename='css/styles.css') }}",
    f"static/css/styles.css?v={version_hash}",
)
html = html.replace(
    "{{ url_for('static', filename='js/main.js') }}",
    f"static/js/main.js?v={version_hash}",
)

# Si ya tenía rutas estáticas previas, actualiza su versión también
html = re.sub(
    r'href="static/css/styles\.css(?:\?v=\d+)?"',
    f'href="static/css/styles.css?v={version_hash}"',
    html,
)
html = re.sub(
    r'src="static/js/main\.js(?:\?v=\d+)?"',
    f'src="static/js/main.js?v={version_hash}"',
    html,
)

# 3. Inyectar cabeceras meta anti-caché en el <head> si no existen
meta_anticache = (
    '    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">\n'
    '    <meta http-equiv="Pragma" content="no-cache">\n'
    '    <meta http-equiv="Expires" content="0">\n'
)
if 'http-equiv="Cache-Control"' not in html:
    html = html.replace('<meta charset="UTF-8">\n', f'<meta charset="UTF-8">\n{meta_anticache}')

# 4. Apuntar imágenes y simulaciones directamente a static/media/
html = re.sub(
    r'(src|data-dark-src|data-light-src|data-sim-src)="(?!static/|http)([^"]+\.(?:jpg|jpeg|png|gif|svg|webp|avif|mp4|webm))"',
    r'\1="static/media/\2"',
    html,
)

output_path.write_text(html, encoding="utf-8")
print(f"index.html actualizado con anti-cache ?v={version_hash} listo para GitHub Pages.")

# ===================
#     SantixCode
# ===================