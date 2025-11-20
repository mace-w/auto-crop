

// Default amount of skipped pixels while scanning the image
const DEFAULT_INACCURACY_PX = 5;

// Default amount of channels of each pixel: Red, Green, Blue, Alpha
const AMOUNT_OF_CHANNELS = 4;

/**
 * Service for cropping images to their base content by removing transparent borders.
 * 
 * Especially useful for transparent images where you want to remove the safe zone
 * and get only the actual content area.
 *
 * @example
 * // Promise-based approach (recommended)
 * new ImageCropService().getCroppedImageUrl(imageUrl)
 *   .then(croppedUrl => { myImage.src = croppedUrl.toString(); });
 *
 * // Direct approach (use only if image is already loaded)
 * const croppedImage = new ImageCropService().cropImage(myImage);
 */
export class ImageCropService {
  /**
   * Returns a Promise that resolves to a URL of the cropped image.
   * 
   * @param url - The URL of the image to crop
   * @param inaccuracy - Number of pixels to skip while scanning (default: 5).
   *                     Higher values improve performance but reduce accuracy.
   * @returns Promise that resolves to the URL of the cropped image as a data URL
   * @throws Error if the URL is invalid or the image cannot be loaded
   */
  public getCroppedImageUrl(url: string, inaccuracy = DEFAULT_INACCURACY_PX): Promise<URL> {
    if (typeof url !== 'string' || url.trim() === '') {
      throw new Error('[ImageCropService] invalid url provided');
    }
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        resolve(this.cropImageElement(image, inaccuracy));
      };
      image.onerror = () => {
        reject(new Error('[ImageCropService] could not load given image'));
      };
      image.crossOrigin = 'anonymous';
      image.src = url;
    });
  }

  /**
   * Modifies the provided image element's src to the cropped version and returns it.
   * 
   * @param image - The HTMLImageElement to crop (must be already loaded)
   * @param inaccuracy - Number of pixels to skip while scanning (default: 5).
   *                     Higher values improve performance but reduce accuracy.
   * @returns The same HTMLImageElement with its src updated to the cropped data URL
   */
  public cropImage(image: HTMLImageElement, inaccuracy = DEFAULT_INACCURACY_PX): HTMLImageElement {
    image.src = this.cropImageElement(image, inaccuracy).toString();
    return image;
  }

  /**
   * Creates a new canvas element with the specified dimensions.
   * 
   * @param width - Width of the canvas in pixels (must be positive and finite)
   * @param height - Height of the canvas in pixels (must be positive and finite)
   * @returns A new HTMLCanvasElement with the specified dimensions
   * @throws Error if width or height are invalid (non-positive or non-finite)
   */
  private createCanvas(width: number, height: number): HTMLCanvasElement {
    if (width <= 0 || height <= 0 || !Number.isFinite(width) || !Number.isFinite(height)) {
      throw new Error('[ImageCropService] invalid image dimensions for canvas creation');
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * Crops the image to its content boundaries and returns a data URL.
   * 
   * This is the core cropping algorithm that:
   * 1. Scans the image to find non-transparent pixels
   * 2. Calculates the bounding box of actual content
   * 3. Creates a new canvas with only the content area
   * 
   * @param image - The preloaded HTMLImageElement to crop
   * @param inaccuracy - Number of pixels to skip while scanning (default: 5).
   *                     Higher values improve performance but reduce accuracy.
   * @returns Data URL of the cropped image
   * @throws Error if the image is invalid or has no dimensions
   */
  private cropImageElement(image: HTMLImageElement, inaccuracy = DEFAULT_INACCURACY_PX): URL {
    if (!image?.width || !image?.height) {
      throw new Error('[ImageCropService] no valid image given');
    }

    const imgWidth = image.width;
    const imgHeight = image.height;

    // create image-sized canvas and place image at origin
    let canvas = this.createCanvas(imgWidth, imgHeight);
    let ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('[ImageCropService] could not get canvas context');
    }
    ctx.drawImage(image, 0, 0);

    // get rawdata, format: each pixel = 4 channels (red, green, blue, alpha)
    // [px0r, px0g, px0b, px0a,  px1r, px1g, px1b, px1a,  …]
    const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight).data;

    // assume that there could be completely transparent pngs
    let hasContent = false;

    // set extreme values
    let firstMeaningfulX = Infinity;
    let firstMeaningfulY = Infinity;
    let lastMeaningfulX = -1;
    let lastMeaningfulY = -1;

    // to increase performance, only check every SKIP_PIXEL pixel;
    // Math.max because someone could try to mess with it.
    const SKIP_PIXEL = Math.max(0, inaccuracy);

    // before going through every pixel, check if edges are transparent at all.
    // if top-left && bottom-right pixel are not transparent, nothing to crop
    // inspecting first pixel's alpha (based on r,g,b,a) and last pixel's alpha
    if (imgData[3] !== 0 && imgData.at(-1) !== 0) {
      return new URL(canvas.toDataURL());
    }

    // 1 Pixel equals four values: red, green, blue, alpha
    // therefore += 4, to get the next pixel, not the next channel-value
    // this times SKIP_PIXEL skips the given amount of pixels
    for (let pixel = 0; pixel < imgData.length; pixel += AMOUNT_OF_CHANNELS * Math.max(SKIP_PIXEL, 1)) {
      const alpha = imgData[pixel + (AMOUNT_OF_CHANNELS - 1)];

      if (alpha !== 0) {
        hasContent = true;
        const pixelIndex = pixel / AMOUNT_OF_CHANNELS;
        const x = pixelIndex % imgWidth;
        const y = Math.floor(pixelIndex / imgWidth);

        firstMeaningfulX = Math.min(firstMeaningfulX, x);
        firstMeaningfulY = Math.min(firstMeaningfulY, y);
        lastMeaningfulX = Math.max(lastMeaningfulX, x);
        lastMeaningfulY = Math.max(lastMeaningfulY, y);
      }
    }

    // calculate meaningful image
    if (hasContent) {
      // calculate height/width of content
      const width = lastMeaningfulX - firstMeaningfulX;
      const height = lastMeaningfulY - firstMeaningfulY;

      // create new canvas with width/height of content
      canvas = this.createCanvas(width, height);

      ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('[ImageCropService] could not get canvas context');
      }

      // translate image to have first meaningful pixel at edge, place image
      ctx.drawImage(image, -firstMeaningfulX, -firstMeaningfulY, imgWidth, imgHeight);
    }

    return new URL(canvas.toDataURL());
  }
}
