define(['exports', 'atomic/core', 'set'], function (exports, _$1, Set$1) { 'use strict';

  Set$1 = Set$1 && Set$1.hasOwnProperty('default') ? Set$1['default'] : Set$1;

  var IPersistent = _$1.protocol({
    persistent: null
  });

  var ITransient = _$1.protocol({
    "transient": null
  });

  var ITransientCollection = _$1.protocol({
    conj: null
  });

  var ITransientEmptyableCollection = _$1.protocol({
    empty: null
  });

  var ITransientAssociative = _$1.protocol({
    assoc: null
  });

  var ITransientMap = _$1.protocol({
    dissoc: null
  });

  var ITransientSet = _$1.protocol({
    disj: null
  });

  var ITransientAppendable = _$1.protocol({
    append: null
  });

  var ITransientPrependable = _$1.protocol({
    prepend: null
  });

  var ITransientYankable = _$1.protocol({
    yank: null
  });

  var ITransientInsertable = _$1.protocol({
    before: null,
    after: null
  });

  var ITransientReversible = _$1.protocol({
    reverse: null
  });

  var persistent = IPersistent.persistent;

  var _transient = ITransient["transient"];

  var assoc = ITransientAssociative.assoc;

  var dissoc = ITransientMap.dissoc;

  var disj = ITransientSet.disj;

  var conj = _$1.overload(null, _$1.noop, ITransientCollection.conj, _$1.doing(ITransientCollection.conj));

  var empty = ITransientEmptyableCollection.empty;

  var append = _$1.overload(null, _$1.noop, ITransientAppendable.append, _$1.doing(ITransientAppendable.append));

  var prepend = _$1.overload(null, _$1.noop, ITransientPrependable.prepend, _$1.doing(ITransientPrependable.prepend, _$1.reverse));

  var yank = ITransientYankable.yank;

  function afterN(self) {
    var ref = self;

    for (var _len = arguments.length, els = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      els[_key - 1] = arguments[_key];
    }

    while (els.length) {
      var el = els.shift();
      ITransientInsertable.after(ref, el);
      ref = el;
    }
  }

  var after = _$1.overload(null, _$1.noop, ITransientInsertable.after, afterN);

  function beforeN(self) {
    var ref = self;

    for (var _len2 = arguments.length, els = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      els[_key2 - 1] = arguments[_key2];
    }

    while (els.length) {
      var el = els.pop();
      ITransientInsertable.before(ref, el);
      ref = el;
    }
  }

  var before = _$1.overload(null, _$1.noop, ITransientInsertable.before, beforeN);

  var reverse = ITransientReversible.reverse;

  function TransientArray(arr) {
    this.arr = arr;
  }
  function transientArray(arr) {
    return new TransientArray(arr);
  }

  function before$1(self, reference, inserted) {
    var pos = self.arr.indexOf(reference);
    pos === -1 || self.arr.splice(pos, 0, inserted);
  }

  function after$1(self, reference, inserted) {
    var pos = self.arr.indexOf(reference);
    pos === -1 || self.arr.splice(pos + 1, 0, inserted);
  }

  function seq(self) {
    return self.arr.length ? self : null;
  }

  function append$1(self, value) {
    self.arr.push(value);
  }

  function prepend$1(self, value) {
    self.arr.unshift(value);
  }

  function empty$1(self) {
    self.arr = [];
  }

  function reverse$1(self) {
    self.arr.reverse();
  }

  function assoc$1(self, idx, value) {
    self.arr[idx] = value;
  }

  function dissoc$1(self, idx) {
    self.arr.splice(idx, 1);
  }

  function yank$1(self, value) {
    var pos;

    while ((pos = self.arr.indexOf(value)) > -1) {
      self.arr.splice(pos, 1);
    }
  }

  function persistent$1(self) {
    var arr = self.arr;
    delete self.arr;
    return arr;
  }

  var forward = _$1.forwardTo("arr");
  var find = forward(_$1.IFind.find);
  var key = forward(_$1.IMapEntry.key);
  var val = forward(_$1.IMapEntry.val);
  var contains = forward(_$1.IAssociative.contains);
  var keys$1 = forward(_$1.IMap.keys);
  var vals = forward(_$1.IMap.vals);
  var toObject = forward(_$1.ICoerceable.toObject);
  var lookup = forward(_$1.ILookup.lookup);
  var reduce = forward(_$1.IReduce.reduce);
  var reducekv = forward(_$1.IKVReduce.reducekv);
  var fmap = forward(_$1.IFunctor.fmap);
  var includes = forward(_$1.IInclusive.includes);
  var count = forward(_$1.ICounted.count);
  var first = forward(_$1.ISeq.first);
  var rest = forward(_$1.ISeq.rest);
  var next = forward(_$1.INext.next);
  var behaveAsTransientArray = _$1.does(_$1.implement(_$1.ISequential), _$1.implement(IPersistent, {
    persistent: persistent$1
  }), _$1.implement(_$1.ISeqable, {
    seq: seq
  }), _$1.implement(_$1.ISeq, {
    first: first,
    rest: rest
  }), _$1.implement(_$1.INext, {
    next: next
  }), _$1.implement(_$1.ICounted, {
    count: count
  }), _$1.implement(ITransientInsertable, {
    before: before$1,
    after: after$1
  }), _$1.implement(ITransientCollection, {
    conj: append$1
  }), _$1.implement(ITransientEmptyableCollection, {
    empty: empty$1
  }), _$1.implement(_$1.IFind, {
    find: find
  }), _$1.implement(ITransientYankable, {
    yank: yank$1
  }), _$1.implement(_$1.IMapEntry, {
    key: key,
    val: val
  }), _$1.implement(_$1.ILookup, {
    lookup: lookup
  }), _$1.implement(_$1.IAssociative, {
    contains: contains
  }), _$1.implement(ITransientAssociative, {
    assoc: assoc$1
  }), _$1.implement(ITransientReversible, {
    reverse: reverse$1
  }), _$1.implement(ITransientMap, {
    dissoc: dissoc$1
  }), _$1.implement(_$1.IMap, {
    keys: keys$1,
    vals: vals
  }), _$1.implement(_$1.ICoerceable, {
    toObject: toObject
  }), _$1.implement(_$1.IReduce, {
    reduce: reduce
  }), _$1.implement(_$1.IKVReduce, {
    reducekv: reducekv
  }), _$1.implement(ITransientAppendable, {
    append: append$1
  }), _$1.implement(ITransientPrependable, {
    prepend: prepend$1
  }), _$1.implement(_$1.IFunctor, {
    fmap: fmap
  }));

  behaveAsTransientArray(TransientArray);

  function TransientObject(obj) {
    this.obj = obj;
  }
  function transientObject(obj) {
    return new TransientObject(obj);
  }

  function conj$1(self, entry) {
    var key = _$1.IMapEntry.key(entry),
        val = _$1.IMapEntry.val(entry);
    self.obj[key] = val;
  }

  function dissoc$2(self, key) {
    if (contains$1(self, key)) {
      delete self.obj[key];
    }
  }

  function assoc$2(self, key, value) {
    if (!contains$1(self, key) || !_$1.IEquiv.equiv(lookup$1(self, key), value)) {
      self.obj[key] = value;
    }
  }

  function clone(self) {
    return transientObject(_$1.ICloneable.clone(self.obj));
  }

  function compare(a, b) {
    return _$1.IComparable.compare(a.obj, b == null ? null : b.obj);
  }

  function equiv(a, b) {
    return _$1.IEquiv.equiv(a.obj, b == null ? null : b.obj);
  }

  function toObject$1(self) {
    return self.obj;
  }

  function empty$2(self) {
    self.obj = {};
  }

  function persistent$2(self) {
    var obj = self.obj;
    delete self.obj;
    return obj;
  }

  var forward$1 = _$1.forwardTo("obj");
  var keys$2 = forward$1(_$1.IMap.keys);
  var vals$1 = forward$1(_$1.IMap.vals);
  var matches = forward$1(_$1.IMatchable.matches);
  var find$1 = forward$1(_$1.IFind.find);
  var includes$1 = forward$1(_$1.IInclusive.includes);
  var lookup$1 = forward$1(_$1.ILookup.lookup);
  var first$1 = forward$1(_$1.ISeq.first);
  var rest$1 = forward$1(_$1.ISeq.rest);
  var next$1 = forward$1(_$1.INext.next);
  var contains$1 = forward$1(_$1.IAssociative.contains);
  var seq$1 = forward$1(_$1.ISeqable.seq);
  var count$1 = forward$1(_$1.ICounted.count);
  var reduce$1 = forward$1(_$1.IReduce.reduce);
  var reducekv$1 = forward$1(_$1.IKVReduce.reducekv);
  var toArray = forward$1(_$1.ICoerceable.toArray);
  var behaveAsTransientObject = _$1.does(_$1.implement(_$1.IDescriptive), _$1.implement(IPersistent, {
    persistent: persistent$2
  }), _$1.implement(ITransientCollection, {
    conj: conj$1
  }), _$1.implement(_$1.IComparable, {
    compare: compare
  }), _$1.implement(ITransientEmptyableCollection, {
    empty: empty$2
  }), _$1.implement(_$1.ICoerceable, {
    toArray: toArray,
    toObject: toObject$1
  }), _$1.implement(_$1.IFn, {
    invoke: lookup$1
  }), _$1.implement(_$1.IReduce, {
    reduce: reduce$1
  }), _$1.implement(_$1.IKVReduce, {
    reducekv: reducekv$1
  }), _$1.implement(_$1.ICounted, {
    count: count$1
  }), _$1.implement(_$1.ICloneable, {
    clone: clone
  }), _$1.implement(_$1.ISeqable, {
    seq: seq$1
  }), _$1.implement(_$1.ISeq, {
    first: first$1,
    rest: rest$1
  }), _$1.implement(_$1.INext, {
    next: next$1
  }), _$1.implement(_$1.IFind, {
    find: find$1
  }), _$1.implement(_$1.ILookup, {
    lookup: lookup$1
  }), _$1.implement(_$1.IAssociative, {
    contains: contains$1
  }), _$1.implement(ITransientAssociative, {
    assoc: assoc$2
  }), _$1.implement(_$1.IInclusive, {
    includes: includes$1
  }), _$1.implement(_$1.IEquiv, {
    equiv: equiv
  }), _$1.implement(_$1.IMap, {
    keys: keys$2,
    vals: vals$1
  }), _$1.implement(ITransientMap, {
    dissoc: dissoc$2
  }), _$1.implement(_$1.IMatchable, {
    matches: matches
  }));

  behaveAsTransientObject(TransientObject);

  var TransientSet = Set$1;
  function transientSet(entries) {
    return new TransientSet(entries || []);
  }
  function emptyTransientSet() {
    return new TransientSet();
  }

  function seq$2(self) {
    return count$2(self) ? self : null;
  }

  function empty$3(self) {
    self.clear();
  }

  function disj$1(self, value) {
    self["delete"](value);
  }

  function includes$2(self, value) {
    return self.has(value);
  }

  function conj$2(self, value) {
    self.add(value);
  }

  function first$2(self) {
    return self.values().next().value;
  }

  function rest$2(self) {
    var iter = self.values();
    iter.next();
    return _$1.lazyIterable(iter);
  }

  function next$2(self) {
    var iter = self.values();
    iter.next();
    return _$1.lazyIterable(iter, null);
  }

  function count$2(self) {
    return self.size;
  }

  var toArray$1 = Array.from;

  function clone$1(self) {
    return transientSet(toArray$1(self));
  }

  function reduce$2(self, xf, init) {
    var memo = init;
    var coll = seq$2(self);

    while (coll) {
      memo = xf(memo, first$2(coll));
      coll = next$2(coll);
    }

    return _$1.unreduced(memo);
  }

  var behaveAsTransientSet = _$1.does(_$1.implement(_$1.ISequential), _$1.implement(ITransientCollection, {
    conj: conj$2
  }), _$1.implement(ITransientSet, {
    disj: disj$1
  }), //TODO unite
  _$1.implement(_$1.IReduce, {
    reduce: reduce$2
  }), _$1.implement(_$1.ICoerceable, {
    toArray: toArray$1
  }), _$1.implement(_$1.ISeqable, {
    seq: seq$2
  }), _$1.implement(_$1.IInclusive, {
    includes: includes$2
  }), _$1.implement(_$1.ICloneable, {
    clone: clone$1
  }), _$1.implement(ITransientEmptyableCollection, {
    empty: empty$3
  }), _$1.implement(_$1.ICounted, {
    count: count$2
  }), _$1.implement(_$1.INext, {
    next: next$2
  }), _$1.implement(_$1.ISeq, {
    first: first$2,
    rest: rest$2
  }));

  behaveAsTransientSet(TransientSet);

  function Method(pred, f) {
    this.pred = pred;
    this.f = f;
  }
  function method(pred, f) {
    return new Method(pred, f);
  }

  function invoke(self, args) {
    return _$1.apply(self.f, args);
  }

  function matches$1(self, args) {
    return _$1.apply(self.pred, args);
  }

  var behaveAsMethod = _$1.does(_$1.implement(_$1.IMatchable, {
    matches: matches$1
  }), _$1.implement(_$1.IFn, {
    invoke: invoke
  }));

  behaveAsMethod(Method);

  function surrogate(f, substitute) {
    return function (self) {
      for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      f.apply(null, [substitute].concat(args));
      return self;
    };
  }

  function Multimethod(methods, fallback) {
    this.methods = methods;
    this.fallback = fallback;
  }
  function multimethod(fallback) {
    var instance = new Multimethod([], fallback),
        fn = _$1.partial(_$1.IFn.invoke, instance),
        conj = surrogate(ITransientCollection.conj, instance);
    return _$1.doto(fn, _$1.specify(ITransientCollection, {
      conj: conj
    }));
  }

  function conj$3(self, method) {
    self.methods.push(method);
  }

  function invoke$1(self) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var method = _$1.detect(function (_arg) {
      return _$1.matches(_arg, args);
    }, self.methods);

    if (method) {
      return _$1.IFn.invoke(method, args);
    } else if (self.fallback) {
      return self.fallback.apply(self, args);
    } else {
      throw new Error("No handler for these args.");
    }
  }

  var behaveAsMultimethod = _$1.does(_$1.implement(_$1.IFn, {
    invoke: invoke$1
  }), _$1.implement(ITransientCollection, {
    conj: conj$3
  }));

  behaveAsMultimethod(Multimethod);

  function toTransient(Type, construct) {
    function _transient(self) {
      return construct(_$1.clone(self));
    }

    _$1.doto(Type, _$1.implement(ITransient, {
      "transient": _transient
    }));
  }

  toTransient(Object, transientObject);
  toTransient(Array, transientArray);
  toTransient(Set$1, transientSet);
  function withMutations(self, f) {
    return IPersistent.persistent(f(ITransient["transient"](self)));
  }

  exports.withMutations = withMutations;
  exports.IPersistent = IPersistent;
  exports.ITransient = ITransient;
  exports.ITransientCollection = ITransientCollection;
  exports.ITransientEmptyableCollection = ITransientEmptyableCollection;
  exports.ITransientAssociative = ITransientAssociative;
  exports.ITransientMap = ITransientMap;
  exports.ITransientSet = ITransientSet;
  exports.ITransientAppendable = ITransientAppendable;
  exports.ITransientPrependable = ITransientPrependable;
  exports.ITransientYankable = ITransientYankable;
  exports.ITransientInsertable = ITransientInsertable;
  exports.ITransientReversible = ITransientReversible;
  exports.persistent = persistent;
  exports.transient = _transient;
  exports.assoc = assoc;
  exports.dissoc = dissoc;
  exports.disj = disj;
  exports.conj = conj;
  exports.empty = empty;
  exports.append = append;
  exports.prepend = prepend;
  exports.yank = yank;
  exports.after = after;
  exports.before = before;
  exports.reverse = reverse;
  exports.TransientArray = TransientArray;
  exports.transientArray = transientArray;
  exports.TransientObject = TransientObject;
  exports.transientObject = transientObject;
  exports.TransientSet = TransientSet;
  exports.transientSet = transientSet;
  exports.emptyTransientSet = emptyTransientSet;
  exports.Method = Method;
  exports.method = method;
  exports.Multimethod = Multimethod;
  exports.multimethod = multimethod;

  Object.defineProperty(exports, '__esModule', { value: true });

});
