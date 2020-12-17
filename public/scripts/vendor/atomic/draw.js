define(['exports', 'atomic/core', 'atomic/dom'], function (exports, _$1, dom) { 'use strict';

  var ns = _$1.partial(dom.elementns, "http://www.w3.org/2000/svg");
  var svg = _$1.partial(ns, "svg");
  var g = _$1.partial(ns, "g");
  var symbol = _$1.partial(ns, "symbol");
  function use(link) {
    var el = ns("use");
    el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', link);

    for (var _len = arguments.length, contents = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      contents[_key - 1] = arguments[_key];
    }

    dom.embeds.apply(void 0, [el].concat(contents));
    return el;
  }
  var defs = _$1.partial(ns, "defs");
  var clipPath = _$1.partial(ns, "clipPath");
  var metadata = _$1.partial(ns, "metadata");
  var path = _$1.partial(ns, "path");
  var line = _$1.partial(ns, "line");
  var circle = _$1.partial(ns, "circle");
  var rect = _$1.partial(ns, "rect");
  var ellipse = _$1.partial(ns, "ellipse");
  var polygon = _$1.partial(ns, "polygon");
  var polyline = _$1.partial(ns, "polyline");
  var image = _$1.partial(ns, "image");
  var text = _$1.partial(ns, "text");
  var tspan = _$1.partial(ns, "tspan");

  exports.ns = ns;
  exports.svg = svg;
  exports.g = g;
  exports.symbol = symbol;
  exports.use = use;
  exports.defs = defs;
  exports.clipPath = clipPath;
  exports.metadata = metadata;
  exports.path = path;
  exports.line = line;
  exports.circle = circle;
  exports.rect = rect;
  exports.ellipse = ellipse;
  exports.polygon = polygon;
  exports.polyline = polyline;
  exports.image = image;
  exports.text = text;
  exports.tspan = tspan;

  Object.defineProperty(exports, '__esModule', { value: true });

});
