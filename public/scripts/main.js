require(['atomic/core', 'atomic/dom', 'atomic/reactives', 'atomic/transducers', 'atomic/repos'], function(_, dom, $, t, repos){

  //rankings
  var byScore = _.desc(_.get(_, "score")),
      byPlays = _.desc(_.get(_, "plays"));

  //get the registrations from the geeklist
  function geeklist(params){
    var registered = _.date(params.registered);
    function promptRegistration(item){
      return item.postdate < registered;
    }
    return _.fmap(fetch("https://boardgamegeek.com/xmlapi/geeklist/" + params.id + "/?comments=1"), repos.xml, function(doc){
      var title = _.just(doc, dom.sel1("title", _), dom.text),
          username = _.just(doc, dom.sel1("username", _), dom.text);
      return _.fmap(_.just(doc, dom.sel("item", _), _.mapa(_.partial(item, params), _), _.filter(function(item){
        return !item.disqualified;
      }, _), function(items){
        return Promise.all(items);
      }), _.filtera(promptRegistration, _), function(items){
        var voters = _.just(items, _.mapcat(_.get(_, "votes"), _), _.groupBy(_.get(_, "username"), _)),
            contestants = _.unique(_.mapa(_.get(_, "username"), items));
        return {
          contestants: contestants,
          voters: voters,
          title: title,
          host: username,
          items: items,
          accolades: {
            devotion: _.sort(byScore, byPlays, items),
            plays: _.sort(byPlays, items)
          }
        };
      });
    });
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
        comments = dom.sel("comment", el),
        clamped = !!_.detect(function(el){
          return _.includes(dom.text(el), "CLAMPED");
        }, comments),
        disqualified = !!_.detect(function(el){
          return _.includes(dom.text(el), "DISQUALIFIED");
        }, comments),
        eligibility = _.just([clamped ? "clamp" : null, objectid == params.hill ? "hill" : null], _.compact, _.toArray);
    return _.fmap(_.just(body, _.reFind(/\[thread=(\d+)\]|\[.*url=.+\/thread\/(\d+)\/.+\]/, _), _.drop(1, _), _.compact, _.first, _.partial(thread, params, {id: id, objectid: objectid, objectname: objectname})), _.merge({
      subtype: subtype,
      id: id,
      disqualified: disqualified,
      objectid: objectid,
      objectname: objectname,
      eligibility: eligibility,
      username: username,
      postdate: postdate,
      body: body
    }, _));
  }

  function voted(article){
    return article.vote //&& !article.edited;
  }

  var scored = _.get({"LIKE": 1.0, "LUMP": 0.75, "LOVE": 1.25}, _);

  function loved(article){
    return article.vote == "LOVE";
  }

  function fakevote(){
    return _.get({0: "LIKE", 1: "LUMP", 2: "LOVE"}, _.randInt(3));
  }

  //get the votes for the submission
  function thread(params, topic, id){
    var start = _.date(params.start),
        end = _.date(params.end);
    function timelyVote(article){
      return article.postdate > start && article.postdate < end;
    }
    return id ? _.fmap(fetch("https://boardgamegeek.com/xmlapi2/thread?id=" + id), repos.xml, function(el){
      var subject = _.just(el, dom.sel1("subject", _), dom.text),
          articles = _.just(el, dom.sel("article", _), _.mapa(function(el){
            var id = _.just(el, dom.attr(_, "id"), parseInt),
                username = dom.attr(el, "username"),
                postdate = _.maybe(el, dom.attr(_, "postdate"), _.blot, _.date),
                editdate = _.maybe(el, dom.attr(_, "editdate"), _.blot, _.date),
                body = params.fake == 1 ? fakevote() : _.just(el, dom.sel1("body", _), dom.text),
                found = _.reFind(/^(LIKE|LOVE|LUMP)(.*\((\d+) minutes\))?/, body),
                vote = _.nth(found, 1),
                score = _.maybe(vote, scored),
                minutes = _.maybe(found, _.nth(_, 3), _.blot, parseInt),
                edited = _.eq(postdate, editdate) ? null : editdate;
            return {
              id: id,
              subject: subject,
              username: username,
              postdate: postdate,
              editdate: editdate,
              edited: edited,
              body: body,
              vote: vote,
              score: score,
              minutes: minutes,
              topic: topic
            };
          }, _)),
          votes = _.filtera(_.and(timelyVote, voted), articles),
          voters = _.unique(_.map(_.get(_, "username"), votes)),
          plays = _.count(votes),
          loves = _.count(_.filter(loved, articles)),
          score = _.just(votes, _.map(_.get(_, "score"), _), _.sum),
          earliest = _.maybe(votes, _.first, _.get(_, "postdate"));
      return {
        subject: subject,
        articles: articles,
        earliest: earliest,
        loves: loves,
        plays: plays,
        voters: voters,
        votes: votes,
        score: score
      };
    }) : null;
  }

  var params = _.fromQueryString(location.href);

  //http://localhost:8080/?fake=1&id=278904&hill=13&registered=2021-01-02T05:00:00.000Z&start=2021-02-01T05:00:00.000Z&end=2021-03-01T05:00:00.000Z
  _.fmap(geeklist(params), _.log);

});