# @mace-w/auto-crop

A lightweight utility to automatically crop images based on their actual
visible content. Especially useful for transparent PNGs --- for example
renderings, icons, or images with large safe zones. The service inspects
pixel alpha values to remove empty transparent borders.

## ✨ Features

-   Automatically crops an image down to its meaningful content
-   Works with image URLs or already-loaded `<img>` elements
-   Adjustable "inaccuracy" value to trade accuracy for performance
-   Returns Base64 URLs that can be directly used as an image source
-   Zero dependencies

## 📦 Installation

``` bash
npm install @mace-w/auto-crop
```

or

``` bash
pnpm add @mace-w/auto-crop
```

## 🚀 Usage

### 1. Crop an image by URL (recommended)

``` ts
import { ImageCropService } from '@mace-w/auto-crop';

const cropService = new ImageCropService();

cropService
  .getCroppedImageUrl('https://example.com/image.png')
  .then((croppedUrl) => {
    const img = document.getElementById('target') as HTMLImageElement;
    img.src = croppedUrl.toString();
  });
```

### 2. Crop an already-loaded HTMLImageElement

``` ts
import { ImageCropService } from '@mace-w/auto-crop';

const img = document.querySelector('#my-img') as HTMLImageElement;

new ImageCropService().cropImage(img);
```

## ⚙️ API

### `getCroppedImageUrl(url: string, inaccuracy?: number): Promise<URL>`

Loads the image from the URL, crops it, and returns a Promise resolving
to the cropped image URL.

-   **url** -- The image URL
-   **inaccuracy** -- How many pixels to skip while scanning (default:
    `5`)
    -   Higher values → faster, less accurate
    -   Lower values → slower, more accurate

### `cropImage(image: HTMLImageElement, inaccuracy?: number): HTMLImageElement`

Crops an already loaded `<img>` element.

-   Modifies the element's `src` directly
-   Returns the same image element

## 🧠 How it works

The service renders the image onto an off-screen canvas, scans pixel
data (`RGBA`), and finds the first and last non-transparent pixels in
both axes. It then draws the meaningful area onto a new canvas and
exports it as a Base64 string.

## 📜 License

MIT
