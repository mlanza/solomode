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

async function thr(id){
  return _.fmap(
    fetch(`https://boardgamegeek.com/xmlapi2/thread?id=${id}`),
    repos.text,
    parse,
    function(data){
      const id = _.getIn(data, ["root", "attributes", "id"]);
      const children = _.getIn(data, ["root", "children"]);
      const subject = _.just(children, _.detect(_.contains(_, "name", "subject"), _), _.get(_, "content"));
      const articles = _.just(children, _.detect(_.contains(_, "name", "articles"), _), _.get(_, "children"), _.mapa(function(article){
        const attributes = _.getIn(article, ["attributes"]);
        const children = _.getIn(article, ["children"]);
        const subject = _.just(children, _.detect(_.contains(_, "name", "subject"), _), _.get(_, "content"));
        const body = _.just(children, _.detect(_.contains(_, "name", "body"), _), _.get(_, "content"), Html5Entities.decode, _.trim); //, _.replace(_, /\<br\/\>/g, "\n"), _.split(_, "\n"));
        //const play = _.just(body, _.reFind(/^(LIKE|LOVE|LUMP)/, _), _.nth(_, 1)) || null;
        return _.merge(attributes, {
          subject,
          body
        });
      }, _), _.take(5, _), _.toArray);
      return {
        id,
        subject,
        articles
      };
    })
}

const getThreads = _.pipe(
  _.getIn(_, ["root", "children"]),
  _.filtera(_.contains(_, "name", "item"), _),
  _.mapcat(_.get(_, "children"), _),
  _.filtera(_.contains(_, "name", "body"), _),
  _.mapa(_.get(_, "content"), _),
  _.mapa(_.reFind(/\[thread=(\d*)\]|thread\/(\d*)\//g, _), _),
  _.mapa(function(match){
    return match ? _.nth(match, 1) || _.nth(match, 2) : null;
  }, _),
  _.compact,
  _.mapa(parseInt, _),
  _.take(5, _),
  _.mapa(thr, _),
  Promise.all.bind(Promise));

function it(item){
  const attributes = _.just(item, _.get(_, "attributes"));
  const body = _.just(item, _.get(_, "children"), _.detect(_.contains(_, "name", "body"), _), _.get(_, "content"));
  return _.merge(attributes, {body});
}

async function gl(id){
  return _.fmap(
    fetch(`https://www.boardgamegeek.com/xmlapi/geeklist/${id}`),
    repos.text,
    parse,
    function(data){
      const type = "geeklist";
      const attributes = _.getIn(data, ["root", "attributes"]);
      const children = _.getIn(data, ["root", "children"]);
      const title = _.just(children, _.detect(_.contains(_, "name", "title"), _), _.get(_, "content"));
      const items = _.just(children, _.filtera(_.contains(_, "name", "item"), _), _.take(5, _), _.mapa(it, _), _.toArray);
      return _.merge(attributes, {
        type,
        title,
        items
      });

    });
}


//const json = await _.fmap(thr(2541022), _.log)


//const json = await _.fmap(gl(289682), _.tee(_.log));
const json = await _.fmap(gl(278904), _.tee(_.log));

//const resp = await fetch("https://www.boardgamegeek.com/xmlapi/thread/381021"); //"https://www.boardgamegeek.com/xmlapi/geeklist/289682") ;//"https://www.boardgamegeek.com/xmlapi/thread/2548153");
//const xml = await resp.text();


throw new Error("Whoa!");

/*
  Comments which must be added to the submissions geeklist prior to processing:

  DISQUALIFIED - rules violation
  WITHDRAWN - no longer participating
  MINIMUM PLAYING TIME = n - as determined by looking to the rules PDF

*/


var delay = 0, GAP = 700;

function request(url, options){
  delay += GAP; //stagger to avoid overwhelming server
  return new Promise(function(resolve, reject){
    setTimeout(function retrieve(){
      setTimeout(function(){
        _.fork(fetch(url, options || {}), retrieve, resolve);
      }, GAP)
    }, delay);
  })
}

//get submissions
function submissions(params){
  return _.fmap(request("https://boardgamegeek.com/xmlapi/geeklist/" + params.id + "/?comments=1"), repos.xml);
}

function players(items){
  return _.just(items, _.mapcat(_.get(_, "plays"), _), _.toArray, _.groupBy(_.get(_, "username"), _), _.reducekv(function(memo, player, plays){
    return _.conj(memo, {username: player, plays: plays, score: _.just(plays, _.map(_.get(_, "score"), _), _.sum), solomodes: _.just(plays, _.map(_.getIn(_, ["topic", "id"]), _), _.unique), earliest: _.just(plays, _.map(_.get(_, "postdate"), _), _.sort, _.first)});
  }, [], _));
}

function plays(items){
  return _.just(items, _.mapcat(function(item){
    return _.map(function(play){
      return {id: item.id, game: {id: item.objectid, objectname: item.objectname}, username: item.username, tallyword: play.tallyword, player: play.username, postdate: play.postdate, edited: play.edited, score: play.score};
    }, item.plays);
  }, _), _.sort(_.asc(_.get(_, "postdate")), _), _.toArray);
}

function units(minutes){
  return Math.round(minutes / 30);
}

/*function minplaytimes(ids){
  return _.fmap(request("https://boardgamegeek.com/xmlapi2/thing?type=boardgame&id=" + _.join(",", ids)), repos.xml, function(el){
    return _.reduce(function(memo, id){
      var minutes = _.maybe(el, dom.sel1("item[id=\"" + id +"\"] minplaytime", _), dom.attr(_, "value"), _.blot, parseInt)
      return _.assoc(memo, id, minutes);
    }, {}, ids);
  });
}*/

function addminplaytimes(items){
  return _.fmap(_.just(items, _.mapa(_.get(_, "objectid"), _), _.unique, minplaytimes), function(times){
    return _.mapa(function(item){
      var minplaytime = item.minimum || times[item.objectid];
      return _.merge(item, {minplaytime: minplaytime, playunits: units(minplaytime)});
    }, items);
  });
}

//tabulate results
function tabulate(params){
  return _.fmap(submissions(params), function(doc){
    var title = _.just(doc, dom.sel1("title", _), dom.text),
        username = _.just(doc, dom.sel1("username", _), dom.text);
    return _.just(doc, dom.sel("item", _),
      _.mapa(_.partial(item, params), _),
      _.filter(function(item){
        return params.selected(item.objectname);
      }, _),
      addminplaytimes,
      //Promise.resolve.bind(Promise),
      _.fmap(_, Promise.all.bind(Promise),
      _.filtera(params.timelyRegistration, _),
      params.unsifted ? _.identity : _.remove(_.get(_, "disqualified"), _),
      params.unsifted ? _.identity : _.remove(_.get(_, "withdrawn"), _),
    function(items){
      var authors = _.sort(_.unique(_.mapa(_.get(_, "username"), items)));
      return {
        title: title,
        host: username,
        authors: authors,
        items: items
      }
    },
    function(data){
      return _.fmap(Promise.all(_.mapa(_.partial(addthread, params, data.authors), data.items)),
        _.assoc({}, "items", _),
        _.merge(data, _));
    },
    function(data){
      var _played = _.just(data.items, _.filter(_.getIn(_, ["plays", "length"]), _), _.sort(_.desc(_.get(_, "score")), _.desc(_.getIn(_, ["players", "length"])), _.desc(_.getIn(_, ["plays", "length"])), _.asc(_.get(_, "earliest")), _)),
          _players = _.just(data.items, players, _.sort(_.desc(_.get(_, "score")), _.desc(_.getIn(_, ["solomodes", "length"])), _.desc(_.getIn(_, ["plays", "length"])), _.asc(_.get(_, "earliest")), _)),
          _plays = plays(_played),
          _unlinked = _.filtera(_.complement(_.get(_, "articles")), data.items),
          _reportedPlayed = reportPlayed(_played),
          _reportedPlayers = reportPlayers(_players),
          _reportedPlays = reportPlays(_plays);
      return _.merge(data, {
        played: _played,
        plays: _plays,
        players: _players,
        unlinked: _unlinked,
        reports: [
          _reportedPlayed,
          _reportedPlayers,
          _reportedPlays
        ]
      });
    }));
  });
}

var strip = _.just(_, _.replace(_, /\[[a-z]+\=[a-z0-9 _]+\]/gi, ""), _.replace(_, /\[\/[a-z]+\]/gi, "")),
    len = _.just(_, strip, _.get(_, "length"));

function rpad(n){
  return function(text){
    return text + _.rpad("", n - len(text));
  }
}

function lpad(n){
  return function(text){
    return _.lpad("", n - len(text)) + text;
  }
}

function underline(len){
  return _.lpad("", len, "-");
}

function tag(label){
  return _.collapse(_.str("[", label, "]"), _, _.str("[/", label, "]"));
}

var u = tag("u"),
    b = tag("b"),
    c = tag("c");

function render(title, columns){
  return function(rows){
    var cols = _.mapa(function(col){
      return col(rows);
    }, columns);
    return _.just(rows, _.mapa(function(row){
        return _.join("  ", _.map(function(col){
          return col.justify(row);
        }, cols));
      }, _),
      _.cons(_.just(cols, _.map(_.get(_, "underline"), _), _.join("  ", _)), _),
      _.cons(_.just(cols, _.map(_.get(_, "heading"), _), _.join("  ", _)), _),
      _.cons(_.just(title, b, u), _),
      _.join("\n", _));
  }
}

function column(key, heading, pad){
  return function(rows){
    var width = _.max(heading.length, _.just(rows, _.map(_.comp(len, _.str, _.get(_, key)), _), _.spread(_.max)));
    var pads = pad(width);
    return {
      width: width,
      heading: pads(heading),
      underline: underline(width),
      justify: _.pipe(_.get(_, key), pads)
    }
  }
}

var dt = _.fmt(_.pipe(_.month, _.inc, _.lpad(_, 2, "0")), "-", _.pipe(_.day, _.lpad(_, 2, "0")));

var reportPlayed =
  _.pipe(
    _.mapIndexed(function(idx, item){
      return {
        pos: idx + 1,
        username: "[user=" + item.username + "]" + item.username + "[/user]",
        submission: item.objectid ? "[thing=" + item.objectid + "]" + item.objectname + "[/thing] ([thread=" + item.id + "]" + item.id + "[/thread])" : "",
        plays: _.str(item.plays.length),
        players: _.str(item.players.length),
        score: _.str(item.score),
        earliest: dt(item.earliest)
      }
    }, _),
    render("SOLO MODE SCOREBOARD", [
      column("pos", "#", lpad),
      column("username", "Author", rpad),
      column("submission", "Submission", rpad),
      column("score", "VP", lpad),
      column("players", "Peeps", lpad),
      column("plays", "Plays", lpad),
      column("earliest", "Date", rpad)]));

var reportPlayers =
  _.pipe(
    _.mapIndexed(function(idx, item){
      var score = _.just(item.plays, _.map(_.get(_, "score"), _), _.sum);
      return {
        pos: idx + 1,
        username: "[user=" + item.username + "]" + item.username + "[/user]",
        score: _.str(score),
        solomodes: _.str(item.solomodes.length),
        plays: _.str(item.plays.length),
        earliest: dt(item.earliest)
      }
    }, _),
    render("PLAYER SCOREBOARD", [
      column("pos", "#", lpad),
      column("username", "Player", rpad),
      column("score", "VP", lpad),
      column("solomodes", "Games", lpad),
      column("plays", "Plays", lpad),
      column("earliest", "Date", rpad)]));

var reportPlays =
  _.pipe(
    _.map(function(item){
      return {
        username: "[user=" + item.username + "]" + item.username + "[/user]",
        submission: item.game.id ? "[thing=" + item.game.id + "]" + item.game.objectname + "[/thing] ([thread=" + item.id + "]" + item.id + "[/thread])" : "",
        player: "[user=" + item.player + "]" + item.player + "[/user]",
        tallyword: item.tallyword,
        score: _.str(item.score),
        postdate: dt(item.postdate)
      }
    }, _),
    render("REGISTERED PLAYS", [
      column("username", "Author", rpad),
      column("submission", "Submission", rpad),
      column("player", "Player", rpad),
      column("tallyword", "Vote", rpad),
      column("score", "VP", lpad),
      column("postdate", "Date", rpad)]));

function minplaytimes(ids){
  return _.fmap(request("https://boardgamegeek.com/xmlapi2/thing?type=boardgame&id=" + _.join(",", ids)), repos.xml, function(el){
    return _.reduce(function(memo, id){
      var minutes = _.maybe(el, dom.sel1("item[id=\"" + id +"\"] minplaytime", _), dom.attr(_, "value"), _.blot, parseInt)
      return _.assoc(memo, id, minutes);
    }, {}, ids);
  });
}

function has(word){
  return function(text){
    return _.includes(_.split(text, "\n"), word);
  }
}

//get the contest submission
function item(params, el){
  var subtype = dom.attr(el, "subtype"),
      id = _.just(el, dom.attr(_ ,"id"), parseInt),
      objectid = _.just(el, dom.attr(_ ,"objectid"), parseInt),
      objectname = dom.attr(el, "objectname"),
      username = dom.attr(el, "username"),
      postdate = _.date(dom.attr(el, "postdate")),
      body = _.just(el, dom.sel1("body", _), dom.text),
      comments = _.reverse(_.mapa(dom.text, dom.sel("comment", el))),
      minimum = _.maybe(comments, _.detect(_.includes(_, "MINIMUM PLAYING TIME"), _), _.reFind(/MINIMUM PLAYING TIME[ ]?=[ ]?(\d+)/, _), _.nth(_, 1), _.blot, parseInt),
      disqualified = _.detect(has("DISQUALIFIED"), comments),
      withdrawn = _.detect(has("WITHDRAWN"), comments);
  return {
    subtype: subtype,
    id: id,
    minimum: minimum,
    withdrawn: !!withdrawn,
    disqualified: !!disqualified,
    objectid: objectid,
    objectname: objectname,
    username: username,
    postdate: postdate,
    body: body
  };
}

function addthread(params, authors, item){
  return _.fmap(_.just(item.body, _.reFind(/\[thread=(\d+)\]|\[.*url=.*\/thread\/(\d+)\/.+\]/, _), _.drop(1, _), _.compact, _.first, parseInt, _.partial(thread, params, item, authors)), _.merge({_game: item.objectname}, item, _));
}

function unbiased(username){
  return function(article){
    return article.username !== username;
  }
}

var tallyword = _.reFind(/^(LIKE|LOVE|LUMP)\s*$/m, _);
var stripMarkup = _.just(_, _.replace(_, /\<br[\/]?\>/g, "\n"), _.replace(_, /(\<[a-z0-9]*\>|\<\/[a-z0-9]*\>)/g, ""));

function tally(plays){
  var SCORE_PER_PLAY = 1, NEW_PLAYER_BONUS = 4, EARLY_ADOPTER_BONUS = NEW_PLAYER_BONUS - 1;
  return _.reduce(function(memo, play){
    var newPlayer = !_.includes(memo.players, play.username),
        bonus = newPlayer ? NEW_PLAYER_BONUS + memo.earlyadopter : 0,
        score = SCORE_PER_PLAY + bonus;
    return _.just(memo, newPlayer ? _.update(_, "earlyadopter", _.comp(_.max(0, _), _.dec)) : _.identity, _.update(_, "plays", _.conj(_, _.merge(play, {score: score}))), newPlayer ? _.update(_, "players", _.conj(_, play.username)) : _.identity);
  }, {earlyadopter: EARLY_ADOPTER_BONUS, plays: [], players: []}, plays);
}

//get the votes for the submission
function thread(params, topic, authors, id){
  return id ? _.fmap(request("https://boardgamegeek.com/xmlapi2/thread?id=" + id), repos.xml, function(el){
    var subject = _.just(el, dom.sel1("subject", _), dom.text),
        articles = _.just(el, dom.sel("article", _), _.mapa(function(el){
          var id = _.just(el, dom.attr(_, "id"), parseInt),
              username = dom.attr(el, "username"),
              postdate = _.maybe(el, dom.attr(_, "postdate"), _.blot, _.date),
              editdate = _.maybe(el, dom.attr(_, "editdate"), _.blot, _.date),
              body = _.just(el, dom.sel1("body", _), dom.text, stripMarkup);

          var item = params.simulate({
            id: id,
            topic: topic,
            subject: subject,
            username: username,
            postdate: postdate,
            editdate: editdate,
            body: body
          });

          var firstline = _.just(item.body, _.split(_, "\n"), _.first);

          return _.merge(item, {
            edited: _.eq(postdate, editdate) ? null : editdate,
            firstline: firstline,
            tallyword: _.nth(tallyword(firstline), 1) || null
          });
        }, _)),
        tallied = _.just(
          articles,
          _.filtera(
            _.and(
              _.get(_, "tallyword"),
              params.timelyPlay,
              unbiased(topic.username)),
          _),
          tally),
        plays = _.get(tallied, "plays"),
        players = _.get(tallied, "players"),
        score = _.just(plays, _.map(_.get(_, "score"), _), _.sum),
        earliest = _.maybe(plays, _.first, _.get(_, "postdate"));
    return {
      id: id,
      subject: subject,
      articles: articles,
      players: players,
      plays: plays,
      score: score,
      earliest: earliest
    };
  }) : null;
}

function timelyPlay(start, end){
  return function(item){
    return item.postdate > start && item.postdate < end;
  }
}

function timelyRegistration(end){
  return function(item){
    return item.postdate < end;
  }
}

throw new Error("Doh!");


_.fmap(tabulate({
  unsifted: 0,
  id: 278904,
  simulate: _.identity,
  selected: _.constantly(true), //_.includes(["Catan"], _),
  timelyPlay: timelyPlay(_.date("2021-02-01T05:00:00.000Z"), _.date("2021-03-01T05:00:00.000Z")),
  timelyRegistration: timelyRegistration(_.date("2021-01-02T05:00:00.000Z"))
}), function(data){
  dom.html(document.body, _.just(data.reports, _.join("\n\n", _), c));
  window.results = data;
  _.log(data);
});
