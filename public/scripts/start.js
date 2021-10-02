import * as _core from "atomic/core";
import * as _reactives from "atomic/reactives";
import * as _transducers from "atomic/transducers";
import * as _repos from "atomic/repos";
import {parse} from "https://deno.land/x/ts_xml_parser/mod.ts"
import {Html5Entities} from "https://raw.githubusercontent.com/matschik/deno_html_entities/master/mod.js";

const core = Object.assign({}, _core);
const _ = Object.assign(core.placeholder, core.impart(core, core.partly));
const $ = _.impart(Object.assign({}, _reactives), _.partly);
const t = _.impart(Object.assign({}, _transducers), _.partly);
const repos = _.impart(Object.assign({}, _repos), _.partly);

function unfold(json){
  return JSON.stringify(json, null, 2);
}

function unformat(text){
  return _.just(text, _.replace(_, /\<br\/\>/g, "\n"), _.replace(_, /\<b\>|\<\/b\>|\<i\>|\<\/i\>|\[b\]|\[\/b\]|\[i\]|\[\/i\]/g, ""));
}

function minPlayingTime(text){
  return _.maybe(text, _.reFind(/Playing Time: (\d*)(-\d*)|MINIMUM PLAYING TIME = (\d*)/i, _), _.drop(1, _), _.filter(_.isSome, _), _.first, parseInt);
}

const decode = _.pipe(Html5Entities.decode, _.trim, unformat);

function request(url, options){
  function retrieve(tries, resolve, reject){
    reject = _.called(reject, "reject");
    _.fork(_.fmap(fetch(url, options || {}), repos.text, parse), function(ex){
      setTimeout(function(){
        tries < 10 ? retrieve(tries + 1, resolve, reject) : reject(ex);
      }, tries * 1000);
    }, resolve);
  }
  return new Promise(_.partial(retrieve, 1));
}

function thread(id){
  return _.fmap(request(`https://boardgamegeek.com/xmlapi2/thread?id=${id}`), function(data){
    const id = _.getIn(data, ["root", "attributes", "id"]);
    const children = _.getIn(data, ["root", "children"]);
    const subject = _.just(children, _.detect(_.contains(_, "name", "subject"), _), _.get(_, "content"));
    const articles = _.just(children, _.detect(_.contains(_, "name", "articles"), _), _.get(_, "children"), _.mapa(function(article){
      const attributes = _.getIn(article, ["attributes"]);
      const postdate = _.date(attributes.postdate);
      const editdate = _.date(attributes.editdate);
      const children = _.getIn(article, ["children"]);
      const subject = _.just(children, _.detect(_.contains(_, "name", "subject"), _), _.get(_, "content"));
      const body = _.just(children, _.detect(_.contains(_, "name", "body"), _), _.get(_, "content"), decode);
      return _.merge(attributes, {
        postdate,
        editdate,
        subject,
        body
      });
    }, _), _.toArray);
    return {
      id,
      subject,
      articles
    };
  })
}

function thing(id){
  return _.fmap(request(`https://boardgamegeek.com/xmlapi2/thing?id=${id}`), function(data){
    const item = _.first(data.root.children);
    const name = _.just(item.children, _.detect(_.contains(_, "name", "name"), _), _.get(_, "attributes"), _.get(_, "value"));
    return _.merge(item.attributes, {name});
  });
}

function geeklist(id){
  return _.fmap(request(`https://www.boardgamegeek.com/xmlapi/geeklist/${id}?comments=1`), function(data){
    const type = "geeklist";
    const attributes = _.getIn(data, ["root", "attributes"]);
    const children = _.getIn(data, ["root", "children"]);
    const title = _.just(children, _.detect(_.contains(_, "name", "title"), _), _.get(_, "content"));
    const items = _.just(children, _.filtera(_.contains(_, "name", "item"), _), _.mapa(function item(item){
      const attributes = _.just(item, _.get(_, "attributes"));
      const body = _.just(item, _.get(_, "children"), _.detect(_.contains(_, "name", "body"), _), _.get(_, "content"), decode);
      const comments = _.just(item, _.get(_, "children"), _.filtera(_.contains(_, "name", "comment"), _), _.mapa(function(comment){
        const body = _.just(comment.content, decode);
        return _.merge(comment.attributes, {body});
      }, _));
      return _.merge(attributes, {body, comments});
    }, _));
    return _.merge(attributes, {type, title, items});
  });
}

function getMeta(gl){
  const items = _.just(gl, _.get(_, "items"), _.map(function(item){
    if (item.objecttype == "thread") {
      const thread = _.maybe(item.objectid, parseInt);
      const thing = _.just(item.comments,
        _.filter(_.contains(_, "username", "mlanza"), _),
        _.map(_.opt(_.get(_, "body"), _.reFind(/thing=(\d*)/, _), _.nth(_, 1), parseInt), _),
        _.compact,
        _.first);
      const contents =_.mapa(decode, _.cons(item.body, _.map(_.get(_, "body"), item.comments)));
      const mpt = _.just(contents, _.map(minPlayingTime, _), _.compact, _.first);
      return {thread, thing, mpt, contents, item};
    } else {
      const found = _.reFind(/\[thread=(\d*)\]|thread\/(\d*)\//g, item.body);
      const thread = _.maybe(found[1] || found[2], _.blot ,parseInt);
      const thing = _.maybe(item.objectid, parseInt);
      const contents = _.mapa(decode, _.cons(item.body, _.mapcat(_.pipe(_.get(_, "body"), _.split(_, /\n|\r/)), item.comments)));
      const mpt = _.just(contents, _.map(minPlayingTime, _), _.compact, _.first);
      return {thread, thing, mpt, contents, item};
    }
  }, _), _.filtera(_.get(_, "mpt"), _));
  return _.merge(gl, {items});
}

function explode(gl){
  const threads = _.just(gl.items, _.mapa(_.get(_, "thread"), _), _.compact, _.mapa(thread, _), Promise.all.bind(Promise));
  const things = _.just(gl.items, _.mapa(_.get(_, "thing"), _), _.compact, _.mapa(thing, _), Promise.all.bind(Promise));
  return _.fmap(Promise.all([threads, things]), _.spread(function(threads, things){
    const threadsIdx = _.index(_.get(_, "id"), _.identity, threads);
    const thingsIdx = _.index(_.get(_, "id"), _.identity, things);
    const items = _.mapa(function(item){
      const thread = _.get(threadsIdx, item.thread);
      const thing = _.get(thingsIdx, item.thing);
      return _.merge(item, {thread, thing});
    }, gl.items);
    return _.merge(gl, {items});
  }));
}

function timelyPlay(start, end){
  return _.update(_, "items", _.mapa(_.updateIn(_, ["thread", "articles"], _.filtera(function(article){
    return article.postdate > start && article.postdate < end;
  }, _)), _));
}

const ignoreMine = _.update(_, "items", _.mapa(function(item){
  const username = item.item.username;
  return _.updateIn(item, ["thread", "articles"], _.filtera(function(article){
    return article.username !== username;
  }, _));
}, _));

function less(path, limit){
  return limit ? _.updateIn(_, path, _.pipe(_.take(limit, _), _.toArray)) : _.identity;
}

function perPlayBonus(eligibleList, min){
  return function(data){
    const id = data.id;
    const eligible = eligibleList(id);
    const items = _.mapa(function(item){
      return _.merge(item, {ppb: item.mpt >= min ? 1 : 0});
    }, data.items);
    return _.merge(data, {items});
  }
}

function plays(gl){
  const play = _.pipe(_.reFind(/^(LIKE|LOVE|LUMP)(\n|$)/, _), _.nth(_, 1));
  const items = _.mapa(function(item){
    const articles = item.thread.articles;
    const plays = _.just(articles, _.filtera(_.pipe(_.get(_, "body"), play), _), _.mapa(function(article){
      const recorded = _.maybe(article.body, play);
      return _.merge(article, {recorded});
    }, _), _.partial(score, item.ppb || 0));
    return _.merge(item, {plays});
  }, gl.items);
  return _.merge(gl, {items});
}

function score(ppb, plays){
  const players = _.just(plays, _.map(_.get(_, "username"), _), _.unique);
  return _.just(plays,
    _.map(_.assoc(_, "points", [1 + ppb]), _), //base score per play
    _.reduce(function({players, bonus, plays}, play){
      const player = _.get(play, "username");
      const newblood = _.includes(players, player);
      const _players = _.omit(players, player);
      const _bonus = newblood && bonus > 4 ? bonus - 1 : bonus;
      const _play = newblood ? _.update(play, "points", _.conj(_, bonus)) : play;
      return {players: _players, bonus: _bonus, plays: _.conj(plays, _play)};
    }, {players, bonus: 7, plays: []}, _),
    _.get(_, "plays"));
}

function select(what, ids){
  return _.seq(ids) ? function(gl){
    const items = _.filtera(function(item){
      return _.includes(ids, _.get(item, what));
    }, gl.items);
    return _.merge(gl, {items});
  } : _.identity;
}

const parseArgs = _.pipe(_.reduce(function({args, latest}, value){
  if (_.startsWith(value, "-")) {
    const word = _.replace(value, /^\-/, "");
    return {args, latest: word};
  } else {
    return {args: _.update(args, latest, _.pipe(_.conj(_, value), _.toArray)), latest};
  }
}, {args: {}, latest: null}, _), _.get(_, "args"));

const args = parseArgs(Deno.args);
const year = _.maybe(args, _.get(_, "year"), _.first, parseInt);
const ids = year ? _.get({2020: [278904], 2021: [289677, 289678, 289679, 289680, 289681, 289682]}, year) : _.just(args, _.get(_, "gl"), _.mapa(parseInt, _));
const threads = _.maybe(args, _.get(_, "thread"), _.mapa(parseInt, _)) || [];
const limit = _.maybe(args, _.get(_, "limit"), _.first, parseInt);

 //-year 2020 -thread 2554285
const lists = await _.just(ids,
  _.mapa(
    _.pipe(
      geeklist,
      _.fmap(_,
        getMeta,
        perPlayBonus(_.eq(289680, _), 180),
        select("thread", threads),
        less(["items"], limit),
        explode,
        ignoreMine,
        timelyPlay(_.date("2021-02-01T05:00:00.000Z"), _.date("2021-03-01T05:00:00.000Z")),
        plays)),
  _),
  Promise.all.bind(Promise),
  _.fmap(_, unfold));

_.log(lists);
