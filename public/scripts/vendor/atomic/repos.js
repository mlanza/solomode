define(['exports', 'atomic/core', 'fetch', 'promise'], function (exports, _$1, fetch, Promise$1) { 'use strict';

  fetch = fetch && fetch.hasOwnProperty('default') ? fetch['default'] : fetch;
  var Promise$1__default = 'default' in Promise$1 ? Promise$1['default'] : Promise$1;

  function Request(url, options, config, interceptors, handlers) {
    this.url = url;
    this.options = options;
    this.config = config;
    this.interceptors = interceptors;
    this.handlers = handlers;
  }
  function request(url, config) {
    return new Request(url, {}, config || {}, [filling], []);
  }

  var filling = function filling(_arg) {
    return _$1.fmap(_arg, function (self) {
      return _$1.fill(self, self.config);
    });
  };

  var IAddress = _$1.protocol({
    addr: _$1.identity
  });

  var IIntercept = _$1.protocol({
    intercept: null
  });

  var IOptions = _$1.protocol({
    options: null
  });

  var IParams = _$1.protocol({
    params: null
  });

  function demand(self, keys) {
    return IIntercept.intercept(self, function (req) {
      var params = _$1.remove(function (_arg) {
        return _$1.contains(req, _arg);
      }, keys);

      if (_$1.seq(params)) {
        throw new TypeError("Missing required params — " + _$1.join(", ", _$1.map(function (_arg2) {
          return _$1.str("`", _arg2, "`");
        }, params)) + ".");
      }

      return req;
    });
  }

  function query(self, plan) {
    var _ref3, _ref4, _self;

    var keys = _$1.filter(function (_arg) {
      return _$1.startsWith(_arg, "$");
    }, _$1.keys(plan));

    var _ref = _$1.apply(_$1.dissoc, plan, keys);

    var _ref2 = _$1.selectKeys(plan, keys);

    return _ref3 = (_ref4 = (_self = self, function (_arg2) {
      return _$1.merge(_arg2, _ref);
    }(_self)), function (_arg3) {
      return IParams.params(_arg3, _ref2);
    }(_ref4)), _$1.fromTask(_ref3);
  }

  function fill(self, params) {
    var _ref5, _self2;

    return _ref5 = (_self2 = self, function (_arg4) {
      return _$1.edit(_arg4, "url", function (_arg5) {
        return _$1.fill(_arg5, params);
      });
    }(_self2)), function (_arg6) {
      return _$1.edit(_arg6, "options", function (_arg7) {
        return _$1.fill(_arg7, params);
      });
    }(_ref5);
  }

  function clone(self) {
    return new self.constructor(self.url, self.options, self.config, self.interceptors, self.handlers);
  }

  function addr(self) {
    return _$1.fill(_$1.str(self.url), self.config);
  }

  function assoc(self, key, value) {
    return _$1.edit(self, "config", function (_arg8) {
      return _$1.IAssociative.assoc(_arg8, key, value);
    });
  }

  function contains(self, key) {
    return _$1.IAssociative.contains(self.config, key);
  }

  function keys$1(self) {
    return _$1.IMap.keys(self.config);
  }

  function lookup(self, key) {
    return _$1.ILookup.lookup(self.config, key);
  }

  function params(self, params) {
    return _$1.edit(self, "url", function (_arg9) {
      return IParams.params(_arg9, params);
    });
  }

  function options(self, options) {
    return _$1.edit(self, "options", _$1.isFunction(options) ? options : function (_arg10) {
      return _$1.absorb(_arg10, options);
    });
  }

  function intercept(self, interceptor) {
    return prepend(self, function (_arg11) {
      return _$1.fmap(_arg11, interceptor);
    });
  }

  function fmap(self, handler) {
    return append(self, function (_arg12) {
      return _$1.fmap(_arg12, handler);
    });
  }

  function prepend(self, xf) {
    return _$1.edit(self, "interceptors", function (_arg13) {
      return _$1.prepend(_arg13, xf);
    });
  }

  function append(self, xf) {
    return _$1.edit(self, "handlers", function (_arg14) {
      return _$1.append(_arg14, xf);
    });
  }

  function fork(self, reject, resolve) {
    var _ref6, _ref7, _self3;

    return _ref6 = (_ref7 = (_self3 = self, Promise$1__default.resolve(_self3)), _$1.apply(_$1.pipe, self.interceptors)(_ref7)), function (_arg15) {
      return _$1.fmap(_arg15, function (self) {
        var _ref8, _fetch;

        return _ref8 = (_fetch = fetch(self.url, self.options), _$1.apply(_$1.pipe, self.handlers)(_fetch)), function (_arg16) {
          return _$1.fork(_arg16, reject, resolve);
        }(_ref8);
      });
    }(_ref6);
  }

  var behaveAsRequest = _$1.does(_$1.implement(_$1.ITemplate, {
    fill: fill
  }), _$1.implement(_$1.ICloneable, {
    clone: clone
  }), _$1.implement(_$1.ICoerceable, {
    toPromise: _$1.fromTask
  }), _$1.implement(_$1.IAppendable, {
    append: append
  }), _$1.implement(_$1.IPrependable, {
    prepend: prepend
  }), _$1.implement(_$1.IForkable, {
    fork: fork
  }), _$1.implement(_$1.IQueryable, {
    query: query
  }), _$1.implement(_$1.IAssociative, {
    assoc: assoc,
    contains: contains
  }), _$1.implement(_$1.ILookup, {
    lookup: lookup
  }), _$1.implement(_$1.IMap, {
    keys: keys$1
  }), _$1.implement(IAddress, {
    addr: addr
  }), _$1.implement(IOptions, {
    options: options
  }), _$1.implement(IParams, {
    params: params
  }), _$1.implement(IIntercept, {
    intercept: intercept
  }), _$1.implement(_$1.IFunctor, {
    fmap: fmap
  }));

  behaveAsRequest(Request);

  function Routed(requests) {
    this.requests = requests;
  }
  var routed = _$1.constructs(Routed);

  function xform(xf) {
    return function (self) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      return _$1.edit(self, "requests", function (_arg2) {
        return _$1.mapa(function (_arg) {
          return _$1.apply(xf, _arg, args);
        }, _arg2);
      });
    };
  }

  function clone$1(self) {
    return new self.constructor(self.requests);
  }

  function filled(self) {
    return _$1.maybe(self, IAddress.addr, function (_arg3) {
      return _$1.test(/\{[^{}]+\}/, _arg3);
    }, _$1.not);
  }

  function fork$1(self, reject, resolve) {
    return _$1.IForkable.fork(_$1.detect(filled, self.requests), reject, resolve);
  }

  function addr$1(self) {
    return IAddress.addr(_$1.detect(filled, self.requests));
  }

  function first(self) {
    return _$1.first(self.requests);
  }

  function rest(self) {
    return _$1.rest(self.requests);
  }

  var behaveAsRouted = _$1.does(_$1.implement(_$1.ICloneable, {
    clone: clone$1
  }), _$1.implement(_$1.ICoerceable, {
    toPromise: _$1.fromTask
  }), _$1.implement(_$1.IForkable, {
    fork: fork$1
  }), _$1.implement(_$1.IQueryable, {
    query: query
  }), _$1.implement(_$1.ISeq, {
    first: first,
    rest: rest
  }), _$1.implement(IAddress, {
    addr: addr$1
  }), _$1.implement(_$1.ITemplate, {
    fill: xform(_$1.ITemplate.fill)
  }), _$1.implement(_$1.ICollection, {
    conj: xform(_$1.ICollection.conj)
  }), _$1.implement(IIntercept, {
    intercept: xform(IIntercept.intercept)
  }), _$1.implement(_$1.IFunctor, {
    fmap: xform(_$1.IFunctor.fmap)
  }), _$1.implement(_$1.IAssociative, {
    assoc: xform(_$1.IAssociative.assoc)
  }), _$1.implement(_$1.IMap, {
    dissoc: xform(_$1.IMap.dissoc)
  }), _$1.implement(IParams, {
    params: xform(IParams.params)
  }), _$1.implement(IOptions, {
    options: xform(IOptions.options)
  }));

  behaveAsRouted(Routed);

  function URL(url, xfq) {
    this.url = url;
    this.xfq = xfq;
  }

  URL.prototype.toString = function () {
    return this.url;
  };

  function url1(url) {
    return url2(url, _$1.identity);
  }

  var url2 = _$1.constructs(URL);
  var url = _$1.overload(null, url1, url2);

  function params$1(self, obj) {
    var _ref, _self$url, _ref2, _ref3, _ref4, _self$url2;

    var f = _$1.isFunction(obj) ? obj : function (_arg) {
      return _$1.merge(_arg, obj);
    };
    return new self.constructor(_$1.str((_ref = (_self$url = self.url, function (_arg2) {
      return _$1.split(_arg2, "?");
    }(_self$url)), _$1.first(_ref)), (_ref2 = (_ref3 = (_ref4 = (_self$url2 = self.url, _$1.fromQueryString(_self$url2)), f(_ref4)), self.xfq(_ref3)), _$1.toQueryString(_ref2))), self.xfq);
  }

  function fill$1(self, params) {
    return _$1.ITemplate.fill(_$1.str(self), params);
  }

  var behaveAsURL = _$1.does(_$1.implement(IParams, {
    params: params$1
  }), _$1.implement(_$1.ITemplate, {
    fill: fill$1
  }));

  behaveAsURL(URL);

  var addr$2 = IAddress.addr;

  var intercept$1 = IIntercept.intercept;

  var options$1 = IOptions.options;
  function json(req) {
    var _ref, _req;

    return _ref = (_req = req, function (_arg) {
      return IOptions.options(_arg, {
        credentials: "same-origin",
        headers: {
          "Accept": "application/json;odata=verbose",
          "Content-Type": "application/json;odata=verbose"
        }
      });
    }(_req)), function (_arg2) {
      return _$1.fmap(_arg2, function (resp) {
        return resp.json();
      });
    }(_ref);
  }
  function method(req, method) {
    return IOptions.options(req, {
      method: method
    });
  }

  var params$2 = IParams.params;

  function text(req) {
    return _$1.fmap(req, function (resp) {
      return resp.text();
    });
  }
  function xml(req) {
    var parser = new DOMParser();
    return _$1.fmap(text(req), function (text) {
      return parser.parseFromString(text, "text/xml");
    });
  }
  function raise(req) {
    return _$1.fmap(req, function (resp) {
      return new Promise$1__default(function (resolve, reject) {
        return resp.ok ? resolve(resp) : reject(resp);
      });
    });
  }
  function suppress(req, f) {
    return _$1.fmap(req, function (resp) {
      return new Promise$1__default(function (resolve, reject) {
        return resp.ok ? resolve(resp) : resolve(f(resp));
      });
    });
  }

  function params$3(self, obj) {
    var _ref, _self, _ref2, _ref3, _self2;

    var f = _$1.isFunction(obj) ? obj : function (_arg) {
      return _$1.merge(_arg, obj);
    };
    return _$1.str((_ref = (_self = self, function (_arg2) {
      return _$1.split(_arg2, "?");
    }(_self)), _$1.first(_ref)), (_ref2 = (_ref3 = (_self2 = self, _$1.fromQueryString(_self2)), f(_ref3)), _$1.toQueryString(_ref2)));
  }

  _$1.implement(IParams, {
    params: params$3
  }, String);

  exports.text = text;
  exports.xml = xml;
  exports.raise = raise;
  exports.suppress = suppress;
  exports.Request = Request;
  exports.request = request;
  exports.demand = demand;
  exports.Routed = Routed;
  exports.routed = routed;
  exports.URL = URL;
  exports.url = url;
  exports.IAddress = IAddress;
  exports.IIntercept = IIntercept;
  exports.IOptions = IOptions;
  exports.IParams = IParams;
  exports.addr = addr$2;
  exports.intercept = intercept$1;
  exports.options = options$1;
  exports.json = json;
  exports.method = method;
  exports.params = params$2;

  Object.defineProperty(exports, '__esModule', { value: true });

});
