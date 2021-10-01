import * as _ from 'atomic/core';
import { protocol, implement, IMergable, IReduce, does } from 'atomic/core';
import * as t from 'atomic/transducers';
import 'symbol';
import Promise$1 from 'promise';
import * as mut from 'atomic/transients';

function on2(self, f) {
  f(self);
}

function on3(self, pred, f) {
  if (pred(self)) {
    f(self);
  }
}

var on$1 = _.overload(null, null, on2, on3);

var IEvented = _.protocol({
  on: on$1,
  off: null,
  trigger: null
});

var on = IEvented.on;
var off = IEvented.off;
var trigger = IEvented.trigger;

function one3(self, key, callback) {
  function cb(e) {
    off(self, key, ctx.cb);
    callback.call(this, e);
  }

  var ctx = {
    cb: cb
  };
  return on(self, key, cb);
}

function one4(self, key, selector, callback) {
  function cb(e) {
    off(self, key, ctx.cb);
    callback.call(this, e);
  }

  var ctx = {
    cb: cb
  };
  return on(self, key, selector, cb);
}

var one = _.overload(null, null, null, one3, one4);

var IPublish = _.protocol({
  pub: null,
  err: null,
  complete: null,
  closed: null
});

var pub$3 = IPublish.pub;
var err$3 = IPublish.err;
var complete$3 = IPublish.complete;
var closed$3 = IPublish.closed;

var ISubscribe = protocol({
  sub: null,
  unsub: null,
  subscribed: null
});

function _toConsumableArray$1(arr) { return _arrayWithoutHoles$1(arr) || _iterableToArray$1(arr) || _unsupportedIterableToArray$2(arr) || _nonIterableSpread$1(); }

function _nonIterableSpread$1() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray$2(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$2(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$2(o, minLen); }

function _iterableToArray$1(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles$1(arr) { if (Array.isArray(arr)) return _arrayLikeToArray$2(arr); }

function _arrayLikeToArray$2(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function sub3(source, xf, sink) {
  return ISubscribe.transducing(source, xf, sink); //TODO import transducing logic directly
}

function subN(source) {
  var sink = arguments[arguments.length - 1],
      xfs = _.slice(arguments, 1, arguments.length - 1);

  return sub3(source, _.comp.apply(_, _toConsumableArray$1(xfs)), sink);
}

var sub$5 = _.overload(null, null, ISubscribe.sub, sub3, subN);
var unsub$4 = _.overload(null, null, ISubscribe.unsub);
var subscribed$4 = ISubscribe.subscribed;

var p = /*#__PURE__*/Object.freeze({
  __proto__: null,
  on: on,
  off: off,
  trigger: trigger,
  one: one,
  pub: pub$3,
  err: err$3,
  complete: complete$3,
  closed: closed$3,
  sub: sub$5,
  unsub: unsub$4,
  subscribed: subscribed$4
});

function Observable(subscribe) {
  this.subscribe = subscribe;
}
function observable(subscribe) {
  return new Observable(subscribe);
}

function merge(self, other) {
  return observable(function (observer) {
    var _observer, _p$pub, _p;

    var handle = (_p = p, _p$pub = _p.pub, _observer = observer, function pub(_argPlaceholder) {
      return _p$pub.call(_p, _observer, _argPlaceholder);
    });
    return does(sub$5(self, handle), sub$5(other, handle));
  });
}

function reduce(self, f, init) {
  var _self, _f;

  return sub$5(init, (_f = f, _self = self, function f(_argPlaceholder2) {
    return _f(_self, _argPlaceholder2);
  }));
}

var imergable = implement(IMergable, {
  merge: merge
});
var ireduce = implement(IReduce, {
  reduce: reduce
});

function Subject(observers, terminated) {
  this.observers = observers;
  this.terminated = terminated;
}
function subject(observers) {
  return new Subject(mut["transient"](observers || []), null);
}
var broadcast = _.called(subject, "`broadcast` deprecated - use `subject` instead.");

function Cell(state, observer, validate) {
  this.state = state;
  this.observer = observer;
  this.validate = validate;
}

function cell0() {
  return cell1(null);
}

function cell1(init) {
  return cell2(init, subject());
}

function cell2(init, observer) {
  return cell3(init, observer, null);
}

function cell3(init, observer, validate) {
  return new Cell(init, observer, validate);
}

var cell = _.overload(cell0, cell1, cell2, cell3);

function Observer(pub, err, complete, terminated) {
  this.pub = pub;
  this.err = err;
  this.complete = complete;
  this.terminated = terminated;
}
function observer(pub, err, complete) {
  return new Observer(pub || _.noop, err || _.noop, complete || _.noop, null);
}

var _time, _tick, _time2, _when, _hist;

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray$1(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray$1(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen); }

function _arrayLikeToArray$1(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function pipeN(source) {
  for (var _len = arguments.length, xforms = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    xforms[_key - 1] = arguments[_key];
  }

  return pipe2(source, _.comp.apply(_, xforms));
}

function pipe2(source, xform) {
  return observable(function (obs) {
    var step = xform(_.overload(null, _.reduced, function (memo, value) {
      pub$3(memo, value);
      return memo;
    }));
    var sink = observer(function (value) {
      var memo = step(obs, value);

      if (_.isReduced(memo)) {
        complete$3(sink);
      }
    }, function (error) {
      err$3(obs, error);
      unsub && unsub();
    }, function () {
      step(obs);
      complete$3(obs);
      unsub && unsub();
    });
    var unsub = sub$5(source, sink); //might complete before returning `unsub` fn

    if (closed$3(sink)) {
      unsub();
      return _.noop;
    }

    return unsub;
  });
}

var pipe = _.overload(null, _.identity, pipe2, pipeN);

function share1(source) {
  return share2(source, subject());
}

function share2(source, sink) {
  var disconnect = _.noop,
      refs = 0;
  return observable(function (observer) {
    if (refs === 0) {
      disconnect = sub$5(source, sink);
    }

    refs++;
    var unsub = sub$5(sink, observer);
    return _.once(function () {
      refs--;

      if (refs === 0) {
        disconnect();
        disconnect = _.noop;
      }

      unsub();
    });
  });
}

var share = _.overload(null, share1, share2);
function sharing(source, init) {
  return share(source, init());
}

function seed2(init, source) {
  return observable(function (observer) {
    var _observer, _pub;

    var handle = (_pub = pub$3, _observer = observer, function pub(_argPlaceholder) {
      return _pub(_observer, _argPlaceholder);
    });
    handle(init());
    return sub$5(source, handle);
  });
}

function seed1(source) {
  return seed2(_.constantly(null), source);
} //adds an immediate value upon subscription as with cells.


var seed = _.overload(null, seed1, seed2);

function fromEvent2(el, key) {
  return observable(function (observer) {
    var _observer2, _pub2;

    var handler = (_pub2 = pub$3, _observer2 = observer, function pub(_argPlaceholder2) {
      return _pub2(_observer2, _argPlaceholder2);
    });
    el.addEventListener(key, handler);
    return function () {
      el.removeEventListener(key, handler);
    };
  });
}

function fromEvent3(el, key, selector) {
  return observable(function (observer) {
    var _observer3, _pub3;

    var handler = (_pub3 = pub$3, _observer3 = observer, function pub(_argPlaceholder3) {
      return _pub3(_observer3, _argPlaceholder3);
    });

    function delegate(e) {
      if (_.matches(e.target, selector)) {
        handler(observer, e);
      } else {
        var found = _.closest(e.target, selector);

        if (found && el.contains(found)) {
          handler(observer, Object.assign(Object.create(e), {
            target: found
          }));
        }
      }
    }

    el.addEventListener(key, delegate);
    return function () {
      el.removeEventListener(key, delegate);
    };
  });
}

function fromEvents2(el, keys) {
  var _el, _fromEvent;

  return _.apply(_.merge, _.map((_fromEvent = fromEvent2, _el = el, function fromEvent2(_argPlaceholder4) {
    return _fromEvent(_el, _argPlaceholder4);
  }), _.split(keys, ' ')));
}

function fromEvents3(el, keys, selector) {
  var _el2, _selector, _fromEvent2;

  return _.apply(_.merge, _.map((_fromEvent2 = fromEvent3, _el2 = el, _selector = selector, function fromEvent3(_argPlaceholder5) {
    return _fromEvent2(_el2, _argPlaceholder5, _selector);
  }), _.split(keys, ' ')));
}

var fromEvent$1 = _.overload(null, null, fromEvents2, fromEvents3);

function computed$1(f, source) {
  return seed(f, pipe(source, t.map(f)));
}

function fromElement$1(key, f, el) {
  return computed$1(function () {
    return f(el);
  }, fromEvent$1(el, key));
}

function hash$1(window) {
  return computed$1(function (e) {
    return window.location.hash;
  }, fromEvent$1(window, "hashchange"));
}

function indexed(sources) {
  return observable(function (observer) {
    var _param, _$mapIndexed, _ref;

    return _.just(sources, (_ref = _, _$mapIndexed = _ref.mapIndexed, _param = function _param(key, source) {
      return sub$5(source, function (value) {
        pub$3(observer, {
          key: key,
          value: value
        });
      });
    }, function mapIndexed(_argPlaceholder6) {
      return _$mapIndexed.call(_ref, _param, _argPlaceholder6);
    }), _.toArray, _.spread(_.does));
  });
}

function splay1(sources) {
  return splay2(sources, null);
}

function splay2(sources, blank) {
  var source = indexed(sources);
  return observable(function (observer) {
    var state = _.mapa(_.constantly(blank), sources);

    return sub$5(source, function (msg) {
      state = _.assoc(state, msg.key, msg.value);
      pub$3(observer, state);
    });
  });
}

var splay$1 = _.overload(null, splay1, splay2); //sources must publish an initial value immediately upon subscription as cells do.


function latest$1(sources) {
  var nil = {},
      source = splay2(sources, nil);
  return observable(function (observer) {
    var init = false;
    return sub$5(source, function (state) {
      if (init) {
        pub$3(observer, state);
      } else if (!_.includes(state, nil)) {
        init = true;
        pub$3(observer, state);
      }
    });
  });
}

function toggles$1(el, on, off, init) {
  return seed(init, _.merge(pipe(fromEvent$1(el, on), t.constantly(true)), pipe(fromEvent$1(el, off), t.constantly(false))));
}

function focus$1(el) {
  return toggles$1(el, "focus", "blur", function () {
    return el === el.ownerDocument.activeElement;
  });
}

function click$1(el) {
  return fromEvent$1(el, "click");
}

function hover$1(el) {
  return toggles$1(el, "mouseover", "mouseout", _.constantly(false));
}

function fixed$1(value) {
  return observable(function (observer) {
    pub$3(observer, value);
    complete$3(observer);
  });
}

function time() {
  return _.date().getTime();
}

function tick2(interval, f) {
  return observable(function (observer) {
    var iv = setInterval(function () {
      pub$3(observer, f());
    }, interval);
    return function () {
      clearInterval(iv);
    };
  });
}

var tick$1 = _.overload(null, (_tick = tick2, _time = time, function tick2(_argPlaceholder7) {
  return _tick(_argPlaceholder7, _time);
}), tick2);

function when2(interval, f) {
  return seed(f, tick$1(interval, f));
}

var when$1 = _.overload(null, (_when = when2, _time2 = time, function when2(_argPlaceholder8) {
  return _when(_argPlaceholder8, _time2);
}), when2);

function map2(f, source) {
  return pipe(source, t.map(f), t.dedupe());
}

function mapN(f) {
  for (var _len2 = arguments.length, sources = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    sources[_key2 - 1] = arguments[_key2];
  }

  return map2(_.spread(f), latest$1(sources));
}

var map$1 = _.overload(null, null, map2, mapN);

function resolve(source) {
  return observable(function (observer) {
    return sub$5(source, function (value) {
      var _observer4, _pub4;

      Promise$1.resolve(value).then((_pub4 = pub$3, _observer4 = observer, function pub(_argPlaceholder9) {
        return _pub4(_observer4, _argPlaceholder9);
      }));
    });
  });
}

function depressed$1(el) {
  return seed(_.constantly([]), pipe(fromEvent$1(el, "keydown keyup"), t.scan(function (memo, e) {
    if (e.type === "keyup") {
      var _e$key, _$notEq, _ref2;

      memo = _.filtera((_ref2 = _, _$notEq = _ref2.notEq, _e$key = e.key, function notEq(_argPlaceholder10) {
        return _$notEq.call(_ref2, _e$key, _argPlaceholder10);
      }), memo);
    } else if (!_.includes(memo, e.key)) {
      memo = _.conj(memo, e.key);
    }

    return memo;
  }, []), t.dedupe()));
}

function hist2(size, source) {
  return pipe(source, t.hist(size));
}

var hist$1 = _.overload(null, (_hist = hist2, function hist2(_argPlaceholder11) {
  return _hist(2, _argPlaceholder11);
}), hist2);

function fromCollection(coll) {
  return observable(function (observer) {
    var _iterator = _createForOfIteratorHelper(coll),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var item = _step.value;
        pub$3(observer, item);

        if (closed$3(observer)) {
          return;
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    complete$3(observer);
  });
}

function fromPromise$1(promise) {
  return observable(function (observer) {
    var _observer5, _pub5, _observer6, _err;

    promise.then((_pub5 = pub$3, _observer5 = observer, function pub(_argPlaceholder12) {
      return _pub5(_observer5, _argPlaceholder12);
    }), (_err = err$3, _observer6 = observer, function err(_argPlaceholder13) {
      return _err(_observer6, _argPlaceholder13);
    })).then(function () {
      complete$3(observer);
    });
  });
}

function fromSource(source) {
  var _source, _sub;

  //can be used to cover a source making it readonly
  return observable((_sub = sub$5, _source = source, function sub(_argPlaceholder14) {
    return _sub(_source, _argPlaceholder14);
  }));
}

function toObservable(self) {
  var f = _.satisfies(_.ICoercible, "toObservable", self);

  if (f) {
    return f(self);
  } else if (_.satisfies(ISubscribe, "sub", self)) {
    return fromSource(self);
  } else if (_.satisfies(_.ISequential, self)) {
    return fromCollection(self);
  }
}

_.extend(_.ICoercible, {
  toObservable: null
});

_.doto(Observable, _.implement(_.ICoercible, {
  toObservable: _.identity
}));

_.doto(Promise$1, _.implement(_.ICoercible, {
  toObservable: fromPromise$1
}));

Object.assign(Observable, {
  latest: latest$1,
  map: map$1,
  hist: hist$1,
  splay: splay$1,
  indexed: indexed,
  computed: computed$1,
  fromSource: fromSource,
  fromEvent: fromEvent$1,
  fromPromise: fromPromise$1,
  fromElement: fromElement$1,
  fixed: fixed$1,
  hash: hash$1,
  tick: tick$1,
  when: when$1,
  resolve: resolve,
  depressed: depressed$1,
  toggles: toggles$1,
  focus: focus$1,
  click: click$1,
  hover: hover$1
});

function sub$4(self, observer) {
  var unsub = self.subscribe(observer) || _.noop;

  return closed$3(observer) ? (unsub(), _.noop) : unsub;
}

var deref$3 = _.called(function deref(self) {
  var value = null;
  sub$5(self, function (val) {
    value = val;
  })(); //immediate unsubscribe

  return value;
}, "Prefer to subscribe to observables rather than `deref` them.");

var behave$5 = _.does(ireduce, imergable, _.implement(_.IDeref, {
  deref: deref$3
}), _.implement(ISubscribe, {
  sub: sub$4,
  unsub: _.noop,
  subscribed: _.constantly(1)
})); //TODO  `unsub` and `subscribed` mock implementations are for cross compatibility and may be removed post migration

behave$5(Observable);

function pub$2(self, value) {
  if (value !== self.state) {
    if (!self.validate || self.validate(value)) {
      self.state = value;
      pub$3(self.observer, value);
    } else {
      throw new Error("Cell update failed - invalid value.");
    }
  }
}

function err$2(self, observer) {
  err$3(self.observer, observer);
}

var complete$2 = _.noop; //if completed, future subscribes to get the last known value would fail.

function closed$2(self) {
  return closed$3(self.observer);
}

function sub$3(self, observer) {
  pub$3(observer, self.state); //to prime subscriber state

  return sub$5(self.observer, observer); //return unsubscribe fn
}

function unsub$3(self, observer) {
  unsub$4(self.observer, observer);
}

function subscribed$3(self) {
  return subscribed$4(self.observer);
}

function deref$2(self) {
  return self.state;
}

function swap$2(self, f) {
  pub$2(self, f(self.state));
}

function dispose(self) {
  _.satisfies(_.IDisposable, self.observer) && _.dispose(self.observer);
}

var behave$4 = _.does(ireduce, imergable, _.implement(_.IDisposable, {
  dispose: dispose
}), _.implement(_.IDeref, {
  deref: deref$2
}), _.implement(_.IReset, {
  reset: pub$2
}), _.implement(_.ISwap, {
  swap: swap$2
}), _.implement(ISubscribe, {
  sub: sub$3,
  unsub: unsub$3,
  subscribed: subscribed$3
}), _.implement(IPublish, {
  pub: pub$2,
  err: err$2,
  complete: complete$2,
  closed: closed$2
}));

behave$4(Cell);

function Cursor(source, path, callbacks) {
  this.source = source;
  this.path = path;
  this.callbacks = callbacks;
}
function cursor(source, path) {
  return new Cursor(source, path, _.weakMap());
}

function path(self) {
  return self.path;
}

function deref$1(self) {
  return _.getIn(_.deref(self.source), self.path);
}

function reset$1(self, value) {
  _.swap(self.source, function (state) {
    return _.assocIn(state, self.path, value);
  });
}

function swap$1(self, f) {
  _.swap(self.source, function (state) {
    return _.updateIn(state, self.path, f);
  });
}

function sub$2(self, observer) {
  function observe(state) {
    pub$3(observer, _.getIn(state, self.path));
  }

  self.callbacks.set(observer, observe);
  sub$5(self.source, observe);
}

function unsub$2(self, observer) {
  var observe = self.callbacks.get(observer);
  unsub$4(self.source, observe);
  observe && self.callbacks["delete"](observer);
}

function subscribed$2(self) {
  return _.count(self.callbacks);
}

var behave$3 = _.does( //_.implement(_.IDisposable, {dispose}), TODO
_.implement(_.IPath, {
  path: path
}), _.implement(_.IDeref, {
  deref: deref$1
}), _.implement(_.IReset, {
  reset: reset$1
}), _.implement(_.ISwap, {
  swap: swap$1
}), _.implement(ISubscribe, {
  sub: sub$2,
  unsub: unsub$2,
  subscribed: subscribed$2
}), _.implement(IPublish, {
  pub: reset$1
}));

behave$3(Cursor);

function Journal(pos, max, history, cell) {
  this.pos = pos;
  this.max = max;
  this.history = history;
  this.cell = cell;
}

function journal2(max, cell) {
  return new Journal(0, max, [_.deref(cell)], cell);
}

function journal1(cell) {
  return journal2(Infinity, cell);
}

var journal = _.called(_.overload(null, journal1, journal2), "`journal` is deprecated — use persistent `journal` from `core` and a `cell`.");

function deref(self) {
  return _.deref(self.cell);
}

function reset(self, state) {
  var history = self.pos ? self.history.slice(self.pos) : self.history;
  history.unshift(state);

  while (_.count(history) > self.max) {
    history.pop();
  }

  self.history = history;
  self.pos = 0;

  _.reset(self.cell, state);
}

function swap(self, f) {
  reset(self, f(_.deref(self.cell)));
}

function sub$1(self, observer) {
  sub$5(self.cell, observer);
}

function unsub$1(self, observer) {
  unsub$4(self.cell, observer);
}

function subscribed$1(self) {
  return subscribed$4(self.cell);
}

function undo(self) {
  if (undoable(self)) {
    self.pos += 1;

    _.reset(self.cell, self.history[self.pos]);
  }
}

function redo(self) {
  if (redoable(self)) {
    self.pos -= 1;

    _.reset(self.cell, self.history[self.pos]);
  }
}

function flush(self) {
  self.history = [self.history[self.pos]];
  self.pos = 0;
}

function undoable(self) {
  return self.pos < _.count(self.history);
}

function redoable(self) {
  return self.pos > 0;
}

var behave$2 = _.does(_.implement(_.IDeref, {
  deref: deref
}), _.implement(_.IReset, {
  reset: reset
}), _.implement(_.ISwap, {
  swap: swap
}), _.implement(_.IRevertible, {
  undo: undo,
  redo: redo,
  flush: flush,
  undoable: undoable,
  redoable: redoable
}), _.implement(ISubscribe, {
  sub: sub$1,
  unsub: unsub$1,
  subscribed: subscribed$1
}));

behave$2(Journal);

function pub$1(self, message) {
  if (!self.terminated) {
    return self.pub(message); //unusual for a command but required by transducers
  }
}

function err$1(self, error) {
  if (!self.terminated) {
    self.terminated = {
      how: "error",
      error: error
    };
    self.err(error);
  }
}

function complete$1(self) {
  if (!self.terminated) {
    self.terminated = {
      how: "complete"
    };
    self.complete();
  }
}

function closed$1(self) {
  return self.terminated;
}

var behave$1 = _.does(_.implement(IPublish, {
  pub: pub$1,
  err: err$1,
  complete: complete$1,
  closed: closed$1
}));

behave$1(Observer);

function sub(self, observer) {
  if (!self.terminated) {
    mut.conj(self.observers, observer);
    return _.once(function () {
      unsub(self, observer);
    });
  } else {
    throw new Error("Cannot subscribe to a terminated Subject.");
  }
}

function unsub(self, observer) {
  mut.unconj(self.observers, observer);
}

function subscribed(self) {
  return _.count(self.observers);
}

function pub(self, message) {
  if (!self.terminated) {
    var _message, _p$pub, _p;

    notify(self, (_p = p, _p$pub = _p.pub, _message = message, function pub(_argPlaceholder) {
      return _p$pub.call(_p, _argPlaceholder, _message);
    }));
  }
}

function err(self, error) {
  if (!self.terminated) {
    var _error, _p$err, _p2;

    self.terminated = {
      how: "error",
      error: error
    };
    notify(self, (_p2 = p, _p$err = _p2.err, _error = error, function err(_argPlaceholder2) {
      return _p$err.call(_p2, _argPlaceholder2, _error);
    }));
    self.observers = null; //release references
  }
}

function complete(self) {
  if (!self.terminated) {
    self.terminated = {
      how: "complete"
    };
    notify(self, complete$3);
    self.observers = null; //release references
  }
}

function closed(self) {
  return self.terminated;
} //copying prevents midstream changes to observers


function notify(self, f) {
  _.each(f, _.clone(self.observers));
}

var behave = _.does(ireduce, imergable, _.implement(ISubscribe, {
  sub: sub,
  unsub: unsub,
  subscribed: subscribed
}), _.implement(IPublish, {
  pub: pub,
  err: err,
  complete: complete,
  closed: closed
}));

behave(Subject);

var _cell, _sharing, _subject, _sharing2, _fromPromise;

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
var c = (_sharing = sharing, _cell = cell, function sharing(_argPlaceholder) {
  return _sharing(_argPlaceholder, _cell);
}),
    s = (_sharing2 = sharing, _subject = subject, function sharing(_argPlaceholder2) {
  return _sharing2(_argPlaceholder2, _subject);
});
function collect(cell) {
  return function (value) {
    var _value, _$conj, _ref;

    //return observer
    _.swap(cell, (_ref = _, _$conj = _ref.conj, _value = value, function conj(_argPlaceholder3) {
      return _$conj.call(_ref, _argPlaceholder3, _value);
    }));
  };
}

function connect2(source, sink) {
  return sub$5(source, sink);
}

function connect3(source, xform, sink) {
  return sub$5(pipe(source, xform), sink);
}

function connectN(source) {
  var sink = arguments[arguments.length - 1],
      xforms = _.slice(arguments, 1, arguments.length - 1);

  return sub$5(pipe.apply(void 0, [source].concat(_toConsumableArray(xforms))), sink);
}

ISubscribe.transducing = connect3;
var connect = _.overload(null, null, connect2, connect3, connectN); //returns `unsub` fn

var map = _.comp(c, Observable.map);
var then = _.comp(c, Observable.resolve, Observable.map);
var fromElement = _.comp(c, Observable.fromElement);
var fromEvent = _.comp(s, Observable.fromEvent);
var event = _.called(fromEvent, "`event` is deprecated — use `fromEvent` instead.");
var interact = _.called(fromElement, "`interact` is deprecated — use `fromElement` instead.");
var computed = _.comp(c, Observable.computed);
var fixed = _.comp(c, Observable.fixed);
var latest = _.comp(c, Observable.latest);
var splay = _.comp(c, Observable.splay);
var tick = _.comp(s, Observable.tick);
var when = _.comp(c, Observable.when);
var depressed = _.comp(c, Observable.depressed);
var toggles = _.comp(c, Observable.toggles);
var focus = _.comp(c, Observable.focus);
var click = _.comp(s, Observable.click);
var hover = _.comp(c, Observable.hover);
var hist = _.comp(c, Observable.hist);
var hash = _.comp(c, Observable.hash);
var hashchange = _.called(hash, "`hashchange` is deprecated — use `hash` instead.");
var readonly = _.called(_.identity, "`readonly` is deprecated.");

function fmap(source, f) {
  return map(f, source);
}

_.each(_.implement(_.IFunctor, {
  fmap: fmap
}), [Cell, Subject, Observable]);

function fromPromise2(promise, init) {
  return share(Observable.fromPromise(promise), cell(init));
}

var fromPromise = _.overload(null, (_fromPromise = fromPromise2, function fromPromise2(_argPlaceholder4) {
  return _fromPromise(_argPlaceholder4, null);
}), fromPromise2);
var join = _.called(function join(sink) {
  for (var _len = arguments.length, sources = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    sources[_key - 1] = arguments[_key];
  }

  return share(_.merge.apply(_, sources), sink);
}, "`join` is deprecated — use `merge` instead."); //enforce sequential nature of operations

function isolate(f) {
  //TODO treat operations as promises
  var queue = [];
  return function () {
    var ready = queue.length === 0;
    queue.push(arguments);

    if (ready) {
      while (queue.length) {
        var args = _.first(queue);

        try {
          f.apply(null, args);
          trigger(args[0], "mutate", {
            bubbles: true
          });
        } finally {
          queue.shift();
        }
      }
    }
  };
}

function mutate3(self, state, f) {
  sub$5(state, _.partial(isolate(f), self));
  return self;
}

function mutate2(state, f) {
  var _state, _f, _mutate;

  return _mutate = mutate3, _state = state, _f = f, function mutate3(_argPlaceholder5) {
    return _mutate(_argPlaceholder5, _state, _f);
  };
}

var mutate = _.called(_.overload(null, null, mutate2, mutate3), "`mutate` is deprecated — use `render` instead.");

function render3(el, obs, f) {
  return sub$5(obs, t.isolate(), function (state) {
    f(el, state);
    trigger(el, "mutate", {
      bubbles: true
    }); //TODO rename
  });
}

function render2(state, f) {
  var _state2, _f2, _render;

  return _render = render3, _state2 = state, _f2 = f, function render3(_argPlaceholder6) {
    return _render(_argPlaceholder6, _state2, _f2);
  };
}

var render = _.overload(null, null, render2, render3);

function renderDiff3(el, obs, f) {
  return sub$5(obs, t.isolate(), t.hist(2), function (history) {
    var args = [el].concat(history);
    f.apply(this, args); //overload arity 2 & 3 for initial and diff rendering

    trigger(el, "mutate", {
      bubbles: true
    }); //TODO rename
  });
}

function renderDiff2(state, f) {
  var _state3, _f3, _renderDiff;

  return _renderDiff = renderDiff3, _state3 = state, _f3 = f, function renderDiff3(_argPlaceholder7) {
    return _renderDiff(_argPlaceholder7, _state3, _f3);
  };
} //TODO replace render after migration


var renderDiff = _.overload(null, null, renderDiff2, renderDiff3);

(function () {

  function pub(self, msg) {
    self(msg);
  }

  _.doto(Function, ireduce, //makes fns work as observers like `cell`, e.g. `$.connect($.tick(3000), _.see("foo"))`
  _.implement(IPublish, {
    pub: pub,
    err: _.noop,
    complete: _.noop,
    closed: _.noop
  }));
})();

export { Cell, Cursor, IEvented, IPublish, ISubscribe, Journal, Observable, Observer, Subject, broadcast, cell, click, closed$3 as closed, collect, complete$3 as complete, computed, connect, cursor, depressed, err$3 as err, event, fixed, focus, fromElement, fromEvent, fromPromise, hash, hashchange, hist, hover, interact, join, journal, latest, map, mutate, observable, observer, off, on, one, pipe, pub$3 as pub, readonly, render, renderDiff, seed, share, sharing, splay, sub$5 as sub, subject, subscribed$4 as subscribed, then, tick, toObservable, toggles, trigger, unsub$4 as unsub, when };
