exports.ImageCropService=function(){function e(){}var t=e.prototype;return t.getCroppedImageUrl=function(t,n){var a=this;return void 0===n&&(n=5),new Promise(function(r){var o=new Image;o.onload=function(){r(a.cropImageElement(o,n))},o.onerror=function(){console.error("could not load given image",e.name)},o.crossOrigin="anonymous",o.src=t})},t.cropImage=function(e,t){return void 0===t&&(t=5),e.src=this.cropImageElement(e,t).toString(),e},t.createCanvas=function(e,t){var n=document.createElement("canvas");return n.width=e,n.height=t,n},t.cropImageElement=function(e,t){if(void 0===t&&(t=5),!e||!e.width||!e.height)throw"[ImageCropService] no valid image given";var n=e.width,a=e.height,r=this.createCanvas(n,a),o=r.getContext("2d");o.drawImage(e,0,0);var i=o.getImageData(0,0,n,a).data,c=!1,g=Infinity,m=Infinity,h=-1,v=-1,u=Math.max(0,t);if(0!=i[3]&&0!=i[i.length-1])return new URL(r.toDataURL());for(var d=0;d<i.length;d+=4*u)if(0!==i[d+3]){c=!0;var f=d/4%n,s=Math.floor(d/4/n);g=Math.min(g,f),m=Math.min(m,s),h=Math.max(h,f),v=Math.max(v,s)}return c&&(o=(r=this.createCanvas(h-g,v-m)).getContext("2d")).drawImage(e,-g,-m,n,a),new URL(r.toDataURL())},e}();
//# sourceMappingURL=auto-crop.js.map