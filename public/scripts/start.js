import * as _core from "atomic/core";
import * as _reactives from "atomic/reactives";
import * as _transducers from "atomic/transducers";
import * as _transients from "atomic/transients";
import * as _repos from "atomic/repos";
import {parse} from "https://deno.land/x/ts_xml_parser/mod.ts"
//import parse from "https://denopkg.com/nekobato/deno-xml-parser/index.ts";
import {Html5Entities} from "https://raw.githubusercontent.com/matschik/deno_html_entities/master/mod.js";

const core = Object.assign({}, _core);
const _ = Object.assign(core.placeholder, core.impart(core, core.partly));
const reactives = Object.assign({}, _reactives);
const $ = core.impart(reactives, core.partly);
const transducers = Object.assign({}, _transducers);
const t = core.impart(transducers, core.partly)
const transients = Object.assign({}, _transients);
const mut = core.impart(transients, core.partly)
const _repos_ = Object.assign({}, _repos);
const repos = core.impart(_repos_, core.partly)


function unfold(json){
  return JSON.stringify(json, null, 2);
}

function unformat(text){
  return _.just(text, _.replace(_, /\<br\/\>/g, "\n"), _.replace(_, /\<b\>|\<\/b\>|\<i\>|\<\/i\>/g, ""));
}

function minPlayingTime(text){
  return _.maybe(text, _.reFind(/Playing Time: (\d*)(-\d*)|MINIMUM PLAYING TIME = (\d*)/i, _), _.drop(1, _), _.filter(_.isSome, _), _.first, parseInt);
}

const decode = _.pipe(Html5Entities.decode, _.trim, unformat);

function request(url, options){
  return new Promise(function(resolve, reject){
    setTimeout(function retrieve(){
      setTimeout(function(){
        _.fork(_.fmap(fetch(url, options || {}), repos.text, parse), retrieve, resolve);
      }, 500)
    }, 10);
  })
}

function thread(id){
  return _.fmap(request(`https://boardgamegeek.com/xmlapi2/thread?id=${id}`), function(data){
    const id = _.getIn(data, ["root", "attributes", "id"]);
    const children = _.getIn(data, ["root", "children"]);
    const subject = _.just(children, _.detect(_.contains(_, "name", "subject"), _), _.get(_, "content"));
    const articles = _.just(children, _.detect(_.contains(_, "name", "articles"), _), _.get(_, "children"), _.mapa(function(article){
      const attributes = _.getIn(article, ["attributes"]);
      const children = _.getIn(article, ["children"]);
      const subject = _.just(children, _.detect(_.contains(_, "name", "subject"), _), _.get(_, "content"));
      const body = _.just(children, _.detect(_.contains(_, "name", "body"), _), _.get(_, "content"), decode);
      return _.merge(attributes, {
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
      const contents = _.toArray(_.cons(item.body, _.map(_.get(_, "body"), item.comments)));
      const mpt = _.just(contents, _.map(minPlayingTime, _), _.compact, _.first);
      return {thread, thing, mpt, contents, item};
    } else {
      const found = _.reFind(/\[thread=(\d*)\]|thread\/(\d*)\//g, item.body);
      const thread = _.maybe(found[1] || found[2], _.blot ,parseInt);
      const thing = _.maybe(item.objectid, parseInt);
      const contents = _.toArray(_.cons(item.body, _.mapcat(_.pipe(_.get(_, "body"), _.split(_, "\n")), item.comments)));
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

function less(path, limit){
  return _.updateIn(_, path, _.pipe(_.take(limit, _), _.toArray));
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

const gl = _.pipe(geeklist,
  _.fmap(_,
    getMeta,
    perPlayBonus(_.eq(289680, _), 180),
    select("thread", [2552978]),
    //less(["items"], 3),
    explode,
    plays));

function gls(id){ //geeklist of geeklists, per Solomode 2021
  return _.fmap(
    geeklist(id),
    _.pipe(_.get(_, "items"),
    _.mapa(_.pipe(_.get(_, "objectid"), gl), _)),
    Promise.all.bind(Promise));
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

 //TODO create article ranger
 //TODO add per play bonus for geeklist 289680 if mpt >= 180

//const json = await _.fmap(geeklist(289682), getMeta, explode, unfold, _.tee(_.log));
//const json = await _.fmap(gls(289676), _.mapcat(_.get(_, "items"), _), _.toArray, _.tee(_.log)); //Solomode 2021 line up
function select(what, ids){
  return function(gl){
    const items = _.filtera(function(item){
      return _.includes(ids, _.get(item, what));
    }, gl.items);
    return _.merge(gl, {items});
  }
}
//await _.fmap(thread(2554285), /*_.getIn(_, ["root", "children"]), _.mapcat(_.get(_, "children"), _), _.toArray,*/  _.tee(_.log));
await _.fmap(gl(278904), _.get(_, "items"), _.mapa(_.get(_, "plays"), _), _.tee(_.log));
