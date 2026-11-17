from pathlib import Path
import re

BASE_DIR = Path(__file__).resolve().parent
template_path = BASE_DIR / "templates" / "index.html"
output_path = BASE_DIR / "index.html"

html = template_path.read_text(encoding="utf-8")

# 1. Reemplazar etiquetas Jinja2 por rutas estáticas relativas
html = html.replace(
    "{{ url_for('static', filename='css/styles.css') }}",
    "static/css/styles.css",
)
html = html.replace(
    "{{ url_for('static', filename='js/main.js') }}",
    "static/js/main.js",
)

# 2. Apuntar imágenes y simulaciones directamente a static/media/
html = re.sub(
    r'(src|data-dark-src|data-light-src|data-sim-src)="(?!static/|http)([^"]+\.(?:jpg|jpeg|png|gif|svg|webp|mp4|webm))"',
    r'\1="static/media/\2"',
    html,
)

output_path.write_text(html, encoding="utf-8")
print("Archivo index.html generado en la raíz para GitHub Pages.")
