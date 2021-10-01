import * as _core from "atomic/core";
import * as _reactives from "atomic/reactives";
import * as _transducers from "atomic/transducers";
import * as _repos from "atomic/repos";
import {parse} from "https://deno.land/x/ts_xml_parser@1.0.0/mod.ts";
import {Html5Entities} from "https://raw.githubusercontent.com/matschik/deno_html_entities/master/mod.js";

const core = Object.assign({}, _core);
const _ = Object.assign(core.placeholder, core.impart(core, core.partly));
const reactives = Object.assign({}, _reactives);
const $ = core.impart(reactives, core.partly);
const transducers = Object.assign({}, _transducers);
const t = core.impart(transducers, core.partly)
const _repos_ = Object.assign({}, _repos);
const repos = core.impart(_repos_, core.partly)

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
      const body = _.just(children, _.detect(_.contains(_, "name", "body"), _), _.get(_, "content"), Html5Entities.decode, _.trim); //, _.replace(_, /\<br\/\>/g, "\n"), _.split(_, "\n"));
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
      const body = _.just(item, _.get(_, "children"), _.detect(_.contains(_, "name", "body"), _), _.get(_, "content"));
      const comments = _.just(item, _.get(_, "children"), _.filtera(_.contains(_, "name", "comment"), _), _.mapa(function(comment){
        const body = comment.content;
        return _.merge(comment.attributes, {body});
      }, _));
      return _.merge(attributes, {body, comments});
    }, _));
    return _.merge(attributes, {type, title, items});
  });
}

function getMeta(gl){
  const items = _.just(gl, _.get(_, "items"), _.mapa(function(item){
    if (item.objecttype == "thread") {
      const thread = _.maybe(item.objectid, parseInt);
      const thing = _.just(item.comments,
        _.filter(_.contains(_, "username", "mlanza"), _),
        _.map(_.opt(_.get(_, "body"), _.reFind(/thing=(\d*)/, _), _.nth(_, 1), parseInt), _),
        _.compact,
        _.first);
      return {thread, thing, item};
    } else {
      const found = _.reFind(/\[thread=(\d*)\]|thread\/(\d*)\//g, item.body);
      const thread = _.maybe(found[1] || found[2], _.blot ,parseInt);
      const thing = _.maybe(item.objectid, parseInt);
      return {thread, thing, item};
    }
  }, _));
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

const gl = _.pipe(geeklist, _.fmap(_, getMeta, explode));

function gls(rootid){ //geeklist of geeklists, per Solomode 2021
  return _.fmap(
    geeklist(rootid),
    _.pipe(_.get(_, "items"),
    _.mapa(_.pipe(_.get(_, "objectid"), gl), _)),
    Promise.all.bind(Promise));
}

function plays(gl, start, stop){ //TODO implement start/stop
  const play = _.reFind(/^(LIKE|LOVE|LUMP)/, _);
  const items = _.mapa(function(item){
    const articles = item.thread.articles;
    const plays = _.just(articles, _.filtera(_.pipe(_.get(_, "body"), play), _), _.mapa(function(article){
      const recorded = _.maybe(article.body, play, _.nth(_, 1));
      return _.merge(article, {recorded});
    }, _));
    return _.merge(item, {plays});
  }, gl.items);
  return _.merge(gl, {items});
}


//const json = await _.fmap(geeklist(289682), getMeta, explode, _.tee(_.log));
//const json = await _.fmap(gls(289676), _.mapcat(_.get(_, "items"), _), _.toArray, _.tee(_.log)); //Solomode 2021 line up
const json = await _.fmap(geeklist(278904), getMeta, less(["items"], 2), explode, plays, _.tee(_.log));
