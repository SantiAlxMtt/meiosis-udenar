from pathlib import Path
from flask import Flask, render_template, send_from_directory, abort, Response

app = Flask(__name__)
app.config["SEND_FILE_MAX_AGE_DEFAULT"] = 0

BASE_DIR = Path(__file__).resolve().parent
MEDIA_FOLDER = BASE_DIR / "static" / "media"


@app.after_request
def add_no_cache_headers(response: Response) -> Response:
    """Evita que el navegador guarde en caché versiones antiguas de CSS, JS o imágenes."""
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


@app.route("/")
def index():
    """Renderiza la presentación interactiva de Meiosis (Universidad de Nariño)."""
    return render_template("index.html")


@app.route("/<path:filename>")
def serve_placeholder_media(filename: str):
    """
    Permite usar atributos limpios como src="sim_interfase.mp4" o src="img_leptoteno_dark.jpg"
    sirviendo automáticamente el archivo desde /static/media/ cuando está disponible.
    """
    allowed_extensions = (
        ".mp4",
        ".webm",
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".svg",
        ".webp",
        ".avif",
    )
    if filename.lower().endswith(allowed_extensions):
        file_path = MEDIA_FOLDER / filename
        if file_path.is_file():
            return send_from_directory(str(MEDIA_FOLDER), filename)
    abort(404)


if __name__ == "__main__":
    MEDIA_FOLDER.mkdir(parents=True, exist_ok=True)
    app.run(host="127.0.0.1", port=5000, debug=True)

# ===================
#     SantixCode
# ===================