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
    }
};
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
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 *
 * Found at http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c,
 * originally from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
 */
function rgbToHsl(r, g, b){
  r /= 255;
  g /= 255;
  b /= 255;
  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    var d = max - min;
    s = (l > 0.5) ? (d / (2 - max - min)) : (d / (max + min));
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: break;
    }
    h /= 6;
  }

  return [h, s, l];
};

/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 *
 * Found at http://axonflux.com/handy-rgb-to-hsl-and-rgb-to-hsv-color-model-c,
 * originally from http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript
 */
function hslToRgb(h, s, l){
  var r, g, b;

  if(s === 0){
    r = g = b = l; // achromatic
  }else{
    function hue2rgb(p, q, t){
      if(t < 0) {t += 1;}
    if(t > 1) {t -= 1;}
      if(t < 1/6) {return p + (q - p) * 6 * t;}
      if(t < 1/2) {return q;}
      if(t < 2/3) {return p + (q - p) * (2/3 - t) * 6;}
      return p;
    }

    var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    var p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return [r * 255, g * 255, b * 255];
};
