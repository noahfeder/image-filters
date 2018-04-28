document.addEventListener('DOMContentLoaded', function(event) {
  /**
  * Simple Image Manipulation by @noahfeder
  *
  * Add a number of basic image filters to an image, which is then downloadable.
  * Originally written when I realized that CSS3 filters don't make for a printable/downloadable img
  * RGB/HSL conversion algorithm from @mjijackson
  * Blur handled with Stackblur.js from @flozz
  *
  */

  /** add event listener for the file upload to get this party started */

  var upload = document.getElementById('upload');
  upload.addEventListener('change', handleImage, false);

  /** Create two canvas objects
  * display is what will be displayed, while backup is on a hidden canvas for storing the original image.
  * Additionally, grab the contexts for each.
  */

  var display = document.getElementById('display');
  var backup = document.getElementById('backup');
  var displayCtx = display.getContext('2d');
  var backupCtx = backup.getContext('2d');


  /** Set appropriate dimensions for drawing an image on the screen
  * width is the width of the chosen image
  * height is the height of the chosen image
  */

  function setDimensions (width, height) {
    var canvas = document.getElementById('canvas-wrapper');
    var MAX_WIDTH = canvas.width * 0.9;
    var MAX_HEIGHT = canvas.height * 0.9;
    var borderVal = document.getElementById('border-val');

    if (width > height) {
      if (width > MAX_WIDTH) {
        height *= MAX_WIDTH / width;
        width = MAX_WIDTH;
      }
      borderVal.setAttribute('max', height / 3);
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
      borderVal.setAttribute('max', width / 3);
    }

    display.width = width;
    display.height = height;
    backup.width = width;
    backup.height = height;
  }

  /** When the Choose File button is clicked, create a FileReader() object and Image().
  *  Find the right proportional dimensions to fit the img comfortably inside the available wrapper.
  *  Draw the image on the display and backup canvases.
  *  Additionally, set the maximum border width to 1/2 the smaller of the width or height.
  */

  function handleImage(e) {
    var reader = new FileReader();
    reader.onload = function(event) {
      var img = new Image();
      img.onload = function() {
        var width = img.width;
        var height = img.height;

        setDimensions(width, height);

        displayCtx.drawImage(img, 0, 0, width, height);
        backupCtx.drawImage(img, 0, 0, width, height);
      };
      img.src = event.target.result;
    };

    reader.readAsDataURL(e.target.files[0]);
  }

  /** Objects to store default and dynamic values for each filter */

  var vals = {
      'blur' : '0',
      'brightness' : '1',
      'contrast' : '1',
      'grayscale' : '0',
      'hue' : '0',
      'invert' : '0',
      'opacity' : '1',
      'saturate' : '1',
      'sepia' : '0',
    'border' : '0'
    };

  var defaults = {
      'blur' : '0',
      'brightness' : '1',
      'contrast' : '1',
      'grayscale' : '0',
      'hue' : '0',
      'invert' : '0',
      'opacity' : '1',
      'saturate' : '1',
      'sepia' : '0',
    'border' : '0'
    };

  /**
  *  When a slider value gets changed, adjust the label style to reflect if
  *      the filter is active or not.
  *  Then, apply all filters with changeAll()
  */


  var onChange = function(event) {
    var filter = this.getAttribute('name');
    var filterElement = document.getElementById(filter);
    var filterLabel = document.querySelector('#' + filter + ' label div.label');

    vals[filter] = this.value;
    if (vals[filter] != defaults[filter]) {
      filterElement.classList.remove('on');
      filterElement.classList.add('off');
      filterLabel.classList.remove('right');
    } else {
      filterElement.classList.add('on');
      filterElement.classList.remove('off');
      filterLabel.classList.add('right');
    }
    Filters.changeAll();
  };


  var ranges = document.querySelectorAll('input[type="range"');
  ranges.forEach(function(range) {
    range.addEventListener('change', onChange);
  });

  //Remove class from all elements

  var removeClassAll = function(className) {
    var elements = document.querySelectorAll('.' + className);
    elements.forEach(function(el) {
      el.classList.remove(className);
    });
  }

  /**
  * Click reset button to redraw image as original and reset all in-page and in-image styles.
  */

  var resetAll = function() {
    var ranges = document.querySelectorAll('.control input');
    ranges.forEach(function(el) {
      el.value = defaults[el.name];
    });
    removeClassAll('right');
    removeClassAll('on');
    for (var val in vals) {
      vals[val] = defaults[val];
    }
    Filters.changeAll();
  }

  var resetButton = document.querySelector('#reset');

  resetButton.addEventListener('click',resetAll);

  /**
  *  The Filters object! All the various CSS3-standard filters (excluding drop-shadow), which take arrays
  *      of either RGB or HSL triples. RGB values 0-255, HSL values 0-1, per @mjijackson spec.
  *  Opacity filter is handled within the changeAll function.
  *  Blur filter is handled within the writeIMG function.
  */

  var Filters = {

    /** Brightness is determined simply by adding the brightness modififer [-255 to 255] */

    brightness: function(rgb) {
      if (vals.brightness !== defaults.brightness) {
        var br = (vals.brightness - 1) * 255;
        for (var i = 0; i < 3; i++) {
          rgb[i] += br;
          rgb[i] = (rgb[i] > 255) ? 255 : ((rgb[i] < 0) ? 0 : rgb[i]); //normalize values
        }
      }
      return rgb;
    },

    /**
    *  Contrast is a multi-step process. First scale to [0,255]
    *  Then calculate cf, the contrast factor
    *  Use that cf to adjust the distance from a median value of 128 for each RGB value
    */

    contrast: function(rgb) {
      if (vals.contrast !== defaults.contrast) {
        var c = (vals.contrast - 1) * 255;
        var cf = (259 * (c + 255))/(255 * (259 - c));
        for (var i = 0; i < 3; i++) {
          rgb[i] = (cf * (rgb[i] - 128)) + 128;
          rgb[i] = (rgb[i] > 255) ? 255 : ((rgb[i] < 0) ? 0 : rgb[i]); //normalize values
        }
      }
      return rgb;
    },

    /** Grayscale calculates the mean of the RGB values, then averages that with the given values */

    grayscale: function(rgb) {
      if (vals.grayscale !== defaults.grayscale) {
        var avg = (rgb[0] + rgb[1] + rgb[2]) / 3;
        for (var i = 0; i < 3; i++) {
          rgb[i] = (rgb[i] * (1 - vals.grayscale)) + (avg * vals.grayscale);
        }
      }
      return rgb;
    },

    /** Hue is easy... once RGB is converted to HSL. Simply rotate around the hue cylinder */

    hue: function(hsl) {
      if (vals.hue !== defaults.hue) {
        hsl[0] += (vals.hue / 360);
        hsl[0] -= (hsl[0] > 1) ? 1 : 0; //normalize values
      }
      return hsl;
    },

    /** Invert by subtracting each RGB value from 255. Then average that with the existing value
    *      based on the user-supplied value.
    *  Quasi-BUG: An inversion value of 0.5 leads to an all gray image*/

    invert: function(rgb) {
      if (vals.invert !== defaults.invert) {
        for (var i = 0; i < 3; i++) {
          rgb[i] = (rgb[i] * (1 - vals.invert)) + ((255 - rgb[i]) * vals.invert);
        }
      }
      return rgb;
    },

    /** Saturate is also easy... once you convert to HSL color */

    saturate: function(hsl) {
      if (vals.saturate !== defaults.saturate) {
        hsl[1] *= vals.saturate;
        hsl[1] = (hsl[1] > 1) ? 1 : hsl[1]; //normalize value
      }
      return hsl;
    },

    /** Sepia equations are taken from Intel's standard. */

    sepia: function(rgb) {
      if (vals.sepia !== defaults.sepia) {
        var r = rgb[0];
        var g = rgb[1];
        var b = rgb[2];
        var rs = 0.393 * r + 0.769 * g + 0.189 * b;
        var gs = 0.349 * r + 0.686 * g + 0.168 * b;
        var bs = 0.272 * r + 0.534 * g + 0.131 * b;
        rgb[0] = (vals.sepia * rs + (1 - vals.sepia) * r) / 2;
        rgb[1] = (vals.sepia * gs + (1 - vals.sepia) * g) / 2;
        rgb[2] = (vals.sepia * bs + (1 - vals.sepia) * b) / 2;
      }
      return rgb;
    },

    /**
    *  First, we get the ImageData from the BACKUP context.
    *  We then cycle through each RGBA quad in the data array, convert to HSL, apply saturate and hue.
    *  Then we convert back to RGB and apply all other filters, then feeding these RGB values back to the ImageData
    *  We also handle Opacity by adjusting Alpha values
    *  Finally we write the image to the display canvas*/

    changeAll: function() {
      var pixels = backupCtx.getImageData(0,0,backup.width,backup.height);
      var globalR = 0, globalG = 0, globalB = 0, pixelCount = 0;
      for (var i = 0; i < pixels.data.length; i += 4) {
        var r = pixels.data[i];
        var g = pixels.data[i + 1];
        var b = pixels.data[i + 2];
        var hsl = rgbToHsl(r,g,b);
        Filters.saturate(hsl);
        Filters.hue(hsl);
        var rgb = hslToRgb(hsl[0],hsl[1],hsl[2]);
        Filters.brightness(rgb);
        Filters.contrast(rgb);
        Filters.grayscale(rgb);
        Filters.invert(rgb);
        Filters.sepia(rgb);
        pixels.data[i] = rgb[0];
        pixels.data[i + 1] = rgb[1];
        pixels.data[i + 2] = rgb[2];
      globalR += rgb[0];
      globalG += rgb[1];
      globalB += rgb[2];
      pixelCount++;
        if (vals.opacity !== defaults.opacity) {
          pixels.data[i + 3] *= vals.opacity;
        }
      }
      var averagePixel = '#' + parseInt(0xff - (globalR/pixelCount)).toString(16) + parseInt(0xff - (globalG/pixelCount)).toString(16) + parseInt(0xff - (globalB/pixelCount)).toString(16);
      Filters.writeIMG(pixels, averagePixel);
    },

  /** Draw a high-contrast border that is the inverse of the average of all pixels*/

    drawBorder: function(width, color) {
      displayCtx.fillStyle = color;
      displayCtx.fillRect(0,0,display.width,width);
      displayCtx.fillRect(0,width,width,display.height);
      displayCtx.fillRect(width,(display.height - width), display.width, display.height);
      displayCtx.fillRect((display.width - width), width, display.width, (display.height - width));
    },

    /**
    *  Clear the full image.
    *  If the given blur radius isn't 0, apply StackBlur
    *  Finally, use putImageData to place the computed pixels on the display context
  *  If there is a border to be drawn, draw it
  */

    writeIMG: function(pixels, averagePixel) {
      displayCtx.clearRect(0,0,display.width,display.height);
      var radius = Math.round(vals.blur);
      if (radius > 0) {
        StackBlur.imageDataRGBA(pixels, 0, 0, display.width, display.height, radius);
      }
      var newData = new ImageData(pixels.data, display.width, display.height);
      displayCtx.putImageData(newData,0,0);
    if (vals.border != defaults.border) {
      Filters.drawBorder(vals.border, averagePixel);
    }
    }
  };

  /** Save the modified image! */

  var downloadButton = document.getElementById('download');

  downloadButton.addEventListener('click', function(e) {
    console.log(this);
    function downloadCanvas(link, canvasId, filename) {
    link.href = document.getElementById(canvasId).toDataURL();
    link.download = filename;
    }

    downloadCanvas(this, 'display', 'newfile.png');
  });

});
