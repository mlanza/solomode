define(['exports', 'atomic/core', 'atomic/transients', 'atomic/reactives', 'promise'], function (exports, _$1, mut, $, Promise$1) { 'use strict';

  var Promise$1__default = 'default' in Promise$1 ? Promise$1['default'] : Promise$1;

  var IEmbeddable = _$1.protocol({
    embed: null
  });
  function embeds(self) {
    for (var _len = arguments.length, contents = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      contents[_key - 1] = arguments[_key];
    }

    _$1.each(function (_arg) {
      return IEmbeddable.embed(_arg, self);
    }, contents);
  }

  function embed(self, parent, referenceNode) {
    if (_$1.satisfies(IEmbeddable, self)) {
      IEmbeddable.embed(self, parent, referenceNode);
    } else if (_$1.satisfies(_$1.ISequential, self)) {
      _$1.each(function (_arg) {
        return embed(_arg, parent, referenceNode);
      }, self);
    } else if (_$1.satisfies(_$1.IDescriptive, self)) {
      _$1.each(function (entry) {
        mut.assoc(parent, _$1.key(entry), _$1.val(entry));
      }, self);
    } else {
      IEmbeddable.embed(_$1.str(self), parent, referenceNode);
    }
  }

  var Element = _$1.global.Element;
  function element(name) {
    var el = document.createElement(name);

    for (var _len = arguments.length, contents = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      contents[_key - 1] = arguments[_key];
    }

    embeds.apply(void 0, [el].concat(contents));
    return el;
  }
  function elementns(ns, name) {
    var el = document.createElementNS(ns, name);

    for (var _len2 = arguments.length, contents = new Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
      contents[_key2 - 2] = arguments[_key2];
    }

    embeds.apply(void 0, [el].concat(contents));
    return el;
  }
  function isElement(self) {
    return self instanceof Element;
  }

  var IMountable = _$1.protocol({});

  var isMountable = function isMountable(_arg) {
    return _$1.satisfies(IMountable, _arg);
  };
  function mounts(self) {
    _$1.specify(IMountable, {}, self);

    var parent = _$1.parent(self);

    if (parent) {
      _$1.each(function (key) {
        $.trigger(self, key, {
          bubbles: true,
          detail: {
            parent: parent
          }
        });
      }, ["mounting", "mounted"]); //ensure hooks trigger even if already mounted
    }

    return self;
  }

  function InvalidHostElementError(el, selector) {
    this.el = el;
    this.selector = selector;
  }

  function toString() {
    return "Element \"".concat(this.el.tagName, "\" failed to match \"").concat(this.selector, "\".");
  }

  InvalidHostElementError.prototype = Object.assign(new Error(), {
    toString: toString
  });

  var IValue = _$1.protocol({
    value: null
  });

  function Attrs(node) {
    this.node = node;
  }
  function attrs(node) {
    return new Attrs(node);
  }

  function toArray(self) {
    return _$1.ICoerceable.toArray(next2(self, 0));
  }

  function count(self) {
    return self.node.attributes.length;
  }

  function lookup(self, key) {
    return self.node.getAttribute(key);
  }

  function assoc(self, key, value) {
    self.node.setAttribute(key, value);
  }

  function dissoc(self, key) {
    self.node.removeAttribute(key);
  }

  function seq(self) {
    return count(self) ? self : null;
  }

  function first(self) {
    return count(self) ? [self.node.attributes[0].name, self.node.attributes[0].value] : null;
  }

  function rest(self) {
    return next(self) || _$1.emptyList();
  }

  function next2(self, idx) {
    return idx < count(self) ? _$1.lazySeq(function () {
      return _$1.cons([self.node.attributes[idx].name, self.node.attributes[idx].value], next2(self, idx + 1));
    }) : null;
  }

  function next(self) {
    return next2(self, 1);
  }

  function keys$1(self) {
    return _$1.map(_$1.first, next2(self, 0));
  }

  function vals(self) {
    return _$1.map(_$1.second, next2(self, 0));
  }

  function contains(self, key) {
    return self.node.hasAttribute(key);
  }

  function includes(self, pair) {
    return lookup(self, _$1.key(pair)) == _$1.val(pair);
  }

  function empty(self) {
    while (self.node.attributes.length > 0) {
      self.node.removeAttribute(self.node.attributes[0].name);
    }
  }

  var behaveAsAttrs = _$1.does(_$1.implement(mut.ITransientEmptyableCollection, {
    empty: empty
  }), _$1.implement(_$1.ICoerceable, {
    toArray: toArray
  }), _$1.implement(_$1.ICounted, {
    count: count
  }), _$1.implement(_$1.ISeqable, {
    seq: seq
  }), _$1.implement(_$1.INext, {
    next: next
  }), _$1.implement(_$1.ISeq, {
    first: first,
    rest: rest
  }), _$1.implement(_$1.IMap, {
    keys: keys$1,
    vals: vals
  }), _$1.implement(mut.ITransientMap, {
    dissoc: dissoc
  }), _$1.implement(_$1.IInclusive, {
    includes: includes
  }), _$1.implement(_$1.IAssociative, {
    contains: contains
  }), _$1.implement(mut.ITransientAssociative, {
    assoc: assoc
  }), _$1.implement(_$1.ILookup, {
    lookup: lookup
  }));

  behaveAsAttrs(Attrs);

  var Comment = _$1.global.Comment;

  var IContent = _$1.protocol({
    contents: null
  });

  var IHideable = _$1.protocol({
    hide: null,
    show: null,
    toggle: null
  });

  var IHtml = _$1.protocol({
    html: null
  });

  var IText = _$1.protocol({
    text: null
  });

  function embed$1(self, parent) {
    parent.appendChild(self);
  }

  var behaveAsComment = _$1.does(_$1.implement(IEmbeddable, {
    embed: embed$1
  }));

  behaveAsComment(Comment);

  function send2(self, message) {
    send3(self, message, "log");
  }

  function send3(self, message, address) {
    self[address](message);
  }

  var send = _$1.overload(null, null, send2, send3);
  var behaveAsConsole = _$1.does(_$1.specify(_$1.ISend, {
    send: send
  }));

  behaveAsConsole(console);

  var DocumentFragment = _$1.global.DocumentFragment;
  function fragment() {
    var frag = document.createDocumentFragment();

    for (var _len = arguments.length, contents = new Array(_len), _key = 0; _key < _len; _key++) {
      contents[_key] = arguments[_key];
    }

    _$1.each(function (_arg) {
      return embed(_arg, frag);
    }, contents);
    return frag;
  }
  DocumentFragment.create = fragment;
  function isDocumentFragment(self) {
    return self && self instanceof DocumentFragment;
  }

  function NestedAttrs(element, key) {
    this.element = element;
    this.key = key;
  }

  function nestedAttrs2(element, key) {
    return new NestedAttrs(element, key);
  }

  function nestedAttrs1(key) {
    return function (element) {
      return nestedAttrs2(element, key);
    };
  }

  var nestedAttrs = _$1.overload(null, nestedAttrs1, nestedAttrs2);
  var style = nestedAttrs1("style");

  var hides = ["display", "none"];
  var hidden = _$1.comp(function (_arg) {
    return _$1.IInclusive.includes(_arg, hides);
  }, function (_arg2) {
    return nestedAttrs(_arg2, "style");
  });
  var toggle = _$1.partial(_$1.toggles, show, hide, hidden);

  function hide(self) {
    mut.ITransientCollection.conj(nestedAttrs(self, "style"), hides);
  }

  function show(self) {
    mut.ITransientYankable.yank(nestedAttrs(self, "style"), hides);
  }

  function embed$2(self, parent, referenceNode) {
    if (isMountable(self)) {
      var detail = {
        parent: parent
      };
      $.IEvented.trigger(self, "mounting", {
        bubbles: true,
        detail: detail
      });

      if (referenceNode) {
        parent.insertBefore(self, referenceNode);
      } else {
        parent.appendChild(self);
      }

      $.IEvented.trigger(self, "mounted", {
        bubbles: true,
        detail: detail
      });
    } else {
      if (referenceNode) {
        parent.insertBefore(self, referenceNode);
      } else {
        parent.appendChild(self);
      }
    }

    return self;
  }

  function append(self, content) {
    IEmbeddable.embed(content, self);
  }

  function prepend(self, content) {
    IEmbeddable.embed(content, self, self.childNodes[0]);
  }

  function before(self, content) {
    IEmbeddable.embed(content, _$1.IHierarchy.parent(self), self);
  }

  function after(self, content) {
    IEmbeddable.embed(content, _$1.IHierarchy.parent(self), _$1.IHierarchy.nextSibling(self));
  }

  var conj = append;

  function matches(self, selector) {
    return _$1.isString(selector) && self.matches(selector) || _$1.isFunction(selector) && selector(self);
  }

  function isAttrs(self) {
    return !(self instanceof Node) && _$1.satisfies(_$1.IDescriptive, self);
  }

  function eventContext(catalog) {
    function on3(self, key, callback) {
      _$1.isString(key) ? _$1.each(function (key) {
        self.addEventListener(key, callback);
      }, _$1.compact(key.split(" "))) : self.addEventListener(key, callback);
      return self;
    }

    function on4(self, key, selector, callback) {
      on3(self, key, _$1.doto(function (e) {
        if (_$1.IMatchable.matches(e.target, selector)) {
          callback.call(e.target, e);
        } else {
          var found = closest(e.target, selector);

          if (found && self.contains(found)) {
            callback.call(found, e);
          }
        }
      }, function (_arg3) {
        return _$1.assoc(catalog, callback, _arg3);
      }));
      return self;
    }

    var on = _$1.overload(null, null, null, on3, on4);

    function off(self, key, callback) {
      self.removeEventListener(key, _$1.get(catalog, callback, callback));
      return self;
    }

    return {
      on: on,
      off: off
    };
  }

  var _eventContext = eventContext(_$1.weakMap()),
      on = _eventContext.on,
      off = _eventContext.off;

  var eventConstructors = {
    "click": MouseEvent,
    "mousedown": MouseEvent,
    "mouseup": MouseEvent,
    "mouseover": MouseEvent,
    "mousemove": MouseEvent,
    "mouseout": MouseEvent,
    "focus": FocusEvent,
    "blur": FocusEvent
  };
  var eventDefaults = {
    bubbles: true
  };

  function trigger(self, key, options) {
    options = Object.assign({}, eventDefaults, options || {});
    var Event = eventConstructors[key] || CustomEvent;
    var event = null;

    try {
      event = new Event(key, options);
    } catch (ex) {
      event = document.createEvent('HTMLEvents');
      event.initEvent(key, options.bubbles || false, options.cancelable || false);
      event.detail = options.detail;
    }

    self.dispatchEvent(event);
    return self;
  }

  function contents(self) {
    return self.contentDocument || _$1.ISeqable.seq(self.childNodes);
  }

  function assoc$1(self, key, value) {
    self.setAttribute(key, _$1.str(value));
  }

  function dissoc$1(self, key) {
    self.removeAttribute(key);
  }

  function keys2(self, idx) {
    return idx < self.attributes.length ? _$1.lazySeq(function () {
      return _$1.cons(self.attributes[idx].name, keys2(self, idx + 1));
    }) : _$1.emptyList();
  }

  function keys$2(self) {
    return keys2(self, 0);
  }

  function vals2(self, idx) {
    return idx < self.attributes.length ? _$1.lazySeq(function () {
      return _$1.cons(self.attributes[idx].value, keys2(self, idx + 1));
    }) : _$1.emptyList();
  }

  function vals$1(self) {
    return vals2(self, 0);
  }

  function lookup$1(self, key) {
    return self.getAttribute(key);
  }

  function contains$1(self, key) {
    return self.hasAttribute(key);
  }

  function parent(self) {
    return self && self.parentNode;
  }

  var parents = _$1.upward(function (self) {
    return self && self.parentElement;
  });
  var root = _$1.comp(_$1.last, _$1.upward(parent));
  function closest(self, selector) {
    var target = self;

    while (target) {
      if (_$1.IMatchable.matches(target, selector)) {
        return target;
      }

      target = _$1.IHierarchy.parent(target);
    }
  }

  function query(self, selector) {
    return self.querySelectorAll && _$1.isString(selector) ? self.querySelectorAll(selector) : _$1.filter(function (_arg4) {
      return _$1.IMatchable.matches(_arg4, selector);
    }, _$1.IHierarchy.descendants(self));
  }

  function locate(self, selector) {
    return _$1.isFunction(selector) ? _$1.ISeq.first(_$1.IQueryable.query(self, selector)) : self.querySelector(selector);
  }

  function children(self) {
    return _$1.ISeqable.seq(self.children || _$1.filter(isElement, self.childNodes)); //IE has no children on document fragment
  }

  var descendants = _$1.downward(_$1.IHierarchy.children);

  function nextSibling(self) {
    return self.nextElementSibling;
  }

  var nextSiblings = _$1.upward(_$1.IHierarchy.nextSibling);

  function prevSibling(self) {
    return self.previousElementSibling;
  }

  var prevSiblings = _$1.upward(_$1.IHierarchy.prevSibling);
  function siblings(self) {
    return _$1.concat(prevSiblings(self), nextSiblings(self));
  }

  function yank1(self) {
    //no jokes, please!
    yank2(parent(self), self);
  }

  function yank2(self, node) {
    if (isElement(node)) {
      self.removeChild(node);
    } else if (_$1.satisfies(_$1.ISequential, node)) {
      var _keys = node;
      _$1.each(self.removeAttribute.bind(self), _keys);
    } else if (isAttrs(node)) {
      var attrs = node;
      _$1.each(function (entry) {
        var key = entry[0],
            value = entry[1];
        var curr = lookup$1(self, key);

        if (_$1.isObject(curr)) {
          curr = mapa(function (pair) {
            return pair.join(": ") + "; ";
          }, _$1.ICoerceable.toArray(curr)).join("").trim();
        }

        curr == value && dissoc$1(self, key);
      }, attrs);
    } else if (_$1.isString(node)) {
      node = includes$1(self, node);
      self.removeChild(node);
    }
  }

  var yank = _$1.overload(null, yank1, yank2);

  function includes$1(self, target) {
    if (isElement(target)) {
      return _$1.ILocate.locate(children(self), function (_arg5) {
        return _$1.isIdentical(target, _arg5);
      });
    } else if (_$1.satisfies(_$1.ISequential, target)) {
      var _keys2 = target;
      return _$1.IReduce.reduce(_keys2, function (memo, key) {
        return memo ? self.hasAttribute(key) : reduced(memo);
      }, true);
    } else if (isAttrs(target)) {
      return IKVReduce.reducekv(target, function (memo, key, value) {
        return memo ? lookup$1(self, key) == value : reduced(memo);
      }, true);
    } else {
      return _$1.ILocate.locate(contents(self), _$1.isString(target) ? function (node) {
        return node.nodeType === Node.TEXT_NODE && node.data === target;
      } : function (node) {
        return node === target;
      });
    }
  }

  function empty$1(self) {
    while (self.firstChild) {
      self.removeChild(self.firstChild);
    }
  }

  function clone(self) {
    return self.cloneNode(true);
  }

  function text1(self) {
    return self.textContent;
  }

  function text2(self, text) {
    self.textContent = text == null ? "" : text;
  }

  var text = _$1.overload(null, text1, text2);

  function html1(self) {
    return self.innerHTML;
  }

  function html2(self, html) {
    if (_$1.isString(html)) {
      self.innerHTML = html;
    } else {
      empty$1(self);

      embed(html, self);
    }

    return self;
  }

  var html = _$1.overload(null, html1, html2);

  function value1(self) {
    return "value" in self ? self.value : null;
  }

  function value2(self, value) {
    if ("value" in self) {
      value = value == null ? "" : value;

      if (self.value != value) {
        self.value = value;
      }
    } else {
      throw new TypeError("Type does not support value property.");
    }
  }

  var value = _$1.overload(null, value1, value2);

  function reduce(self, xf, init) {
    return _$1.IReduce.reduce(_$1.IHierarchy.descendants(self), xf, init);
  }

  var ihierarchy = _$1.implement(_$1.IHierarchy, {
    root: root,
    parent: parent,
    parents: parents,
    closest: closest,
    children: children,
    descendants: descendants,
    nextSibling: nextSibling,
    nextSiblings: nextSiblings,
    prevSibling: prevSibling,
    prevSiblings: prevSiblings,
    siblings: siblings
  });
  var icontents = _$1.implement(IContent, {
    contents: contents
  });
  var ievented = _$1.implement($.IEvented, {
    on: on,
    off: off,
    trigger: trigger
  });
  var ilocate = _$1.implement(_$1.ILocate, {
    locate: locate
  });
  var iquery = _$1.implement(_$1.IQueryable, {
    query: query
  });
  var behaveAsElement = _$1.does(ihierarchy, icontents, ievented, iquery, ilocate, _$1.implement(_$1.IReduce, {
    reduce: reduce
  }), _$1.implement(IText, {
    text: text
  }), _$1.implement(IHtml, {
    html: html
  }), _$1.implement(IValue, {
    value: value
  }), _$1.implement(IEmbeddable, {
    embed: embed$2
  }), _$1.implement(mut.ITransientEmptyableCollection, {
    empty: empty$1
  }), _$1.implement(mut.ITransientInsertable, {
    before: before,
    after: after
  }), _$1.implement(_$1.IInclusive, {
    includes: includes$1
  }), _$1.implement(IHideable, {
    show: show,
    hide: hide,
    toggle: toggle
  }), _$1.implement(mut.ITransientYankable, {
    yank: yank
  }), _$1.implement(_$1.IMatchable, {
    matches: matches
  }), _$1.implement(_$1.ICloneable, {
    clone: clone
  }), _$1.implement(mut.ITransientAppendable, {
    append: append
  }), _$1.implement(mut.ITransientPrependable, {
    prepend: prepend
  }), _$1.implement(mut.ITransientCollection, {
    conj: conj
  }), _$1.implement(_$1.ILookup, {
    lookup: lookup$1
  }), _$1.implement(_$1.IMap, {
    keys: keys$2,
    vals: vals$1
  }), _$1.implement(mut.ITransientMap, {
    dissoc: dissoc$1
  }), _$1.implement(_$1.IAssociative, {
    contains: contains$1
  }), _$1.implement(mut.ITransientAssociative, {
    assoc: assoc$1
  }));

  var behaveAsDocumentFragment = _$1.does(behaveAsElement, _$1.implement(_$1.IHierarchy, {
    nextSibling: _$1.constantly(null),
    nextSiblings: _$1.emptyList,
    prevSibling: _$1.constantly(null),
    prevSiblings: _$1.emptyList,
    siblings: _$1.emptyList,
    parent: _$1.constantly(null),
    parents: _$1.emptyList
  }), _$1.implement(_$1.INext, {
    next: _$1.constantly(null)
  }), _$1.implement(_$1.ISeq, {
    first: _$1.identity,
    rest: _$1.emptyList
  }), _$1.implement(_$1.ISeqable, {
    seq: _$1.cons
  }));

  behaveAsDocumentFragment(DocumentFragment);

  function replaceWith(self, other) {
    var parent = _$1.IHierarchy.parent(self),
        replacement = _$1.isString(other) ? document.createTextNode(other) : other;
    parent.replaceChild(replacement, self);
  }
  function wrap(self, other) {
    replaceWith(self, other);
    mut.append(other, self);
  }
  function isVisible(el) {
    return !!(el.offsetWidth || el.offsetHeight || el.getClientRects().length);
  }
  function enable(self, enabled) {
    self.disabled = !enabled;
    return self;
  }

  behaveAsElement(Window);
  behaveAsElement(Element);
  behaveAsElement(Text);

  var HTMLCollection = _$1.global.HTMLCollection;

  function seq2(self, idx) {
    return idx < self.length ? _$1.lazySeq(function () {
      return _$1.cons(self.item(idx), seq2(self, idx + 1));
    }) : null;
  }

  function seq$1(self) {
    return seq2(self, 0);
  }

  function lookup$2(self, idx) {
    return self[idx];
  }

  var first$1 = _$1.comp(_$1.ISeq.first, seq$1);
  var rest$1 = _$1.comp(_$1.ISeq.rest, seq$1);
  var next$1 = _$1.comp(_$1.INext.next, seq$1);
  var children$1 = _$1.comp(_$1.IHierarchy.children, seq$1);
  var descendants$1 = _$1.comp(_$1.IHierarchy.descendants, seq$1);
  var nextSibling$1 = _$1.comp(_$1.IHierarchy.nextSibling, seq$1);
  var nextSiblings$1 = _$1.comp(_$1.IHierarchy.nextSiblings, seq$1);
  var prevSibling$1 = _$1.comp(_$1.IHierarchy.prevSibling, seq$1);
  var prevSiblings$1 = _$1.comp(_$1.IHierarchy.prevSiblings, seq$1);
  var siblings$1 = _$1.comp(_$1.IHierarchy.siblings, seq$1);
  var parent$1 = _$1.comp(_$1.IHierarchy.parent, seq$1);
  var parents$1 = _$1.comp(_$1.IHierarchy.parents, seq$1);
  var contents$1 = _$1.comp(IContent.contents, seq$1);

  function query$1(self, selector) {
    return _$1.maybe(self, seq$1, function (_arg) {
      return _$1.IQueryable.query(_arg, selector);
    }) || [];
  }

  function locate$1(self, selector) {
    return _$1.maybe(self, seq$1, function (_arg2) {
      return _$1.ILocate.locate(_arg2, selector);
    });
  }

  function closest$1(self, selector) {
    return _$1.maybe(self, seq$1, function (_arg3) {
      return _$1.IHierarchy.closest(_arg3, selector);
    });
  }

  function reduce$1(self, f, init) {
    return _$1.IReduce.reduce(seq$1(self), f, init);
  }

  function count$1(self) {
    return self.length;
  }

  var behaveAsNodeList = _$1.does(_$1.iterable, _$1.implement(_$1.ILookup, {
    lookup: lookup$2
  }), _$1.implement(_$1.IIndexed, {
    nth: lookup$2
  }), _$1.implement(_$1.ICounted, {
    count: count$1
  }), _$1.implement(_$1.ISeq, {
    first: first$1,
    rest: rest$1
  }), _$1.implement(_$1.IReduce, {
    reduce: reduce$1
  }), _$1.implement(_$1.INext, {
    next: next$1
  }), _$1.implement(IContent, {
    contents: contents$1
  }), _$1.implement(_$1.ICoerceable, {
    toArray: Array.from
  }), _$1.implement(_$1.IQueryable, {
    query: query$1
  }), _$1.implement(_$1.ILocate, {
    locate: locate$1
  }), _$1.implement(_$1.IHierarchy, {
    parent: parent$1,
    parents: parents$1,
    closest: closest$1,
    nextSiblings: nextSiblings$1,
    nextSibling: nextSibling$1,
    prevSiblings: prevSiblings$1,
    prevSibling: prevSibling$1,
    siblings: siblings$1,
    children: children$1,
    descendants: descendants$1
  }), _$1.implement(_$1.ISequential), _$1.implement(_$1.ISeqable, {
    seq: seq$1
  }));

  behaveAsNodeList(HTMLCollection);

  var HTMLDocument = _$1.global.HTMLDocument || _$1.global.Document; //IE fallback

  function isHTMLDocument(self) {
    return self instanceof HTMLDocument;
  }

  var behaveAsHTMLDocument = _$1.does(behaveAsElement, _$1.implement(_$1.IMatchable, {
    matches: _$1.constantly(false)
  }), _$1.implement(_$1.IHierarchy, {
    closest: _$1.constantly(null),
    nextSibling: _$1.constantly(null),
    nextSiblings: _$1.emptyList,
    prevSibling: _$1.constantly(null),
    prevSiblings: _$1.emptyList,
    siblings: _$1.emptyList,
    parent: _$1.constantly(null),
    parents: _$1.emptyList
  }));

  behaveAsHTMLDocument(HTMLDocument);

  var HTMLSelectElement = _$1.global.HTMLSelectElement;

  function access(f, g) {
    function _value1(self) {
      return _$1.maybe(_$1.query(self, "option"), function (_arg) {
        return _$1.locate(_arg, function (option) {
          return option.selected;
        });
      }, f);
    }

    var value1 = g ? _$1.comp(g, _value1) : _value1;

    function value2(self, value) {
      _$1.each(function (option) {
        var selected = f(option) == value;

        if (option.selected != selected) {
          option.selected = selected;
        }
      }, _$1.query(self, "option"));
    }

    return _$1.overload(null, value1, value2);
  }

  var text$1 = access(IText.text, function (_arg2) {
    return _$1.either(_arg2, "");
  }),
      value$1 = access(IValue.value);
  var behaveAsHTMLSelectElement = _$1.does(_$1.implement(IValue, {
    value: value$1
  }), _$1.implement(IText, {
    text: text$1
  }));

  behaveAsHTMLSelectElement(HTMLSelectElement);

  var Location = _$1.global.Location;
  function isLocation(self) {
    return self instanceof Location;
  }

  function matches$1(self, pattern) {
    if (_$1.isRegExp(pattern)) {
      return _$1.test(pattern, decodeURI(self.pathname));
    } else if (_$1.isString(pattern)) {
      return matches$1(self, new RegExp(pattern, "i"));
    }
  }

  function on$1(self, pattern, callback) {
    var matched = matches$1(self, pattern);

    if (matched) {
      callback(matched);
    }
  }

  var behaveAsLocation = _$1.does(_$1.specify($.IEvented, {
    on: on$1
  }), _$1.specify(_$1.IMatchable, {
    matches: matches$1
  }));

  behaveAsLocation(location);

  function asText(obj) {
    return _$1.mapa(function (entry) {
      var key = entry[0],
          value = entry[1];
      return _$1.str(key, ": ", value, ";");
    }, _$1.ISeqable.seq(obj)).join(" ");
  }

  function deref(self) {
    var text = self.element.getAttribute(self.key);
    return text == null ? {} : _$1.IReduce.reduce(_$1.mapa(function (text) {
      return _$1.mapa(_$1.trim, _$1.split(text, ":"));
    }, _$1.compact(_$1.split(text, ";"))), function (memo, pair) {
      return _$1.ICollection.conj(memo, pair);
    }, {});
  }

  function lookup$3(self, key) {
    return _$1.ILookup.lookup(deref(self), key);
  }

  function contains$2(self, key) {
    return _$1.IAssociative.contains(deref(self), key);
  }

  function assoc$2(self, key, value) {
    self.element.setAttribute(self.key, asText(_$1.IAssociative.assoc(deref(self), key, value)));
  }

  function dissoc$2(self, key) {
    self.element.setAttribute(self.key, asText(_$1.IMap.dissoc(deref(self), key)));
  }

  function keys$3(self) {
    return _$1.IMap.keys(deref(self));
  }

  function vals$2(self) {
    return _$1.IMap.vals(deref(self));
  }

  function includes$2(self, pair) {
    return _$1.IInclusive.includes(deref(self), pair);
  }

  function yank$1(self, pair) {
    self.element.setAttribute(self.key, asText(_$1.IYankable.yank(deref(self), pair)));
  }

  function conj$1(self, pair) {
    self.element.setAttribute(self.key, asText(_$1.ICollection.conj(deref(self), pair)));
  }

  var behaveAsNestedAttrs = _$1.does(_$1.implement(_$1.IDescriptive), _$1.implement(_$1.IDeref, {
    deref: deref
  }), _$1.implement(_$1.IMap, {
    keys: keys$3,
    vals: vals$2
  }), _$1.implement(mut.ITransientMap, {
    dissoc: dissoc$2
  }), _$1.implement(_$1.IInclusive, {
    includes: includes$2
  }), _$1.implement(_$1.IAssociative, {
    contains: contains$2
  }), _$1.implement(mut.ITransientAssociative, {
    assoc: assoc$2
  }), _$1.implement(_$1.ILookup, {
    lookup: lookup$3
  }), _$1.implement(mut.ITransientYankable, {
    yank: yank$1
  }), _$1.implement(mut.ITransientCollection, {
    conj: conj$1
  }), _$1.implement(_$1.ICoerceable, {
    toObject: deref
  }));

  behaveAsNestedAttrs(NestedAttrs);

  var NodeList = _$1.global.NodeList;
  function isNodeList(self) {
    return self.constructor === NodeList;
  }

  behaveAsNodeList(NodeList);

  function Props(node) {
    this.node = node;
  }
  function props(node) {
    return new Props(node);
  }

  function lookup$4(self, key) {
    return self.node[key];
  }

  function contains$3(self, key) {
    return self.node.hasOwnProperty(key);
  }

  function assoc$3(self, key, value) {
    self.node[key] = value;
  }

  function dissoc$3(self, key) {
    delete self.node[key];
  }

  function includes$3(self, entry) {
    return self.node[_$1.key(entry)] === _$1.val(entry);
  }

  function yank$2(self, entry) {
    includes$3(self, entry) && _dissoc(self, _$1.key(entry));
  }

  function conj$2(self, entry) {
    assoc$3(self, _$1.key(entry), _$1.val(entry));
  }

  var behaveAsProps = _$1.does(_$1.implement(_$1.IDescriptive), _$1.implement(mut.ITransientMap, {
    dissoc: dissoc$3
  }), _$1.implement(_$1.IMap, {
    keys: Object.keys,
    vals: Object.values
  }), _$1.implement(_$1.IInclusive, {
    includes: includes$3
  }), _$1.implement(mut.ITransientAssociative, {
    assoc: assoc$3
  }), _$1.implement(_$1.IAssociative, {
    contains: contains$3
  }), _$1.implement(_$1.ILookup, {
    lookup: lookup$4
  }), _$1.implement(mut.ITransientYankable, {
    yank: yank$2
  }), _$1.implement(mut.ITransientCollection, {
    conj: conj$2
  }));

  behaveAsProps(Props);

  function SpaceSeparated(element, key) {
    this.element = element;
    this.key = key;
  }

  function spaceSep2(element, key) {
    return new SpaceSeparated(element, key);
  }

  function spaceSep1(key) {
    return function (element) {
      return spaceSep2(element, key);
    };
  }

  var spaceSep = _$1.overload(null, spaceSep1, spaceSep2);
  var classes = spaceSep1("class");

  function seq$2(self) {
    var text = self.element.getAttribute(self.key);
    return text && text.length ? text.split(" ") : null;
  }

  function includes$4(self, text) {
    var xs = seq$2(self);
    return xs && _$1.locate(xs, function (t) {
      return t == text;
    });
  }

  function conj$3(self, text) {
    self.element.setAttribute(self.key, deref$1(self).concat(text).join(" "));
  }

  function yank$3(self, text) {
    self.element.setAttribute(self.key, _$1.filtera(function (t) {
      return t !== text;
    }, seq$2(self)).join(" "));
  }

  function deref$1(self) {
    return seq$2(self) || [];
  }

  function count$2(self) {
    return deref$1(self).length;
  }

  var behaveAsSpaceSeparated = _$1.does(_$1.implement(_$1.ISequential), _$1.implement(_$1.ISeq, {
    seq: seq$2
  }), _$1.implement(_$1.IDeref, {
    deref: deref$1
  }), _$1.implement(_$1.IInclusive, {
    includes: includes$4
  }), _$1.implement(mut.ITransientYankable, {
    yank: yank$3
  }), _$1.implement(_$1.ICounted, {
    count: count$2
  }), _$1.implement(mut.ITransientCollection, {
    conj: conj$3
  }), _$1.implement(_$1.ICoerceable, {
    toArray: deref$1
  }));

  behaveAsSpaceSeparated(SpaceSeparated);

  var XMLDocument = _$1.global.XMLDocument || _$1.global.Document; //IE fallback

  function isXMLDocument(self) {
    return self instanceof XMLDocument;
  }

  behaveAsHTMLDocument(XMLDocument);

  function contents2(self, type) {
    return _$1.filter(function (node) {
      return node.nodeType === type;
    }, IContent.contents(self));
  }

  var contents$2 = _$1.overload(null, IContent.contents, contents2);

  var hide$1 = IHideable.hide;
  var show$1 = IHideable.show;
  var toggle$1 = IHideable.toggle;

  var html$1 = IHtml.html;

  var text$2 = IText.text;

  var value$2 = IValue.value;

  function attr2(self, key) {
    if (_$1.isString(key)) {
      return self.getAttribute(key);
    } else {
      var pairs = key;
      _$1.eachkv(function (_arg, _arg2) {
        return attr3(self, _arg, _arg2);
      }, pairs);
    }
  }

  function attr3(self, key, value) {
    self.setAttribute(key, _$1.str(value));
  }

  function attrN(self) {
    var stop = (arguments.length <= 1 ? 0 : arguments.length - 1) - 1;

    for (var i = 0; i <= stop; i += 2) {
      attr3(self, i + 1 < 1 || arguments.length <= i + 1 ? undefined : arguments[i + 1], i + 1 + 1 < 1 || arguments.length <= i + 1 + 1 ? undefined : arguments[i + 1 + 1]);
    }
  }

  var attr = _$1.overload(null, null, attr2, attr3, attrN);

  function removeAttr2(self, key) {
    self.removeAttribute(key);
  }

  var removeAttr = _$1.overload(null, null, removeAttr2, _$1.doing(removeAttr2));

  function prop3(self, key, value) {
    self[key] = value;
  }

  function prop2(self, key) {
    return self[key];
  }

  var prop = _$1.overload(null, null, prop2, prop3);
  function addStyle(self, key, value) {
    self.style[key] = value;
  }

  function removeStyle2(self, key) {
    self.style.removeProperty(key);
  }

  function removeStyle3(self, key, value) {
    if (self.style[key] === value) {
      self.style.removeProperty(key);
    }
  }

  var removeStyle = _$1.overload(null, null, removeStyle2, removeStyle3);
  function addClass(self, name) {
    self.classList.add(name);
  }
  function removeClass(self, name) {
    self.classList.remove(name);
  }

  function toggleClass2(self, name) {
    toggleClass3(self, name, !self.classList.contains(name));
  }

  function toggleClass3(self, name, want) {
    self.classList[want ? "add" : "remove"](name);
  }

  var toggleClass = _$1.overload(null, null, toggleClass2, toggleClass3);
  function hasClass(self, name) {
    return self.classList.contains(name);
  }
  function assert(el, selector) {
    if (!_$1.matches(el, selector)) {
      throw new InvalidHostElementError(el, selector);
    }
  }

  function mount3(render, config, el) {
    return mount4(_$1.constantly(null), render, config, el);
  }

  function mount4(create, render, config, el) {
    config.what && $.trigger(el, config.what + ":installing", {
      bubbles: true,
      detail: {
        config: config
      }
    });
    $.trigger(el, "installing", {
      bubbles: true,
      detail: {
        config: config
      }
    });
    var bus = create(config),
        detail = {
      config: config,
      bus: bus
    };
    _$1.doto(el, function (_arg3) {
      return $.on(_arg3, "mounting mounted", function (e) {
        Object.assign(e.detail, detail);
      });
    }, function (_arg4) {
      return render(_arg4, config, bus);
    }, mounts);
    config.what && $.trigger(el, config.what + ":installed", {
      bubbles: true,
      detail: detail
    });
    $.trigger(el, "installed", {
      bubbles: true,
      detail: detail
    });
    return bus;
  }

  var mount = _$1.overload(null, null, null, mount3, mount4);
  var markup = _$1.obj(function (name) {
    for (var _len = arguments.length, contents = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      contents[_key - 1] = arguments[_key];
    }

    var attrs = _$1.map(function (entry) {
      return _$1.template("{0}=\"{1}\"", _$1.key(entry), _$1.replace(_$1.val(entry), /"/g, '&quot;'));
    }, _$1.apply(_$1.merge, _$1.filter(_$1.isObject, contents)));
    var content = _$1.map(_$1.str, _$1.remove(_$1.isObject, contents));
    return _$1.join("", _$1.concat(["<" + name + " " + _$1.join(" ", attrs) + ">"], content, "</" + name + ">"));
  }, Infinity);
  function tag() {
    return _$1.apply(_$1.partial, element, _$1.slice(arguments));
  }

  function sel02(selector, context) {
    return _$1.query(context, context.querySelectorAll ? selector : function (_arg5) {
      return _$1.matches(_arg5, selector);
    });
  }

  function sel01(selector) {
    return sel02(selector, document);
  }

  function sel00() {
    return _$1.descendants(document);
  }

  var sel = _$1.overload(sel00, sel01, sel02);

  function sel12(selector, context) {
    return _$1.locate(context, selector);
  }

  function sel11(selector) {
    return sel12(selector, document);
  }

  function sel10() {
    return _$1.first(_$1.descendants(document));
  }

  var sel1 = _$1.overload(sel10, sel11, sel12);
  function checkbox() {
    var checkbox = tag('input', {
      type: "checkbox"
    });

    function value1(el) {
      return el.checked;
    }

    function value2(el, checked) {
      el.checked = checked;
    }

    var value = _$1.overload(null, value1, value2);
    return _$1.doto(checkbox.apply(void 0, arguments), _$1.specify(IValue, {
      value: value
    }));
  }
  function select(options) {
    for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var select = tag('select'),
        option = tag('option'),
        el = select.apply(void 0, args);
    _$1.each(function (entry) {
      mut.append(el, option({
        value: _$1.key(entry)
      }, _$1.val(entry)));
    }, options);
    return el;
  }
  var textbox = tag('input', {
    type: "text"
  });
  _$1.extend(_$1.ICoerceable, {
    toFragment: null
  });
  var toFragment = _$1.ICoerceable.toFragment;

  (function () {
    function embed(self, parent, nextSibling) {
      IEmbeddable.embed(document.createTextNode(self), parent, nextSibling);
    }

    function toFragment(self) {
      return document.createRange().createContextualFragment(self);
    }

    _$1.doto(String, _$1.implement(_$1.ICoerceable, {
      toFragment: toFragment
    }), _$1.implement(IEmbeddable, {
      embed: embed
    }));
  })();

  (function () {
    function embed(self, parent, nextSibling) {
      IEmbeddable.embed(document.createTextNode(_$1.str(self)), parent, nextSibling);
    }

    _$1.doto(Number, _$1.implement(IEmbeddable, {
      embed: embed
    }));
  })();

  (function () {
    function embed(self, parent) {
      _$1.each(function (entry) {
        mut.assoc(parent, _$1.key(entry), _$1.val(entry));
      }, self);
    }

    _$1.doto(Object, _$1.implement(IEmbeddable, {
      embed: embed
    }));
  })();

  (function () {
    function toFragment(_) {
      return document.createRange().createContextualFragment("");
    }

    _$1.doto(_$1.Nil, _$1.implement(_$1.ICoerceable, {
      toFragment: toFragment
    }), _$1.implement(IEmbeddable, {
      embed: _$1.identity
    }));
  })();

  exports.append = mut.append;
  exports.prepend = mut.prepend;
  exports.before = mut.before;
  exports.after = mut.after;
  exports.yank = mut.yank;
  exports.empty = mut.empty;
  exports.attr = attr;
  exports.removeAttr = removeAttr;
  exports.prop = prop;
  exports.addStyle = addStyle;
  exports.removeStyle = removeStyle;
  exports.addClass = addClass;
  exports.removeClass = removeClass;
  exports.toggleClass = toggleClass;
  exports.hasClass = hasClass;
  exports.assert = assert;
  exports.mount = mount;
  exports.markup = markup;
  exports.tag = tag;
  exports.sel = sel;
  exports.sel1 = sel1;
  exports.checkbox = checkbox;
  exports.select = select;
  exports.textbox = textbox;
  exports.toFragment = toFragment;
  exports.Attrs = Attrs;
  exports.attrs = attrs;
  exports.Comment = Comment;
  exports.DocumentFragment = DocumentFragment;
  exports.fragment = fragment;
  exports.isDocumentFragment = isDocumentFragment;
  exports.Element = Element;
  exports.element = element;
  exports.elementns = elementns;
  exports.isElement = isElement;
  exports.replaceWith = replaceWith;
  exports.wrap = wrap;
  exports.isVisible = isVisible;
  exports.enable = enable;
  exports.HTMLCollection = HTMLCollection;
  exports.HTMLDocument = HTMLDocument;
  exports.isHTMLDocument = isHTMLDocument;
  exports.HTMLSelectElement = HTMLSelectElement;
  exports.InvalidHostElementError = InvalidHostElementError;
  exports.Location = Location;
  exports.isLocation = isLocation;
  exports.NestedAttrs = NestedAttrs;
  exports.nestedAttrs = nestedAttrs;
  exports.style = style;
  exports.NodeList = NodeList;
  exports.isNodeList = isNodeList;
  exports.Props = Props;
  exports.props = props;
  exports.SpaceSeparated = SpaceSeparated;
  exports.spaceSep = spaceSep;
  exports.classes = classes;
  exports.XMLDocument = XMLDocument;
  exports.isXMLDocument = isXMLDocument;
  exports.IContent = IContent;
  exports.IEmbeddable = IEmbeddable;
  exports.embeds = embeds;
  exports.IHideable = IHideable;
  exports.IHtml = IHtml;
  exports.IMountable = IMountable;
  exports.IText = IText;
  exports.IValue = IValue;
  exports.contents = contents$2;
  exports.hide = hide$1;
  exports.show = show$1;
  exports.toggle = toggle$1;
  exports.html = html$1;
  exports.isMountable = isMountable;
  exports.mounts = mounts;
  exports.text = text$2;
  exports.value = value$2;

  Object.defineProperty(exports, '__esModule', { value: true });

});
