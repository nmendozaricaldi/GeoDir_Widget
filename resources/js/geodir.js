/*
 GeoDir, a JavaScript library for georeferenciacion interactive and maps. http://www.geodir.co
 (c) 2014-2015, Danilo Nicolas Mendoza Ricaldi
*/

var G = {};
G.version = '0.1 Caral';
(function () {

  var ie = 'ActiveXObject' in window,
    ielt9 = ie && !document.addEventListener,

      // terrible browser detection to work around Safari / iOS / Android browser bugs
      ua = navigator.userAgent.toLowerCase(),
      webkit = ua.indexOf('webkit') !== -1,
      chrome = ua.indexOf('chrome') !== -1,
      phantomjs = ua.indexOf('phantom') !== -1,
      android = ua.indexOf('android') !== -1,
      android23 = ua.search('android [23]') !== -1,
    gecko = ua.indexOf('gecko') !== -1,

      mobile = typeof orientation !== undefined + '',
      msPointer = window.navigator && window.navigator.msPointerEnabled &&
                window.navigator.msMaxTouchPoints && !window.PointerEvent,
    pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) ||
          msPointer,
      retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
               ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
                window.matchMedia('(min-resolution:144dpi)').matches),

      doc = document.documentElement,
      ie3d = ie && ('transition' in doc.style),
      webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
      gecko3d = 'MozPerspective' in doc.style,
      opera3d = 'OTransition' in doc.style,
      any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;


  // PhantomJS has 'ontouchstart' in document.documentElement, but doesn't actually support touch.
  // https://github.com/Leaflet/Leaflet/pull/1434#issuecomment-13843151

  var touch = !window.L_NO_TOUCH && !phantomjs && (function () {

    var startName = 'ontouchstart';

    // IE10+ (We simulate these into touch* events in L.DomEvent and L.DomEvent.Pointer) or WebKit, etc.
    if (pointer || (startName in doc)) {
      return true;
    }

    // Firefox/Gecko
    var div = document.createElement('div'),
        supported = false;

    if (!div.setAttribute) {
      return false;
    }
    div.setAttribute(startName, 'return;');

    if (typeof div[startName] === 'function') {
      supported = true;
    }

    div.removeAttribute(startName);
    div = null;

    return supported;
  }());


  G.Browser = {
    ie: ie,
    ielt9: ielt9,
    webkit: webkit,
    gecko: gecko && !webkit && !window.opera && !ie,

    android: android,
    android23: android23,

    chrome: chrome,

    ie3d: ie3d,
    webkit3d: webkit3d,
    gecko3d: gecko3d,
    opera3d: opera3d,
    any3d: any3d,

    mobile: mobile,
    mobileWebkit: mobile && webkit,
    mobileWebkit3d: mobile && webkit3d,
    mobileOpera: mobile && window.opera,

    touch: touch,
    msPointer: msPointer,
    pointer: pointer,

    retina: retina
  };

}());

G.DomEvent = {
  /* inspired by John Resig, Dean Edwards and YUI addEvent implementations */
  addListener: function (obj, type, fn, context) { // (HTMLElement, String, Function[, Object])

    var id = G.stamp(fn),
        key = '_leaflet_' + type + id,
        handler, originalHandler, newType;

    if (obj[key]) { return this; }

    handler = function (e) {
      return fn.call(context || obj, e || G.DomEvent._getEvent());
    };

    if (G.Browser.pointer && type.indexOf('touch') === 0) {
      return this.addPointerListener(obj, type, handler, id);
    }
    if (G.Browser.touch && (type === 'dblclick') && this.addDoubleTapListener) {
      this.addDoubleTapListener(obj, handler, id);
    }

    if ('addEventListener' in obj) {

      if (type === 'mousewheel') {
        obj.addEventListener('DOMMouseScroll', handler, false);
        obj.addEventListener(type, handler, false);

      } else if ((type === 'mouseenter') || (type === 'mouseleave')) {

        originalHandler = handler;
        newType = (type === 'mouseenter' ? 'mouseover' : 'mouseout');

        handler = function (e) {
          if (!G.DomEvent._checkMouse(obj, e)) { return; }
          return originalHandler(e);
        };

        obj.addEventListener(newType, handler, false);

      } else if (type === 'click' && G.Browser.android) {
        originalHandler = handler;
        handler = function (e) {
          return G.DomEvent._filterClick(e, originalHandler);
        };

        obj.addEventListener(type, handler, false);
      } else {
        obj.addEventListener(type, handler, false);
      }

    } else if ('attachEvent' in obj) {
      obj.attachEvent('on' + type, handler);
    }

    obj[key] = handler;

    return this;
  },

  removeListener: function (obj, type, fn) {  // (HTMLElement, String, Function)

    var id = L.stamp(fn),
        key = '_leaflet_' + type + id,
        handler = obj[key];

    if (!handler) { return this; }

    if (L.Browser.pointer && type.indexOf('touch') === 0) {
      this.removePointerListener(obj, type, id);
    } else if (L.Browser.touch && (type === 'dblclick') && this.removeDoubleTapListener) {
      this.removeDoubleTapListener(obj, id);

    } else if ('removeEventListener' in obj) {

      if (type === 'mousewheel') {
        obj.removeEventListener('DOMMouseScroll', handler, false);
        obj.removeEventListener(type, handler, false);

      } else if ((type === 'mouseenter') || (type === 'mouseleave')) {
        obj.removeEventListener((type === 'mouseenter' ? 'mouseover' : 'mouseout'), handler, false);
      } else {
        obj.removeEventListener(type, handler, false);
      }
    } else if ('detachEvent' in obj) {
      obj.detachEvent('on' + type, handler);
    }

    obj[key] = null;

    return this;
  }
};

G.DomEvent.on = G.DomEvent.addListener;
G.DomEvent.off = G.DomEvent.removeListener;

G.Util = {
  extend: function (dest) { // (Object[, Object, ...]) ->
    var sources = Array.prototype.slice.call(arguments, 1),
        i, j, len, src;

    for (j = 0, len = sources.length; j < len; j++) {
      src = sources[j] || {};
      for (i in src) {
        if (src.hasOwnProperty(i)) {
          dest[i] = src[i];
        }
      }
    }
    return dest;
  },

  bind: function (fn, obj) { // (Function, Object) -> Function
    var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : null;
    return function () {
      return fn.apply(obj, args || arguments);
    };
  },

  stamp: (function () {
    var lastId = 0,
        key = '_leaflet_id';
    return function (obj) {
      obj[key] = obj[key] || ++lastId;
      return obj[key];
    };
  }()),

  invokeEach: function (obj, method, context) {
    var i, args;

    if (typeof obj === 'object') {
      args = Array.prototype.slice.call(arguments, 3);

      for (i in obj) {
        method.apply(context, [i, obj[i]].concat(args));
      }
      return true;
    }

    return false;
  },

  limitExecByInterval: function (fn, time, context) {
    var lock, execOnUnlock;

    return function wrapperFn() {
      var args = arguments;

      if (lock) {
        execOnUnlock = true;
        return;
      }

      lock = true;

      setTimeout(function () {
        lock = false;

        if (execOnUnlock) {
          wrapperFn.apply(context, args);
          execOnUnlock = false;
        }
      }, time);

      fn.apply(context, args);
    };
  },

  falseFn: function () {
    return false;
  },

  formatNum: function (num, digits) {
    var pow = Math.pow(10, digits || 5);
    return Math.round(num * pow) / pow;
  },

  trim: function (str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
  },

  splitWords: function (str) {
    return L.Util.trim(str).split(/\s+/);
  },

  setOptions: function (obj, options) {
    obj.options = L.extend({}, obj.options, options);
    return obj.options;
  },

  getParamString: function (obj, existingUrl, uppercase) {
    var params = [];
    for (var i in obj) {
      params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
    }
    return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
  },
  template: function (str, data) {
    return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
      var value = data[key];
      if (value === undefined) {
        throw new Error('No value provided for variable ' + str);
      } else if (typeof value === 'function') {
        value = value(data);
      }
      return value;
    });
  },

  isArray: Array.isArray || function (obj) {
    return (Object.prototype.toString.call(obj) === '[object Array]');
  },

  emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};
G.extend = G.Util.extend;
G.bind = G.Util.bind;
G.stamp = G.Util.stamp;
G.setOptions = G.Util.setOptions;
G.Class = function () {};
G.Class.extend = function (props) {

  // extended class with the new prototype
  var NewClass = function () {
    // call the constructor
    if (this.initialize) {
      
      this.initialize.apply(this, arguments);
    }

    // call all constructor hooks
    if (this._initHooks) {
      this.callInitHooks();
    }
  };

  // instantiate class without calling constructor
  var F = function () {};
  F.prototype = this.prototype;

  var proto = new F();
  proto.constructor = NewClass;

  NewClass.prototype = proto;

  //inherit parent's statics
  for (var i in this) {
    if (this.hasOwnProperty(i) && i !== 'prototype') {
      NewClass[i] = this[i];
    }
  }

  // mix static properties into the class
  if (props.statics) {
    G.extend(NewClass, props.statics);
    delete props.statics;
  }

  // mix includes into the prototype
  if (props.includes) {
    G.Util.extend.apply(null, [proto].concat(props.includes));
    delete props.includes;
  }

  // merge options
  if (props.options && proto.options) {
    props.options = G.extend({}, proto.options, props.options);
  }

  // mix given properties into the prototype
  G.extend(proto, props);

  proto._initHooks = [];

  var parent = this;
  // jshint camelcase: false
  NewClass.__super__ = parent.prototype;

  // add method for calling all hooks
  proto.callInitHooks = function () {

    if (this._initHooksCalled) { return; }

    if (parent.prototype.callInitHooks) {
      parent.prototype.callInitHooks.call(this);
    }

    this._initHooksCalled = true;

    for (var i = 0, len = proto._initHooks.length; i < len; i++) {
      proto._initHooks[i].call(this);
    }
  };
  return NewClass;
};
G.Geodir = G.Class.extend({  
  options: {
    url_service:'',
    showcoordenadas:true,
    showmap:true,
    mapOptions:{
      style:{
        height:'200px',
        width:'100%',
      },
      tiled:'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ',
      attribution:'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' +
        '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="http://mapbox.com">Mapbox</a>',
      id:'mapbox.streets',
      viewX:-75.2243,
      viewY:-12.0458
    }
  },
  initialize: function (id, options) { 
    console.log(options)
    //contenedor de formulario
    this._initContainer(id);
    this._initLayout();
    for (var i in options) {
      if (i == 'mapOptions') {
        for (var j in options[i]) {
          if (j== 'style') {
              for (var k in options[i][j]) {
                  this.options[i][j][k] = options[i][j][k];
              }
          }else{
            this.options[i][j] = options[i][j];
          };
        }
      }else{
         this.options[i] = options[i];
       };
    }
    this._createForm();
    this.options.showmap? this._createMap():'';
  },
  _createMap:function(){
    var f = this._form;
    var   col = document.createElement('div');
    col.className="geodir-form-group";
    var row = document.createElement('div');
    row.className='geodir-map-container';

    for (var i in this.options.mapOptions.style) {
          row.style[i]=this.options.mapOptions.style[i];        
    }
    
    row.id='mapGeodir';
     col.appendChild(row);
    f.appendChild(col);
    try {
      this._map = L.map('mapGeodir').setView([this.options.mapOptions.viewY, this.options.mapOptions.viewX], 8);
       L.tileLayer(this.options.mapOptions.tiled, {
        maxZoom: 18,
        attribution: this.options.mapOptions.attribution,
        id: this.options.mapOptions.id
      }).addTo(this._map);
      this._markers = L.featureGroup().addTo(this._map);
    } catch (e) {
     this.options.showmap=false;
    }

  },
  _createForm:function(){
    var f = this._form = document.createElement('form');
    f.className="geodir-form";
    f.addEventListener('submit', function () {
      event.preventDefault();
      }, false); 
    var row = document.createElement('div');
    row.className='geodir-form-group';

    var input = document.createElement('input');
    input.type = 'text';
    input.id='geodirDireccion';
    input.name='geodirDireccion';
    input.className = 'geodir-form-control';
   

    var   col = document.createElement('div');
    col.className="geodir-col-md-12";
    G.DomEvent.on(input, 'keydown', this._onKeyPress, this); 
    col.appendChild(input);
    row.appendChild(col);
    f.appendChild(row);

    row = document.createElement('div');
    row.className='geodir-form-group';
    //coordenada X
    col = document.createElement('div');
    col.className="geodir-col-md-6";
    input = document.createElement('input');
    input.type = 'text';
    input.id='geodir_coordenadax';
    input.name='geodir_coordenadax';
    input.readOnly = true;
    input.className = 'geodir-form-control';  
    col.appendChild(input);
    console.log(this.options.showcoordenadas);
    row.appendChild(col);
    
    //coordenada y
    col = document.createElement('div');
    col.className="geodir-col-md-6";
    input = document.createElement('input');
    input.type = 'text';
    input.id='geodir_coordenaday';
    input.name='geodir_coordenaday';
    input.readOnly = true;
    input.className = 'geodir-form-control';  
    col.appendChild(input);
    row.appendChild(col);

    this.options.showcoordenadas? f.appendChild(row):'';
    row = document.createElement('div');
    row.className='geodir-form-group  geodir-form-control-btn';
    //button
    col = document.createElement('div');
    col.className="geodir-col-md-12";
    var btninput = document.createElement('input');
    btninput.type = 'button';
    btninput.id='geodir_btngeoreferenciar';
    btninput.name='geodir_btngeoreferenciar';
    btninput.value = 'buscar';
    btninput.className='geodir-control-btn'; 
    G.DomEvent.on(btninput, 'click', this._georeferenciar, this); 
    col.appendChild(btninput);
    row.appendChild(col);
    //insertar row to form

    f.appendChild(row);
    this._form=f;
    this._container.appendChild(f);
  },
   // geodir initialization methods
  _initContainer: function (id) {
    var container = this._container = document.getElementById(id);
    if (!container) {
      throw new Error('Geodir container not found.');
    } else if (container._leaflet) {
      throw new Error('Geodir container is already initialized.');
    }
    container._leaflet = true;
  }, 
  _initLayout: function () {
    var container = this._container;
    container.className = "geodir-contenedor";
  },
  _georeferenciar:function (){


        if (this._form.elements['geodirDireccion'].value=='') {
          return;
        };
        if (this._georef) {
          return;
        };
        this._georef=true;
        
        this._form.elements['geodirDireccion'].style.cursor='wait';
        this._form.elements['geodir_btngeoreferenciar'].style.cursor='wait';
        document.getElementsByTagName("body")[0].style.cursor='wait';
        var geodir = this;
        var coordenadaX,coordenadaY;
        var mostrarcoordenadas = this.options.showcoordenadas;
        if (mostrarcoordenadas) {
            coordenadaX =this._form.elements['geodir_coordenadax'];
            coordenadaY =this._form.elements['geodir_coordenaday'];
            coordenadaX.value='Georeferenciando..';
            coordenadaY.value='Georeferenciando..';
        };
        var opcionesmostrar = this.options;
        var funvionmostrar = this._showMarkerOnMap;
         jQuery.ajax({
          type : "GET",
          crossDomain : true,
          dataType : 'jsonp',
          jsonp : 'callback',
          jsonpCallback : 'jsonpCallback',
          contentType : "application/json; charset=utf-8",
          url : this.options.url_service+'/rest/georef/geodir?',
          data : {
            'direccion' : this._form.elements['geodirDireccion'].value
          },
          error : function(jqXHR, textStatus, errorThrown) {
            if (mostrarcoordenadas) {
                while( coordenadaX.firstChild ) {
                    coordenadaX.removeChild( coordenadaX.firstChild );
                }
            
              coordenadaX.value= 'Error de conexion';
              coordenadaY.value= 'Error de conexion';
            };
            geodir._form.elements['geodirDireccion'].style.cursor='auto';
            geodir._georef=false;
            document.getElementsByTagName("body")[0].style.cursor='auto';
            this._form.elements['geodir_btngeoreferenciar'].style.cursor='auto';
          },
          success : function(resp) {
            if (mostrarcoordenadas) {
                while( coordenadaX.firstChild ) {
                    coordenadaX.removeChild( coordenadaX.firstChild );
                }
                coordenadaX.value =resp.x;
                coordenadaY.value=resp.y;
            };
            geodir._form.elements['geodirDireccion'].style.cursor='auto';
            opcionesmostrar.showmap? funvionmostrar(resp.x, resp.y,geodir):'';
            geodir._georef=false;
            document.getElementsByTagName("body")[0].style.cursor='auto';
            geodir._form.elements['geodir_btngeoreferenciar'].style.cursor='auto';

          }
        });
  },
  _showMarkerOnMap:function (lng, lat,geodir){
      function pintarMarker(coorx, coory,geodirres, centrarMapa) {
        geodirres._markers.clearLayers();
        var mark=L.marker([coory,coorx]).bindPopup(geodirres._form.elements['geodirDireccion'].value).openPopup();
        geodirres._markers.addLayer(mark);
        centrarMapa(geodirres._markers.getBounds());
      }
      pintarMarker(lng,lat,geodir, function(bounds) {
         geodir._map.fitBounds(bounds);
      });
  },
  _onKeyPress:function (ev){
      if(ev.keyCode == 13){
        this._georeferenciar();
         return false;
      }
  }
});

G.geodir = function (id, options) {
  return new G.Geodir(id, options);
};
/*
var geodircontenido = new G.geodir('contenedorForm',
  {url_service:'http://192.168.1.142:8085/geodirservice'});
*/