import imageCompression from "browser-image-compression";
import { toast } from "react-toastify";

/**
 * Copia una imagen al portapapeles como PNG, comprimiéndola si supera los 10MB.
 * Compatible con JPG, PNG, WEBP, GIF (solo primer frame).
 *
 * @param imageUrl URL relativa de la imagen (ej. "images/foo.jpg")
 */

export async function copyImageToClipboard(imageUrl: string): Promise<void> {
  try {
    toast.info("Copiando imagen... por favor espere");
    // El navegador necesita que la pestaña esté activa para permitir el acceso al portapapeles
    if (!document.hasFocus()) {
      toast.error("La ventana debe estar activa para copiar la imagen");
      return;
    }

    // Cargamos la imagen de forma asíncrona y esperamos a que se renderice completamente
    const image = await loadImage(imageUrl);
    console.log(
      "Imagen cargada:",
      imageUrl,
      image.naturalWidth,
      image.naturalHeight
    );

    // Creamos un canvas HTML para poder manipular la imagen (dibujo, compresión, exportación)
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    // Obtenemos el contexto 2D del canvas para poder dibujar sobre él
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No se pudo obtener el contexto 2D del canvas");

    // Dibujamos la imagen sobre el canvas desde el punto (0, 0)
    ctx.drawImage(image, 0, 0);

    // Convertimos el contenido del canvas a un Blob en formato PNG
    const originalBlob: Blob | null = await new Promise(
      (resolve) => canvas.toBlob((blob) => resolve(blob), "image/png") // forzamos formato PNG aunque la fuente sea JPG, GIF, etc.
    );

    if (!originalBlob) throw new Error("No se pudo crear el blob PNG original");

    console.log("Blob original:", originalBlob.size, "KB");

    let finalBlob = originalBlob;
    // 🔍 Verificamos si supera 10 MB = 10_485_760 bytes
    const maxSize = 10_485_760;
    if (originalBlob.size > maxSize) {
      console.warn("⚠️ El PNG original supera los 10MB. Comprimiendo...");
      // Convertimos el blob a un File, necesario para imageCompression
      const file = new File([originalBlob], "temp.png", { type: "image/png" });

      // Opciones para lograr un tamaño razonable conservando calidad
      const compressedBlob = await imageCompression(file, {
        //fileType: "image/jpeg", // comprime más que PNG si no necesitas transparencia
        maxSizeMB: 9.5, // un poco menos para asegurar que no se pase
        maxWidthOrHeight: 2048, // reduce la resolución máxima (4096, 2048, 1024, 512, 256)
        useWebWorker: true,
      });

      console.log(
        "✅ Imagen comprimida, nuevo tamaño:",
        compressedBlob.size / 1024,
        "KB"
      );
      finalBlob = compressedBlob;
    }

    // Creamos un objeto del portapapeles con la imagen comprimida
    const item = new ClipboardItem({ [finalBlob.type]: finalBlob });

    // Escribimos la imagen en el portapapeles del usuario
    await navigator.clipboard.write([item]);

    toast.success("Imagen copiada");
    console.log("✅ Imagen copiada al portapapeles como PNG");
  } catch (error) {
    toast.error("Error al copiar la imagen al portapapeles");
    console.error("Error al copiar la imagen al portapapeles:", error);
    alert("No se pudo copiar la imagen. Ver consola para más detalles.");
  }
}

/**
 * Carga una imagen desde una URL y la convierte en un objeto HTMLImageElement listo para usar.
 *
 * Esto es necesario para poder dibujar la imagen en un canvas.
 *
 * @param url URL de la imagen (relativa o absoluta)
 * @returns Promesa que se resuelve con la imagen cargada
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // Esto es necesario si estás sirviendo archivos desde otro origen o servidor local
    img.crossOrigin = "anonymous";

    img.onload = () => resolve(img); // se resuelve exitosamente al cargar
    img.onerror = reject; // se rechaza si ocurre algún error de red o acceso

    img.src = url; // iniciamos la carga
  });
}
