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
export declare class ImageCropService {
    /**
     * will return a Promise which will return a cropped url or the input url if it cannot be cropped.
     * @param url of the image you want to crop
     * @param inaccuracy defines how many pixels should be skipped while scanning. Improves performance, reduces accuracy.
     *
     * @returns Promis<URL> with the url of the cropped image
     *
     * @throws error if image cannot be loaded;
     */
    getCroppedImageUrl(url: string, inaccuracy?: number): Promise<URL>;
    /**
     * will change the src of the given image with the base64 url of the cropped image, and return it
     *
     * @param image your native HTMLImageElement
     * @param inaccuracy defines how many pixels should be skipped while scanning. Improves performance, reduces accuracy.
     *
     * @returns cropped HTMLImageElement of input
     */
    cropImage(image: HTMLImageElement, inaccuracy?: number): HTMLImageElement;
    /**
     * creates a new canas
     * @param width defines how wide the canvas is
     * @param height defines how tall the canvas is
     */
    private createCanvas;
    /**
     * will return base64 url of cropped Image (this is where the actual magic happens)
     * @param image is already preloaded/available HTMLImageElement
     * @param inaccuracy defines how many pixels should be skipped. Improves performance, reduces accuracy.
     * @throws error if no image given
     */
    private cropImageElement;
}
