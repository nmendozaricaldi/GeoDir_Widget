/*
 GeoDir, a JavaScript library for georeferenciacion interactive and maps. http://www.geodir.co
 (c) 2014-2015, Danilo Nicolas Mendoza Ricaldi
 */
/** 
 * An autosuggest textbox control.
 * @class
 * @scope public
 */
function AutoSuggestControl(oTextbox /*:HTMLInputElement*/ ,
    oContainer /*:HTMLInputElement*/ ,
    oProvider /*:SuggestionProvider*/ ) {

    /**
     * The currently selected suggestions.
     * @scope private
     */
    this.cur /*:int*/ = -1;

    /**
     * The dropdown list layer.
     * @scope private
     */
    this.layer = null;

    this.nroPuerta = '';
    this._cargarData = true;
    /**
     * Suggestion provider for the autosuggest feature.
     * @scope private.
     */
    this.provider /*:SuggestionProvider*/ = oProvider;

    /**
     * The textbox to capture.
     * @scope private
     */
    this.textbox /*:HTMLInputElement*/ = oTextbox;

    this.container = oContainer;
    //initialize the control
    this.init();

}

/**
 * Autosuggests one or more suggestions for what the user has typed.
 * If no suggestions are passed in, then no autosuggest occurs.
 * @scope private
 * @param aSuggestions An array of suggestion strings.
 * @param bTypeAhead If the control should provide a type ahead suggestion.
 */
AutoSuggestControl.prototype.autosuggest = function(aSuggestions /*:Array*/ ,
    bTypeAhead /*:boolean*/ ) {
    //make sure there's at least one suggestion
    if (aSuggestions.length > 0) {
        if (bTypeAhead) {
            //this.typeAhead(aSuggestions[0]);
        }

        this.showSuggestions(aSuggestions);
    } else {
        this.hideSuggestions();
    }
};

/**
 * Creates the dropdown layer to display multiple suggestions.
 * @scope private
 */
AutoSuggestControl.prototype.createDropDown = function() {

    var oThis = this;

    //create the layer and assign styles
    this.layer = document.createElement("div");
    this.layer.className = "suggestions";
    this.layer.style.visibility = "hidden";
    this.layer.style.width = this.textbox.style.width;
    //when the user clicks on the a suggestion, get the text (innerHTML)
    //and place it into a textbox
    this.layer.onmousedown =
        this.layer.onmouseup =
        this.layer.onmouseover = function(oEvent) {
            oEvent = oEvent || window.event;
            oTarget = oEvent.target || oEvent.srcElement;

            if (oEvent.type == "mousedown") {
                oThis.textbox.value = oTarget.getAttribute('data_geodir');
                oThis.hideSuggestions();
            } else if (oEvent.type == "mouseover") {
                oThis.highlightSuggestion(oTarget);
            } else {
                oThis.textbox.focus();
            }
        };
    this.container.appendChild(this.layer);
};

/**
 * Gets the left coordinate of the textbox.
 * @scope private
 * @return The left coordinate of the textbox in pixels.
 */
AutoSuggestControl.prototype.getLeft = function() /*:int*/ {

    var oNode = this.textbox;
    var iLeft = 0;

    while (oNode.tagName != "BODY") {
        iLeft += oNode.offsetLeft;
        oNode = oNode.offsetParent;
    }

    return iLeft;
};

/**
 * Gets the top coordinate of the textbox.
 * @scope private
 * @return The top coordinate of the textbox in pixels.
 */
AutoSuggestControl.prototype.getTop = function() /*:int*/ {

    var oNode = this.textbox;
    var iTop = 0;

    while (oNode.tagName != "BODY") {
        iTop += oNode.offsetTop;
        oNode = oNode.offsetParent;
    }

    return iTop;
};

/**
 * Handles three keydown events.
 * @scope private
 * @param oEvent The event object for the keydown event.
 */
AutoSuggestControl.prototype.handleKeyDown = function(oEvent /*:Event*/ ) {

    switch (oEvent.keyCode) {
        case 38: //up arrow
            this.previousSuggestion();
            break;
        case 40: //down arrow 
            this.nextSuggestion();
            break;
        case 13: //enter
            this.hideSuggestions();
            break;
    }

};

/**
 * Handles keyup events.
 * @scope private
 * @param oEvent The event object for the keyup event.
 */
AutoSuggestControl.prototype.handleKeyUp = function(oEvent /*:Event*/ ) {

    var iKeyCode = oEvent.keyCode;

    //for backspace (8) and delete (46), shows suggestions without typeahead
    if (iKeyCode == 8 || iKeyCode == 46) {
        this.cur = -1;
        this.provider.requestSuggestions(this, false);
        this.cur = -1;
        this._cargarData = true;

        //make sure not to interfere with non-character keys
    } else if (iKeyCode < 32 || (iKeyCode >= 33 && iKeyCode < 46) || (iKeyCode >= 112 && iKeyCode <= 123)) {
        //ignore
    } else {
        //request suggestions from the suggestion provider with typeahead
        this.provider.requestSuggestions(this, true);
    }
};

/**
 * Hides the suggestion dropdown.
 * @scope private
 */
AutoSuggestControl.prototype.hideSuggestions = function() {
    this.layer.style.visibility = "hidden";
};

/**
 * Highlights the given node in the suggestions dropdown.
 * @scope private
 * @param oSuggestionNode The node representing a suggestion in the dropdown.
 */
AutoSuggestControl.prototype.highlightSuggestion = function(oSuggestionNode) {
    for (var i = 0; i < this.layer.childNodes.length; i++) {
        var oNode = this.layer.childNodes[i];
        if (oNode == oSuggestionNode) {
            oNode.className = "current"
        } else if (oNode.className == "current") {
            oNode.className = "";
        }
    }
};

/**
 * Initializes the textbox with event handlers for
 * auto suggest functionality.
 * @scope private
 */
AutoSuggestControl.prototype.init = function() {

    //save a reference to this object
    var oThis = this;

    //assign the onkeyup event handler
    this.textbox.onkeyup = function(oEvent) {
        //check for the proper location of the event object
        if (!oEvent) {
            oEvent = window.event;
        }

        //call the handleKeyUp() method with the event object
        oThis.handleKeyUp(oEvent);
    };

    //assign onkeydown event handler
    this.textbox.onkeydown = function(oEvent) {

        //check for the proper location of the event object
        if (!oEvent) {
            oEvent = window.event;
        }

        //call the handleKeyDown() method with the event object
        oThis.handleKeyDown(oEvent);
    };

    //assign onblur event handler (hides suggestions)    
    this.textbox.onblur = function() {
        oThis.hideSuggestions();
    };

    //create the suggestions dropdown
    this.createDropDown();
};

/**
 * Highlights the next suggestion in the dropdown and
 * places the suggestion into the textbox.
 * @scope private
 */
AutoSuggestControl.prototype.nextSuggestion = function() {
    var cSuggestionNodes = this.layer.childNodes;
    if (cSuggestionNodes.length > 0 && this.cur < cSuggestionNodes.length - 1) {
        var oNode = cSuggestionNodes[++this.cur];
        this.highlightSuggestion(oNode);
        this.textbox.value = oNode.getAttribute('data_geodir');
    }
};

/**
 * Highlights the previous suggestion in the dropdown and
 * places the suggestion into the textbox.
 * @scope private
 */
AutoSuggestControl.prototype.previousSuggestion = function() {
    var cSuggestionNodes = this.layer.childNodes;

    if (cSuggestionNodes.length > 0 && this.cur > 0) {
        var oNode = cSuggestionNodes[--this.cur];
        this.highlightSuggestion(oNode);
        this.textbox.value = oNode.getAttribute('data_geodir');
    }
};

/**
 * Selects a range of text in the textbox.
 * @scope public
 * @param iStart The start index (base 0) of the selection.
 * @param iLength The number of characters to select.
 */
AutoSuggestControl.prototype.selectRange = function(iStart /*:int*/ , iLength /*:int*/ ) {

    //use text ranges for Internet Explorer
    if (this.textbox.createTextRange) {
        var oRange = this.textbox.createTextRange();
        oRange.moveStart("character", iStart);
        oRange.moveEnd("character", iLength - this.textbox.value.length);
        oRange.select();

        //use setSelectionRange() for Mozilla
    } else if (this.textbox.setSelectionRange) {
        this.textbox.setSelectionRange(iStart, iLength);
    }

    //set focus back to the textbox
    this.textbox.focus();
};

/**
 * Builds the suggestion layer contents, moves it into position,
 * and displays the layer.
 * @scope private
 * @param aSuggestions An array of suggestions for the control.
 */
AutoSuggestControl.prototype.showSuggestions = function(aSuggestions /*:Array*/ ) {

    var oDiv = null;
    this.layer.innerHTML = ""; //clear contents of the layer
    var oSpan = null;
    var mypuntuacionopc = new RegExp(' ', 'g');
    var oInText = this.textbox.value;
    oInText = oInText.trim().replace(mypuntuacionopc, '\\,? ');
    var myRe = new RegExp('(' + oInText + ')', 'gi');
    var myRePuerta = new RegExp('(' + this.nroPuerta + ')', 'gi');
    for (var i = 0; i < aSuggestions.length; i++) {
        oDiv = document.createElement("div");
        var oSug = aSuggestions[i].replace(myRe, '<span class="geodir-number-autosuggest">$1</span>');
        if (this.nroPuerta != '') {
            oSug = oSug.replace(myRePuerta, '<i><b>$1</b></i>');
        };

        oDiv.innerHTML = oSug;
        oDiv.setAttribute("data_geodir", aSuggestions[i]);
        this.layer.appendChild(oDiv);
    }
    if (aSuggestions.length == 0) {
        oDiv = document.createElement("div");
        var oSug = 'No se encontro registros...'

        oDiv.innerHTML = oSug;
        oDiv.setAttribute("data_geodir", '');
        this.layer.appendChild(oDiv);
    };

    //this.layer.style.left = this.getLeft() + "px";
    //this.layer.style.top = (this.getTop()+this.textbox.offsetHeight) + "px";
    this.layer.style.visibility = "visible";

};

/**
 * Inserts a suggestion into the textbox, highlighting the 
 * suggested part of the text.
 * @scope private
 * @param sSuggestion The suggestion for the textbox.
 */
AutoSuggestControl.prototype.typeAhead = function(sSuggestion /*:String*/ ) {

    //check for support of typeahead functionality
    if (this.textbox.createTextRange || this.textbox.setSelectionRange) {
        var iLen = this.textbox.value.length;
        this.textbox.value = sSuggestion;
        this.selectRange(iLen, sSuggestion.length);
    }
};


/**
 * Provides suggestions for state names (USA).
 * @class
 * @scope public
 */
function StateSuggestions() {
    var states =
        this.states = [];
    this._reloading = false;
    jQuery
        .ajax({
            type: "GET",
            crossDomain: true,
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'jsonpCallback',
            contentType: "application/json; charset=utf-8",
            url: 'http://www.geodir.co/geodirservice/rest/geodir/direciones?',
            data: {
                'direccion': 'jiron'
            },
            error: function(jqXHR, textStatus, errorThrown) {

            },
            success: function(resp) {
                for (var i in resp) {
                    states.push(resp[i].suggest);
                }
            }
        });
}

/**
 * Request suggestions for the given autosuggest control. 
 * @scope protected
 * @param oAutoSuggestControl The autosuggest control to provide suggestions for.
 */
StateSuggestions.prototype.requestSuggestions = function(oAutoSuggestControl /*:AutoSuggestControl*/ ,
    bTypeAhead /*:boolean*/ ) {
    var aSuggestions = [];
    var _oAutoSuggestControl = oAutoSuggestControl;
    var sTextboxValue = oAutoSuggestControl.textbox.value;
    var caseToRepalceText = 0;
    var caseToRepalceNumero = 0;
    var textReplaceFinal = '';
    var indexReplace = 0;
    var sTextboxValueToClean = oAutoSuggestControl.textbox.value.trim();
    var _regNROP = new RegExp(' nro \\d+', 'gi');
    var _regNRO = new RegExp(' nro', 'gi');
    var _regNR = new RegExp(' nr', 'gi');
    var _regN = new RegExp(' n', 'gi');
    var match_regNROP = _regNROP.exec(sTextboxValueToClean);
    var match_regNRO = _regNRO.exec(sTextboxValueToClean);
    var match_regNR = _regNR.exec(sTextboxValueToClean);
    var match_regN = _regN.exec(sTextboxValueToClean);

    if (match_regNROP != null) {
        indexReplace = match_regNROP.index;
        caseToRepalceText = 1;
        textReplaceFinal = match_regNROP[0];
    } else if (match_regNRO != null) {
        indexReplace = match_regNRO.index;
        caseToRepalceText = 2;
        textReplaceFinal = match_regNRO[0];
    } else if (match_regNR != null) {
        indexReplace = match_regNR.index;
        caseToRepalceText = 3;
        textReplaceFinal = match_regNR[0];
    } else if (match_regN != null) {
        indexReplace = match_regN.index;
        caseToRepalceText = 4;
        textReplaceFinal = match_regN[0];
    } else {
        indexReplace = 0;
        caseToRepalceText = 0;
        textReplaceFinal = '';
    };
    if (sTextboxValue.length > 0) {
        var mypuntuacion = new RegExp(',', 'gi');
        var regFinal = sTextboxValue.trim();
        regFinal = regFinal.replace(mypuntuacion, '\\,?');
        var replaceEncontrado = new RegExp(textReplaceFinal, 'gi');
        if (caseToRepalceText > 0) {
            _oAutoSuggestControl.nroPuerta = textReplaceFinal;
            regFinal = regFinal.replace(textReplaceFinal, '');
        };
        var myRe = new RegExp(regFinal, 'i');
        for (var i = 0; i < this.states.length; i++) {
            var match_final = myRe.exec(this.states[i].replace(mypuntuacion, ''))
            if (match_final != null) {
                if (caseToRepalceText > 0) {
                    var result = this.states[i].splice(match_final.index + indexReplace, 0, textReplaceFinal);

                    aSuggestions.push(result);
                } else {
                    aSuggestions.push(this.states[i]);
                };

            }
            /*
                        if (this.states[i].toUpperCase().indexOf(sTextboxValue.toUpperCase()) >= 0) {
                           aSuggestions.push(this.states[i]);
                       } */
        }
    }

    if (aSuggestions.length == 0 && sTextboxValue.length > 0) {

        this.reloadData(sTextboxValue, oAutoSuggestControl, bTypeAhead);
    }
    //provide suggestions to the control
    oAutoSuggestControl.autosuggest(aSuggestions, bTypeAhead);

};

String.prototype.splice = function(idx, rem, s) {
    return (this.slice(0, idx) + s + this.slice(idx + Math.abs(rem)));
};

StateSuggestions.prototype.reloadData = function(oTextboxValue, oAutoSuggestControl, bTypeAhead) {
    var oIsReloading = this._reloading;
    if (oIsReloading) {
        return;
    };
    if (!oAutoSuggestControl._cargarData) {
        return;
    };
    this._reloading = true;
    var states =
        this.states = [];
    var _oAutoSuggestControl = oAutoSuggestControl;
    _oAutoSuggestControl.textbox.style.cursor = 'wait';
    var _bTypeAhead = bTypeAhead;
    var sugg = this;
    var texto = oTextboxValue;
    var myRe = new RegExp('( nro \\d+)', 'gi');
    texto = texto.replace(myRe, '');
    jQuery
        .ajax({
            type: "GET",
            crossDomain: true,
            dataType: 'jsonp',
            jsonp: 'callback',
            jsonpCallback: 'jsonpCallback',
            contentType: "application/json; charset=utf-8",
            url: 'http://www.geodir.co/geodirservice/rest/geodir/direciones?',
            data: {
                'direccion': texto
            },
            error: function(jqXHR, textStatus, errorThrown) {
                _oAutoSuggestControl.textbox.style.cursor = 'auto';
                sugg._reloading = false;
                _oAutoSuggestControl._cargarData = false;
            },
            success: function(resp) {
                for (var i in resp) {
                    states.push(resp[i].suggest);
                }
                _oAutoSuggestControl.textbox.style.cursor = 'auto';
                sugg.requestSuggestions(_oAutoSuggestControl, _bTypeAhead);
                sugg._reloading = false;
            }
        });

};


var G = {};
G.version = '0.1 Caral';

G.DomUtil = {
    get: function(id) {
        return (typeof id === 'string' ? document.getElementById(id) : id);
    },

    getStyle: function(el, style) {

        var value = el.style[style];

        if (!value && el.currentStyle) {
            value = el.currentStyle[style];
        }

        if ((!value || value === 'auto') && document.defaultView) {
            var css = document.defaultView.getComputedStyle(el, null);
            value = css ? css[style] : null;
        }

        return value === 'auto' ? null : value;
    },

    getViewportOffset: function(element) {

        var top = 0,
            left = 0,
            el = element,
            docBody = document.body,
            docEl = document.documentElement,
            pos;

        do {
            top += el.offsetTop || 0;
            left += el.offsetLeft || 0;

            //add borders
            top += parseInt(L.DomUtil.getStyle(el, 'borderTopWidth'), 10) || 0;
            left += parseInt(L.DomUtil.getStyle(el, 'borderLeftWidth'), 10) || 0;

            pos = L.DomUtil.getStyle(el, 'position');

            if (el.offsetParent === docBody && pos === 'absolute') {
                break;
            }

            if (pos === 'fixed') {
                top += docBody.scrollTop || docEl.scrollTop || 0;
                left += docBody.scrollLeft || docEl.scrollLeft || 0;
                break;
            }

            if (pos === 'relative' && !el.offsetLeft) {
                var width = L.DomUtil.getStyle(el, 'width'),
                    maxWidth = L.DomUtil.getStyle(el, 'max-width'),
                    r = el.getBoundingClientRect();

                if (width !== 'none' || maxWidth !== 'none') {
                    left += r.left + el.clientLeft;
                }

                //calculate full y offset since we're breaking out of the loop
                top += r.top + (docBody.scrollTop || docEl.scrollTop || 0);

                break;
            }

            el = el.offsetParent;

        } while (el);

        el = element;

        do {
            if (el === docBody) {
                break;
            }

            top -= el.scrollTop || 0;
            left -= el.scrollLeft || 0;

            el = el.parentNode;
        } while (el);

        return new L.Point(left, top);
    },

    documentIsLtr: function() {
        if (!L.DomUtil._docIsLtrCached) {
            L.DomUtil._docIsLtrCached = true;
            L.DomUtil._docIsLtr = L.DomUtil.getStyle(document.body, 'direction') === 'ltr';
        }
        return L.DomUtil._docIsLtr;
    },

    create: function(tagName, className, container) {

        var el = document.createElement(tagName);
        el.className = className;

        if (container) {
            container.appendChild(el);
        }

        return el;
    },

    hasClass: function(el, name) {
        if (el.classList !== undefined) {
            return el.classList.contains(name);
        }
        var className = L.DomUtil._getClass(el);
        return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
    },

    addClass: function(el, name) {
        if (el.classList !== undefined) {
            var classes = L.Util.splitWords(name);
            for (var i = 0, len = classes.length; i < len; i++) {
                el.classList.add(classes[i]);
            }
        } else if (!L.DomUtil.hasClass(el, name)) {
            var className = L.DomUtil._getClass(el);
            L.DomUtil._setClass(el, (className ? className + ' ' : '') + name);
        }
    },

    removeClass: function(el, name) {
        if (el.classList !== undefined) {
            el.classList.remove(name);
        } else {
            L.DomUtil._setClass(el, L.Util.trim((' ' + L.DomUtil._getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
        }
    },

    _setClass: function(el, name) {
        if (el.className.baseVal === undefined) {
            el.className = name;
        } else {
            // in case of SVG element
            el.className.baseVal = name;
        }
    },

    _getClass: function(el) {
        return el.className.baseVal === undefined ? el.className : el.className.baseVal;
    },

    setOpacity: function(el, value) {

        if ('opacity' in el.style) {
            el.style.opacity = value;

        } else if ('filter' in el.style) {

            var filter = false,
                filterName = 'DXImageTransform.Microsoft.Alpha';

            // filters collection throws an error if we try to retrieve a filter that doesn't exist
            try {
                filter = el.filters.item(filterName);
            } catch (e) {
                // don't set opacity to 1 if we haven't already set an opacity,
                // it isn't needed and breaks transparent pngs.
                if (value === 1) {
                    return;
                }
            }

            value = Math.round(value * 100);

            if (filter) {
                filter.Enabled = (value !== 100);
                filter.Opacity = value;
            } else {
                el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
            }
        }
    },

    testProp: function(props) {

        var style = document.documentElement.style;

        for (var i = 0; i < props.length; i++) {
            if (props[i] in style) {
                return props[i];
            }
        }
        return false;
    },

    getTranslateString: function(point) {
        // on WebKit browsers (Chrome/Safari/iOS Safari/Android) using translate3d instead of translate
        // makes animation smoother as it ensures HW accel is used. Firefox 13 doesn't care
        // (same speed either way), Opera 12 doesn't support translate3d

        var is3d = L.Browser.webkit3d,
            open = 'translate' + (is3d ? '3d' : '') + '(',
            close = (is3d ? ',0' : '') + ')';

        return open + point.x + 'px,' + point.y + 'px' + close;
    },

    getScaleString: function(scale, origin) {

        var preTranslateStr = L.DomUtil.getTranslateString(origin.add(origin.multiplyBy(-1 * scale))),
            scaleStr = ' scale(' + scale + ') ';

        return preTranslateStr + scaleStr;
    },

    setPosition: function(el, point, disable3D) { // (HTMLElement, Point[, Boolean])

        // jshint camelcase: false
        el._leaflet_pos = point;

        if (!disable3D && L.Browser.any3d) {
            el.style[L.DomUtil.TRANSFORM] = L.DomUtil.getTranslateString(point);
        } else {
            el.style.left = point.x + 'px';
            el.style.top = point.y + 'px';
        }
    },

    getPosition: function(el) {
        // this method is only used for elements previously positioned using setPosition,
        // so it's safe to cache the position for performance

        // jshint camelcase: false
        return el._leaflet_pos;
    }
};

(function() {

    var ie = 'ActiveXObject' in window,
        ielt9 = ie && !document.addEventListener,

        // terrible browser detection to work around Safari / iOS / Android browser
        // bugs
        ua = navigator.userAgent.toLowerCase(),
        webkit = ua.indexOf('webkit') !== -1,
        chrome = ua
        .indexOf('chrome') !== -1,
        phantomjs = ua.indexOf('phantom') !== -1,
        android = ua
        .indexOf('android') !== -1,
        android23 = ua.search('android [23]') !== -1,
        gecko = ua
        .indexOf('gecko') !== -1,

        mobile = typeof orientation !== undefined + '',
        msPointer = window.navigator && window.navigator.msPointerEnabled && window.navigator.msMaxTouchPoints && !window.PointerEvent,
        pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) || msPointer,
        retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) || ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') && window
            .matchMedia('(min-resolution:144dpi)').matches),

        doc = document.documentElement,
        ie3d = ie && ('transition' in doc.style),
        webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
        gecko3d = 'MozPerspective' in doc.style,
        opera3d = 'OTransition' in doc.style,
        any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d || opera3d) && !phantomjs;



    var touch = !window.L_NO_TOUCH && !phantomjs && (function() {

        var startName = 'ontouchstart';

        // IE10+ (We simulate these into touch* events in L.DomEvent and
        // L.DomEvent.Pointer) or WebKit, etc.
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
    addListener: function(obj, type, fn, context) { // (HTMLElement, String,
        // Function[, Object])

        var id = G.stamp(fn),
            key = '_geodir_' + type + id,
            handler, originalHandler, newType;

        if (obj[key]) {
            return this;
        }

        handler = function(e) {
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

                handler = function(e) {
                    if (!G.DomEvent._checkMouse(obj, e)) {
                        return;
                    }
                    return originalHandler(e);
                };

                obj.addEventListener(newType, handler, false);

            } else if (type === 'click' && G.Browser.android) {
                originalHandler = handler;
                handler = function(e) {
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

    removeListener: function(obj, type, fn) { // (HTMLElement, String,
        // Function)

        var id = L.stamp(fn),
            key = '_geodir_' + type + id,
            handler = obj[key];

        if (!handler) {
            return this;
        }

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
    extend: function(dest) { // (Object[, Object, ...]) ->
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

    bind: function(fn, obj) { // (Function, Object) -> Function
        var args = arguments.length > 2 ? Array.prototype.slice.call(arguments,
            2) : null;
        return function() {
            return fn.apply(obj, args || arguments);
        };
    },

    stamp: (function() {
        var lastId = 0,
            key = '_geodir_id';
        return function(obj) {
            obj[key] = obj[key] || ++lastId;
            return obj[key];
        };
    }()),

    invokeEach: function(obj, method, context) {
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

    limitExecByInterval: function(fn, time, context) {
        var lock, execOnUnlock;

        return function wrapperFn() {
            var args = arguments;

            if (lock) {
                execOnUnlock = true;
                return;
            }

            lock = true;

            setTimeout(function() {
                lock = false;

                if (execOnUnlock) {
                    wrapperFn.apply(context, args);
                    execOnUnlock = false;
                }
            }, time);

            fn.apply(context, args);
        };
    },

    falseFn: function() {
        return false;
    },

    formatNum: function(num, digits) {
        var pow = Math.pow(10, digits || 5);
        return Math.round(num * pow) / pow;
    },

    trim: function(str) {
        return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    },

    splitWords: function(str) {
        return L.Util.trim(str).split(/\s+/);
    },

    setOptions: function(obj, options) {
        obj.options = L.extend({}, obj.options, options);
        return obj.options;
    },

    getParamString: function(obj, existingUrl, uppercase) {
        var params = [];
        for (var i in obj) {
            params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
        }
        return ((!existingUrl || existingUrl.indexOf('?') === -1) ? '?' : '&') + params.join('&');
    },
    template: function(str, data) {
        return str.replace(/\{ *([\w_]+) *\}/g, function(str, key) {
            var value = data[key];
            if (value === undefined) {
                throw new Error('No value provided for variable ' + str);
            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        });
    },

    isArray: Array.isArray || function(obj) {
        return (Object.prototype.toString.call(obj) === '[object Array]');
    },

    emptyImageUrl: 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
};
G.extend = G.Util.extend;
G.bind = G.Util.bind;
G.stamp = G.Util.stamp;
G.setOptions = G.Util.setOptions;
G.Class = function() {};
G.Class.extend = function(props) {

    // extended class with the new prototype
    var NewClass = function() {
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
    var F = function() {};
    F.prototype = this.prototype;

    var proto = new F();
    proto.constructor = NewClass;

    NewClass.prototype = proto;

    // inherit parent's statics
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
    proto.callInitHooks = function() {

        if (this._initHooksCalled) {
            return;
        }

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

G.Geodir = G.Class
    .extend({
        options: {
            url_service: 'http://192.168.1.142:8085/geodirservice',
            showcoordenadas: true,
            showmap: true,
            mapOptions: {
                style: {
                    //height : '100%',
                    width: '100%',
                },
                tiled: 'https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6IjZjNmRjNzk3ZmE2MTcwOTEwMGY0MzU3YjUzOWFmNWZhIn0.Y8bhBaUMqFiPrDRW9hieoQ',
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, ' + '<a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' + 'Imagery © <a href="http://mapbox.com">Mapbox</a>',
                id: 'mapbox.streets',
                viewX: -75.2243,
                viewY: -12.0458
            }
        },
        initialize: function(id, options) {
            // contenedor de formulario
            this._initContainer(id);
            this._initLayout();
            for (var i in options) {
                if (i == 'mapOptions') {
                    for (var j in options[i]) {
                        if (j == 'style') {
                            for (var k in options[i][j]) {
                                this.options[i][j][k] = options[i][j][k];
                            }
                        } else {
                            this.options[i][j] = options[i][j];
                        };
                    }
                } else {
                    this.options[i] = options[i];
                };
            }
            this._createForm();
            this.options.showmap ? this._createMap() : '';
        },
        _createMap: function() {
            var f = this._form;
            var col = document.createElement('div');
            col.className = "geodir-form-group";
            var row = document.createElement('div');
            row.className = 'geodir-map-container';
            for (var i in this.options.mapOptions.style) {
                row.style[i] = this.options.mapOptions.style[i];
            }
            var idMap = 'mapGeodir_' + Math.floor(Math.random() * (100));
            row.id = idMap;
            col.appendChild(row);
            row = document.createElement('div');
            row.className = "geodir-form-container";
            row.appendChild(col);
            f.appendChild(row);
            try {
                this._map = L.map(idMap).setView(
                    [this.options.mapOptions.viewY,
                        this.options.mapOptions.viewX
                    ], 8);
                L.tileLayer(this.options.mapOptions.tiled, {
                    maxZoom: 18,
                    attribution: this.options.mapOptions.attribution,
                    id: this.options.mapOptions.id
                }).addTo(this._map);
                this._markers = L.featureGroup().addTo(this._map);
            } catch (e) {
                this.options.showmap = false;
            }

        },
        _createForm: function() {
            // metodo creacion formulario que se sobreescribe en los segun
            // tipo de formulario
            var f = this._form = document.createElement('form');
            f.className = "geodir-form";
            f.addEventListener('submit', function() {
                event.preventDefault();
            }, false);

            var input = document.createElement('input');
            input.type = 'text';
            input.id = 'geodirDireccion';
            input.name = 'geodirDireccion';
            input.className = 'geodir-form-control';
            f.appendChild(input);
            this._form = f;
            this._container.appendChild(f);
        },
        // geodir initialization methods
        _initContainer: function(id) {
            var container = this._container = document.getElementById(id);
            if (!container) {
                throw new Error('Geodir container not found.');
            } else if (container._geodir) {
                throw new Error('Geodir container is already initialized.');
            }
            container._geodir = true;
        },
        _initLayout: function() {
            var container = this._container;
            container.className = "geodir-contenedor";
        },
        _georeferenciar: function() {
            // georeferenciacion
            var funvionmostrar = this._showMarkerOnMap;
            var geodir = this;
            var opcionesmostrar = this.options;
            opcionesmostrar.showmap ? funvionmostrar(
                this.options.mapOptions.viewX,
                this.options.mapOptions.viewY, geodir) : '';
        },
        _showMarkerOnMap: function(lng, lat, geodir) {
            function pintarMarker(coorx, coory, geodirres, centrarMapa) {
                geodirres._markers.clearLayers();
                var mark = L.marker([coory, coorx]).addTo(
                    geodirres._markers);
                // geodirres._markers.addLayer(mark);
                centrarMapa(geodirres._markers.getBounds());
            }
            pintarMarker(lng, lat, geodir, function(bounds) {
                geodir._map.fitBounds(bounds);
            });
        },
        _onKeyPress: function(ev) {
            if (ev.keyCode == 13) {
                this._georeferenciar();
                return false;
            }
        }
    });

G.geodir = function(id, options) {
    return new G.Geodir(id, options);
};

G.Geodir.Simple = G.Geodir.extend({
    _createForm: function() {
        var f = this._form = document.createElement('form');
        f.className = "geodir-form";
        f.addEventListener('submit', function() {
            event.preventDefault();
        }, false);
        var conainerForm = document.createElement('div');
        conainerForm.className = 'geodir-form-container';

        var row = document.createElement('div');
        row.className = 'geodir-form-group';

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'geodirDireccion';
        input.name = 'geodirDireccion';
        input.className = 'geodir-form-control';
        input.style.width = '100%';
        input.placeholder = 'Direccion';
        input.autocomplete = 'off'

        var col = document.createElement('div');
        col.className = "geodir-col-md-12";
        G.DomEvent.on(input, 'keydown', this._onKeyPress, this);
        col.appendChild(input);
        var oTextbox = new AutoSuggestControl(input, col, new StateSuggestions());
        row.appendChild(col);
        conainerForm.appendChild(row);

        row = document.createElement('div');
        row.className = 'geodir-form-group';
        // coordenada X
        col = document.createElement('div');
        col.className = "geodir-col-md-6";
        input = document.createElement('input');
        input.type = 'text';
        input.id = 'geodir_coordenadax';
        input.name = 'geodir_coordenadax';
        input.readOnly = true;
        input.className = 'geodir-form-control';
        col.appendChild(input);
        row.appendChild(col);

        // coordenada y
        col = document.createElement('div');
        col.className = "geodir-col-md-6";
        input = document.createElement('input');
        input.type = 'text';
        input.id = 'geodir_coordenaday';
        input.name = 'geodir_coordenaday';
        input.readOnly = true;
        input.className = 'geodir-form-control';
        col.appendChild(input);
        row.appendChild(col);

        this.options.showcoordenadas ? conainerForm.appendChild(row) : '';
        row = document.createElement('div');
        row.className = 'geodir-form-group  geodir-form-control-btn';
        // button
        col = document.createElement('div');
        col.className = "geodir-col-md-12";
        var btninput = document.createElement('input');
        btninput.type = 'button';
        btninput.id = 'geodir_btngeoreferenciar';
        btninput.name = 'geodir_btngeoreferenciar';
        btninput.value = 'buscar';
        btninput.className = 'geodir-control-btn';
        G.DomEvent.on(btninput, 'click', this._georeferenciar, this);
        col.appendChild(btninput);
        row.appendChild(col);
        // insertar row to form
        conainerForm.appendChild(row);
        f.appendChild(conainerForm);
        this._form = f;
        this._container.appendChild(f);
    },
    _georeferenciar: function() {
        if (this._form.elements['geodirDireccion'].value == '') {
            return;
        };
        if (this._georef) {
            return;
        };
        this._georef = true;

        this._form.elements['geodirDireccion'].style.cursor = 'wait';
        this._form.elements['geodir_btngeoreferenciar'].style.cursor = 'wait';
        document.getElementsByTagName("body")[0].style.cursor = 'wait';
        var geodir = this;
        var coordenadaX, coordenadaY;
        var mostrarcoordenadas = this.options.showcoordenadas;
        if (mostrarcoordenadas) {
            coordenadaX = this._form.elements['geodir_coordenadax'];
            coordenadaY = this._form.elements['geodir_coordenaday'];
            coordenadaX.value = 'Georeferenciando..';
            coordenadaY.value = 'Georeferenciando..';
        };
        var opcionesmostrar = this.options;
        var funvionmostrar = this._showMarkerOnMap;
        jQuery
            .ajax({
                type: "GET",
                crossDomain: true,
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'jsonpCallback',
                contentType: "application/json; charset=utf-8",
                url: this.options.url_service + '/rest/georef/geodir?',
                data: {
                    'direccion': this._form.elements['geodirDireccion'].value
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    if (mostrarcoordenadas) {
                        while (coordenadaX.firstChild) {
                            coordenadaX
                                .removeChild(coordenadaX.firstChild);
                        }

                        coordenadaX.value = 'Error de conexion';
                        coordenadaY.value = 'Error de conexion';
                    };
                    geodir._form.elements['geodirDireccion'].style.cursor = 'auto';
                    geodir._georef = false;
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                    this._form.elements['geodir_btngeoreferenciar'].style.cursor = 'auto';
                },
                success: function(resp) {
                    if (mostrarcoordenadas) {
                        while (coordenadaX.firstChild) {
                            coordenadaX
                                .removeChild(coordenadaX.firstChild);
                        }
                        coordenadaX.value = resp.x;
                        coordenadaY.value = resp.y;
                    };
                    geodir._form.elements['geodirDireccion'].style.cursor = 'auto';
                    opcionesmostrar.showmap ? funvionmostrar(
                        resp.x, resp.y, geodir) : '';
                    geodir._georef = false;
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                    geodir._form.elements['geodir_btngeoreferenciar'].style.cursor = 'auto';

                }
            });
    },
    _showMarkerOnMap: function(lng, lat, geodir) {
        function pintarMarker(coorx, coory, geodirres, centrarMapa) {
            geodirres._markers.clearLayers();
            var mark = L.marker([coory, coorx]).bindPopup(
                    geodirres._form.elements['geodirDireccion'].value)
                .addTo(geodirres._markers).openPopup();
            // geodirres._markers.addLayer(mark);
            centrarMapa(geodirres._markers.getBounds());
        }
        pintarMarker(lng, lat, geodir, function(bounds) {
            geodir._map.fitBounds(bounds);
        });
    },
});

G.simple = function(id, options) {
    return wmsLegendControl = new G.Geodir.Simple(id, options);
};

//G.Geodir.Processor se le pasa el ID de un boton y que direccion procesara.
G.Geodir.Processor = G.Geodir.extend({
    initialize: function(id, options) {
        this._initContainer(id);
        for (var i in options) {
            this.options[i] = options[i];
        }
        this.options.showmap = false;
    },
    _createForm: function() {
        this.options.showmap = false;
    },
    _georeferenciar: function(dir) {

        if (dir == '') {
            return;
        }
        if (this._georef) {
            return;
        }
        this._georef = true;
        document.getElementsByTagName("body")[0].style.cursor = 'wait';
        var geodir = this;
        var respuesta;
        var funvionmostrar = this._showMarkerOnMap;
        jQuery
            .ajax({
                type: "GET",
                crossDomain: true,
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'jsonpCallback',
                contentType: "application/json; charset=utf-8",
                url: this.options.url_service + '/rest/georef/geodir?',
                data: {
                    'direccion': dir
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    respuesta = 'Error de conexion';
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                },
                success: function(resp) {
                    respuesta = resp;
                    funvionmostrar(
                        resp, geodir)
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                }
            });
    },
    _showMarkerOnMap: function(resp, geodir) {
        geodir._container.innerHTML = ' ' + resp.x + ', ' + resp.y + ' ';
    },
});

G.processor = function(id, options) {
    return wmsLegendControl = new G.Geodir.Processor(id, options);
};
var departamento = ['AMAZONAS', 'ANCASH', 'APURIMAC', 'AREQUIPA', 'AYACUCHO', 'CAJAMARCA', 'CALLAO', 'CUSCO', 'HUANCAVELICA', 'HUANUCO', 'ICA', 'JUNIN', 'LA LIBERTAD', 'LAMBAYEQUE', 'LIMA', 'LORETO', 'MADRE DE DIOS', 'MOQUEGUA', 'PASCO', 'PIURA', 'PUNO', 'SAN MARTIN', 'TACNA', 'TUMBES', 'UCAYALI'];
//G.Geodir.Asistido
G.Geodir.Asistido = G.Geodir.extend({
    _createForm: function() {
        var f = this._form = document.createElement('form');
        f.className = "geodir-form";
        f.addEventListener('submit', function() {
            event.preventDefault();
        }, false);
        var conainerForm = document.createElement('div');
        conainerForm.className = 'geodir-form-container';

        var form_container, form_group, form_input;
        //Departamento


        form_container = G.DomUtil.create('div', 'geodir-form-group', conainerForm);
        form_group = G.DomUtil.create('div', 'geodir-col-md-12', form_container);
        form_input = G.DomUtil.create('select', 'geodir-form-control', form_group);
        form_input.id = 'geodirDepartamento';
        form_input.name = 'geodirDepartamento';
        form_input.placeholder = 'Departamento';
        for (var i = 0; i < departamento.length; i++) {
            var opt = departamento[i];
            var el = G.DomUtil.create('option', '', form_input);
            el.textContent = opt;
            el.value = opt;

        };
        G.DomEvent.on(form_input, 'change', this._updateProvincias, this._form);
        //Provincia
        form_container = G.DomUtil.create('div', 'geodir-form-group', conainerForm);
        form_group = G.DomUtil.create('div', 'geodir-col-md-12', form_container);
        form_input = G.DomUtil.create('select', 'geodir-form-control', form_group);
        //form_input.type = 'text';
        form_input.id = 'geodirProvincia';
        form_input.name = 'geodirProvincia';
        form_input.placeholder = 'Provincia';

        //Distrito
        form_container = G.DomUtil.create('div', 'geodir-form-group', conainerForm);
        form_group = G.DomUtil.create('div', 'geodir-col-md-12', form_container);
        form_input = G.DomUtil.create('input', 'geodir-form-control', form_group);
        form_input.type = 'text';
        form_input.id = 'geodirDistrito';
        form_input.name = 'geodirDistrito';
        form_input.placeholder = 'Distrito';

        //Direccion
        form_container = G.DomUtil.create('div', 'geodir-form-group', conainerForm);
        form_group = G.DomUtil.create('div', 'geodir-col-md-12', form_container);
        form_input = G.DomUtil.create('input', 'geodir-form-control', form_group);
        form_input.type = 'text';
        form_input.id = 'geodirDireccion';
        form_input.name = 'geodirDireccion';
        form_input.placeholder = 'Direccion';

        //Button
        form_container = G.DomUtil.create('div', 'geodir-form-group geodir-form-control-btn', conainerForm);
        form_group = G.DomUtil.create('div', 'geodir-col-md-12', form_container);
        form_input = G.DomUtil.create('input', 'geodir-control-btn', form_group);
        G.DomEvent.on(form_input, 'click', this._georeferenciar, this);
        form_input.type = 'button';
        form_input.id = 'geodir_btngeoreferenciar';
        form_input.name = 'geodir_btngeoreferenciar';
        form_input.value = 'buscar';
        form_input.className = 'geodir-control-btn';
        form_input.placeholder = 'Direccion';


        f.appendChild(conainerForm);
        this._form = f;
        this._container.appendChild(f);
    },
    _updateProvincias: function() {
        var form = this;
        var provincias = form.elements['geodirProvincia'];

        for (var i in provincias.options) {
            provincias.options[i] = null;
        }

        for (var i = 0; i < departamento.length; i++) {
            var opt = departamento[i];
            var el = G.DomUtil.create('option', '', provincias);
            el.textContent = opt;
            el.value = opt;

        };
    },
    _georeferenciar: function() {
        if (this._form.elements['geodirDireccion'].value == '') {
            return;
        };
        if (this._georef) {
            return;
        };
        this._georef = true;

        this._form.elements['geodirDireccion'].style.cursor = 'wait';
        this._form.elements['geodir_btngeoreferenciar'].style.cursor = 'wait';
        document.getElementsByTagName("body")[0].style.cursor = 'wait';
        var geodir = this;
        var coordenadaX, coordenadaY;
        var mostrarcoordenadas = this.options.showcoordenadas;
        if (mostrarcoordenadas) {
            coordenadaX = this._form.elements['geodir_coordenadax'];
            coordenadaY = this._form.elements['geodir_coordenaday'];
            coordenadaX.value = 'Georeferenciando..';
            coordenadaY.value = 'Georeferenciando..';
        };
        var opcionesmostrar = this.options;
        var funvionmostrar = this._showMarkerOnMap;
        jQuery
            .ajax({
                type: "GET",
                crossDomain: true,
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'jsonpCallback',
                contentType: "application/json; charset=utf-8",
                url: this.options.url_service + '/rest/georef/geodir?',
                data: {
                    'direccion': this._form.elements['geodirDireccion'].value
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    if (mostrarcoordenadas) {
                        while (coordenadaX.firstChild) {
                            coordenadaX
                                .removeChild(coordenadaX.firstChild);
                        }

                        coordenadaX.value = 'Error de conexion';
                        coordenadaY.value = 'Error de conexion';
                    };
                    geodir._form.elements['geodirDireccion'].style.cursor = 'auto';
                    geodir._georef = false;
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                    this._form.elements['geodir_btngeoreferenciar'].style.cursor = 'auto';
                },
                success: function(resp) {
                    if (mostrarcoordenadas) {
                        while (coordenadaX.firstChild) {
                            coordenadaX
                                .removeChild(coordenadaX.firstChild);
                        }
                        coordenadaX.value = resp.x;
                        coordenadaY.value = resp.y;
                    };
                    geodir._form.elements['geodirDireccion'].style.cursor = 'auto';
                    opcionesmostrar.showmap ? funvionmostrar(
                        resp.x, resp.y, geodir) : '';
                    geodir._georef = false;
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                    geodir._form.elements['geodir_btngeoreferenciar'].style.cursor = 'auto';

                }
            });
    },
    _showMarkerOnMap: function(lng, lat, geodir) {
        function pintarMarker(coorx, coory, geodirres, centrarMapa) {
            geodirres._markers.clearLayers();
            var mark = L.marker([coory, coorx]).bindPopup(
                    geodirres._form.elements['geodirDireccion'].value)
                .addTo(geodirres._markers).openPopup();
            // geodirres._markers.addLayer(mark);
            centrarMapa(geodirres._markers.getBounds());
        }
        pintarMarker(lng, lat, geodir, function(bounds) {
            geodir._map.fitBounds(bounds);
        });
    },
});

G.asistido = function(id, options) {
    return wmsLegendControl = new G.Geodir.Asistido(id, options);
};

G.Geodir.GeodirGoogle = G.Geodir.extend({
    _createMap: function() {
        var f = this._form;
        var row = document.createElement('div');
        row.className = 'geodir-map-container-g';
        for (var i in this.options.mapOptions.style) {
            row.style[i] = this.options.mapOptions.style[i];
        }
        var idMap = 'mapGeodir_' + Math.floor(Math.random() * (100));
        row.id = idMap;
        f.appendChild(row); 
        try {
            this._map = L.map(idMap).setView(
                [this.options.mapOptions.viewY,
                    this.options.mapOptions.viewX
                ], 8);
            L.tileLayer(this.options.mapOptions.tiled, {
                maxZoom: 18,
                attribution: this.options.mapOptions.attribution,
                id: this.options.mapOptions.id
            }).addTo(this._map);
            this._markers = L.featureGroup().addTo(this._map);
        } catch (e) {
            this.options.showmap = false;
        }

    },
    _createForm: function() {

        var f = this._form = document.createElement('form');
        f.className = "geodir-form-google";
        f.addEventListener('submit', function() {
            event.preventDefault();
        }, false);
        var conainerForm = document.createElement('div');
        conainerForm.className = 'geodir-form-container-dir';



        var row = document.createElement('div');
        row.className = 'geodir-form-group-google';

        var input = document.createElement('input');
        input.type = 'text';
        input.id = 'geodirDireccion';
        input.name = 'geodirDireccion';
        input.className = 'geodir-form-control-google';
        input.autocomplete = 'off'
        var col = document.createElement('div');
        col.className = "geodir-col-md-11";
        G.DomEvent.on(input, 'keydown', this._onKeyPress, this);
        col.appendChild(input);
        input.style.width = '100%';
        var oTextbox = new AutoSuggestControl(input, col, new StateSuggestions());
        row.appendChild(col);
        conainerForm.appendChild(row);

        this.options.showcoordenadas ? conainerForm.appendChild(row) : '';

        // button
        col = document.createElement('div');
        col.className = "geodir-col-md-1";
        var btninput = document.createElement('input');
        btninput.type = 'button';
        btninput.id = 'geodir_btngeoreferenciar';
        btninput.name = 'geodir_btngeoreferenciar';
        /*btninput.value = 'buscar';*/
        btninput.className = 'geodir-control-btn-google';
        G.DomEvent.on(btninput, 'click', this._georeferenciar, this);
        col.appendChild(btninput);
        row.appendChild(col);
        // insertar row to form
        conainerForm.appendChild(row);
        f.appendChild(conainerForm);
        this._form = f;
        this._container.appendChild(f);
    },

    _georeferenciar: function() {
        if (this._form.elements['geodirDireccion'].value == '') {
            return;
        };
        if (this._georef) {
            return;
        };
        this._georef = true;

        this._form.elements['geodirDireccion'].style.cursor = 'wait';
        this._form.elements['geodir_btngeoreferenciar'].style.cursor = 'wait';
        document.getElementsByTagName("body")[0].style.cursor = 'wait';
        var geodir = this;

        var opcionesmostrar = this.options;
        var funvionmostrar = this._showMarkerOnMap;
        jQuery
            .ajax({
                type: "GET",
                crossDomain: true,
                dataType: 'jsonp',
                jsonp: 'callback',
                jsonpCallback: 'jsonpCallback',
                contentType: "application/json; charset=utf-8",
                url: this.options.url_service + '/rest/georef/geodir?',
                data: {
                    'direccion': this._form.elements['geodirDireccion'].value
                },
                error: function(jqXHR, textStatus, errorThrown) {

                    geodir._form.elements['geodirDireccion'].style.cursor = 'auto';
                    geodir._georef = false;
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                    this._form.elements['geodir_btngeoreferenciar'].style.cursor = 'auto';
                },
                success: function(resp) {

                    geodir._form.elements['geodirDireccion'].style.cursor = 'auto';
                    opcionesmostrar.showmap ? funvionmostrar(
                        resp.x, resp.y, geodir) : '';
                    geodir._georef = false;
                    document.getElementsByTagName("body")[0].style.cursor = 'auto';
                    geodir._form.elements['geodir_btngeoreferenciar'].style.cursor = 'auto';

                }
            });
    },


    _showMarkerOnMap: function(lng, lat, geodir) {
        function pintarMarker(coorx, coory, geodirres, centrarMapa) {
            geodirres._markers.clearLayers();
            var mark = L.marker([coory, coorx]).bindPopup(
                    geodirres._form.elements['geodirDireccion'].value)
                .addTo(geodirres._markers).openPopup();
            // geodirres._markers.addLayer(mark);
            centrarMapa(geodirres._markers.getBounds());
        }
        pintarMarker(lng, lat, geodir, function(bounds) {
            geodir._map.fitBounds(bounds);
        });
    },
});


G.geodirGoogle = function(id, options) {
    return wmsLegendControl = new G.Geodir.GeodirGoogle(id, options);
};