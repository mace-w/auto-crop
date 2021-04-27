import { WorkbenchRuntimeError } from '../../typings/errors';

// Default amount of skipped pixel while scanning the image
const DEFAULT_INACCURACY_PX = 5;

// Default amount of channels of each pixel: Red, Green, Blue, Alpha
const AMOUT_OF_CHANNELS = 4;

/**
 * @name ImageCropService
 *
 * @description provide methods to crop an image to its base content. Especially when it comes to transparent BBD Images, this service can be used to get the actual car without safezone
 * if image was already preloaded, use new ImageCropService().crop(image), which will return the url
 * @example
 * import { ImageCropService } from 'workbench-core';
 *
 *  // safe promise approach
 *  new ImageCropService().getCroppedImageUrl(url).then(url => {myImage.src = url});
 *
 *  // or (use with caution!) if image data already exists (preloaded etc.)
 *  myImage = new ImageCropService().cropImage(myImage);
 */
export class ImageCropService {
  /**
   * will return a Promise which will return a cropped url or the input url if it cannot be cropped.
   * @param url of the image you want to crop
   * @param inaccuracy defines how many pixels should be skipped while scanning. Improves performance, reduces accuracy.
   *
   * @returns Promis<URL> with the url of the cropped image
   *
   * @throws error if image cannot be loaded;
   */
  public getCroppedImageUrl(url: string, inaccuracy = DEFAULT_INACCURACY_PX): Promise<URL> {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => {
        resolve(this.cropImageElement(image, inaccuracy));
      };
      image.onerror = () => {
        new WorkbenchRuntimeError('could not load given image', ImageCropService.name);
      };
      image.crossOrigin = 'anonymous';
      image.src = url;
    });
  }

  /**
   * will change the src of the given image with the base64 url of the cropped image, and return it
   *
   * @param image your native HTMLImageElement
   * @param inaccuracy defines how many pixels should be skipped while scanning. Improves performance, reduces accuracy.
   *
   * @returns cropped HTMLImageElement of input
   */
  public cropImage(image: HTMLImageElement, inaccuracy = DEFAULT_INACCURACY_PX): HTMLImageElement {
    image.src = this.cropImageElement(image, inaccuracy).toString();
    return image;
  }

  /**
   * creates a new canas
   * @param width defines how wide the canvas is
   * @param height defines how tall the canvas is
   */
  private createCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas') as HTMLCanvasElement;
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  /**
   * will return base64 url of cropped Image (this is where the actual magic happens)
   * @param image is already preloaded/available HTMLImageElement
   * @param inaccuracy defines how many pixels should be skipped. Improves performance, reduces accuracy.
   * @throws error if no image given
   */
  private cropImageElement(image: HTMLImageElement, inaccuracy = DEFAULT_INACCURACY_PX): URL {
    if (!image || !image.width || !image.height) {
      throw '[ImageCropService] no valid image given';
    }

    const imgWidth = image.width;
    const imgHeight = image.height;

    // create image-sized canvas and place image at origin
    let canvas = this.createCanvas(imgWidth, imgHeight);
    let ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    // get rawdata, format: each pixel = 4 channels (red, green, blue, alpha)
    // [px0r, px0g, px0b, px0a,  px1r, px1g, px1b, px1a,  …]
    const imgData = ctx.getImageData(0, 0, imgWidth, imgHeight).data;

    // assume that there could be completly transparent pngs
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
    // inspecting first pixels alpha (based on r,g,b,a) and last pixels alpha
    if (imgData[3] != 0 && imgData[imgData.length - 1] != 0) {
      return new URL(canvas.toDataURL());
    }

    // 1 Pixel equals four values: red, green, blue, alpha
    // there for += 4, to get the next pixel, not the next channel-value
    // this times SKIL_PIXEL skip the given amount of pixels
    for (let pixel = 0; pixel < imgData.length; pixel += AMOUT_OF_CHANNELS * SKIP_PIXEL) {
      const alpha = imgData[pixel + (AMOUT_OF_CHANNELS - 1)];

      if (alpha !== 0) {
        hasContent = true;
        const x = (pixel / AMOUT_OF_CHANNELS) % imgWidth;
        const y = Math.floor(pixel / AMOUT_OF_CHANNELS / imgWidth);

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

      // translate image to have first meaningful pixel at edge, place image
      ctx.drawImage(image, -firstMeaningfulX, -firstMeaningfulY, imgWidth, imgHeight);
    }

    return new URL(canvas.toDataURL());
  }
}
