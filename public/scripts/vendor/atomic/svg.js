import * as _ from 'atomic/core';
import * as dom from 'atomic/dom';
import { document } from 'dom';

var taglist = ["svg", "g", "symbol", "defs", "clipPath", "metadata", "path", "line", "circle", "rect", "ellipse", "polygon", "polyline", "image", "text", "tspan"];

function tags2(document, list) {
  var ns = dom.elementns(document, "http://www.w3.org/2000/svg");
  var tags = dom.tags(ns, list);

  function use(link) {
    for (var _len = arguments.length, contents = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      contents[_key - 1] = arguments[_key];
    }

    var el = ns("use", contents);
    el.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', link);
    return el;
  }

  tags["use"] = use;
  return tags;
}

function tags1(document) {
  return tags2(document, taglist);
}

var tags = _.overload(null, tags1, tags2);

var _tags = tags(document),
    svg = _tags.svg,
    g = _tags.g,
    symbol = _tags.symbol,
    defs = _tags.defs,
    clipPath = _tags.clipPath,
    metadata = _tags.metadata,
    path = _tags.path,
    line = _tags.line,
    circle = _tags.circle,
    rect = _tags.rect,
    ellipse = _tags.ellipse,
    polygon = _tags.polygon,
    polyline = _tags.polyline,
    image = _tags.image,
    text = _tags.text,
    tspan = _tags.tspan,
    use = _tags.use;

export { circle, clipPath, defs, ellipse, g, image, line, metadata, path, polygon, polyline, rect, svg, symbol, taglist, tags, text, tspan, use };
