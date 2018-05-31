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

  // Add event listeners for the file upload/meme selection

  var upload = document.getElementById('upload');
  var memePicker = document.getElementById('memes');
  upload.addEventListener('change', handleImageUpload, false);
  memePicker.addEventListener('change', createImage);

  /** Create two canvas objects
  * display is what will be displayed, while backup is on a hidden canvas for storing the original image.
  * Additionally, grab the contexts for each as globals.
  */

  var display = document.getElementById('display');
  var backup = document.getElementById('backup');
  var displayCtx = display.getContext('2d');
  var backupCtx = backup.getContext('2d');

  // Draw either the selected meme or uploaded image

  function createImage(e) {
    var meme = e.target.value;
    var img = new Image();
    img.onload = function() {
      var width = img.width;
      var height = img.height;

      setDimensions(width, height);

      displayCtx.drawImage(img, 0, 0, width, height);
      backupCtx.drawImage(img, 0, 0, width, height);
    };
    img.setAttribute('crossOrigin', '');
    img.src = meme ? meme_data[meme]['path'] : e.target.result;
  }

  // Handle uploaded image

  function handleImageUpload(e) {
    var reader = new FileReader();
    reader.onload = createImage;
    reader.readAsDataURL(e.target.files[0]);
  }


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
      borderVal.setAttribute('max', height / 4);
    } else {
      if (height > MAX_HEIGHT) {
        width *= MAX_HEIGHT / height;
        height = MAX_HEIGHT;
      }
      borderVal.setAttribute('max', width / 4);
    }

    display.width = width;
    display.height = height;
    backup.width = width;
    backup.height = height;
  }

  function writeText(e, ctx) {
    var ctx = ctx || displayCtx;
    console.log(ctx);
    var drawText = function(el, i) {
      var meme = document.getElementById('memes').value;
      if (!meme) { return; }
      var text = el.value;
      var x = meme_data[meme]['field_positions'][i][0] * display.width;
      var y = meme_data[meme]['field_positions'][i][1] * display.height;
      ctx.font = '48px sans-serif';

      x -= ctx.measureText(text).width / 2;
      //TODO pick font
      ctx.fillText(text, x, y);
    }
    var textInputs = document.querySelectorAll('input[type="text"]');
    textInputs.forEach(drawText);
  }


  document.getElementById('writeText').onclick = writeText;

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
      filterElement.classList.remove('off');
      filterElement.classList.add('on');
      filterLabel.classList.add('right');
    } else {
      filterElement.classList.add('off');
      filterElement.classList.remove('on');
      filterLabel.classList.remove('right');
    }
    Master.changeAll();
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
    Master.changeAll();
  }

  var resetButton = document.querySelector('#reset');

  resetButton.addEventListener('click',resetAll);

  /**
  *  The Filters object! All the various CSS3-standard filters (excluding drop-shadow), which take arrays
  *      of either RGB or HSL triples. RGB values 0-255, HSL values 0-1, per @mjijackson spec.
  *  Opacity filter is handled within the changeAll function.
  *  Blur filter is handled within the writeIMG function.
  */

  var Master = {



    /**
    *  First, we get the ImageData from the BACKUP context.
    *  We then cycle through each RGBA quad in the data array, convert to HSL, apply saturate and hue.
    *  Then we convert back to RGB and apply all other filters, then feeding these RGB values back to the ImageData
    *  We also handle Opacity by adjusting Alpha values
    *  Finally we write the image to the display canvas*/

    changeAll: function() {
      var tempCanvas = document.createElement('canvas');
      tempCanvas.width = backup.width;
      tempCanvas.height = backup.height;
      var tempCtx = tempCanvas.getContext('2d');
      tempCtx.drawImage(backup, 0, 0);
      console.log(backup.width, tempCanvas.width);
      writeText(tempCtx);

      var pixels = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
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
      Master.writeIMG(pixels, averagePixel);
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
      displayCtx.clearRect(0, 0, display.width, display.height);
      var radius = Math.round(vals.blur);
      if (radius > 0) {
        StackBlur.imageDataRGBA(pixels, 0, 0, display.width, display.height, radius);
      }
      var newData = new ImageData(pixels.data, display.width, display.height);
      displayCtx.putImageData(newData,0,0);
    if (vals.border != defaults.border) {
      Master.drawBorder(vals.border, averagePixel);
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
