require(['atomic/core', 'atomic/dom', 'atomic/reactives', 'atomic/transducers', 'atomic/repos'], function(_, dom, $, t, repos){

  //rankings
  var byScore = _.desc(_.get(_, "score")),
      byPlays = _.desc(_.getIn(_, ["plays", "length"])),
      byPlayers = _.desc(_.comp(_.count, _.get(_, "voters"))),
      byEarliest = _.desc(_.get(_, "earliest")),
      byLoved = _.desc(_.getIn(_, ["loves", "length"]));

  //get submissions
  function submissions(params){
    return _.fmap(fetch("https://boardgamegeek.com/xmlapi/geeklist/" + params.id + "/?comments=1"), repos.xml);
  }

  //tabulate results
  function tabulate(params){
    var registered = _.date(params.registered);
    function cutoff(item){
      return item.postdate < registered;
    }
    return _.fmap(submissions(params), function(doc){
      var title = _.just(doc, dom.sel1("title", _), dom.text),
          username = _.just(doc, dom.sel1("username", _), dom.text);
      return _.fmap(_.just(doc, dom.sel("item", _), _.mapa(_.partial(item, params), _), Promise.all.bind(Promise)), _.remove(_.get(_, "disqualified"), _), _.filtera(cutoff, _), function(items){
        var voters = _.just(items, _.mapcat(_.get(_, "votes"), _), _.groupBy(_.get(_, "username"), _), _.reducekv(function(memo, voter, votes){
              return _.conj(memo, {username: voter, votes: votes});
            }, [], _)),
            contestants = _.unique(_.mapa(_.get(_, "username"), items));
        return {
          host: username,
          title: title,
          contestants: contestants,
          voters: voters,
          items: items,
          accolades: accolades(items, voters, contestants)
        };
      });
    });
  }

  //determine the date a threshold was reached
  function threshold(num, dt, max){
    return function(item){
      var total = 0;
      for(var vote of item.votes) {
        total += vote[num];
        if (total >= max) {
          return vote[dt];
        }
      }
      return null;
    }
  }

  //rank outcomes
  function accolades(items, voters, contestants){
    var clamped = _.filtera(_.comp(_.includes(_, "clamp"), _.get(_, "eligibility")), items),
        hill = _.just(items, _.filtera(_.comp(_.includes(_, "hill"), _.get(_, "eligibility")), _), entrants(3)),
        centennial = _.filtera(_.comp(_.gte(_, 100), _.get(_, "score")), items),
        quarters = _.filtera(_.comp(_.gte(_, 25), _.getIn(_, ["votes", "length"])), items),
        dimes = _.filtera(_.comp(_.gte(_, 10), _.getIn(_, ["votes", "length"])), items);
    return { //TODO add tiebreakers
      devotion: _.sort(byScore, items),
      plays: _.sort(byPlays, items),
      players: _.sort(byPlayers, items),
      clamped: _.sort(byScore, clamped),
      kingofthehill: _.sort(byScore, hill),
      loved: _.sort(byLoved, items),
      mvps: _.sort(_.desc(_.getIn(_, ["votes", "length"])), _.asc(_.getIn(_, ["votes", 0, "postdate"])), voters),
      centennial: _.sort(_.asc(threshold("score", "postdate", 100)), centennial),
      quarters: _.sort(_.asc(_.comp(_.get(_, "postdate"), _.last, _.take(25, _), _.get(_, "votes"))), quarters),
      dimes: _.sort(_.asc(_.comp(_.get(_, "postdate"), _.last, _.take(10, _), _.get(_, "votes"))), dimes)
    }
  }

  //set minimum number of entrants for category
  function entrants(min){
    return function(items){
      return items.length >= min ? items : [];
    }
  }

  function minplaytime(id){
    return _.fmap(fetch("https://boardgamegeek.com/xmlapi2/thing?id=" + id), repos.xml, _.maybe(_, dom.sel1("minplaytime", _), dom.attr(_, "value"), _.blot, parseInt));
  }

  function units(minutes){
    return Math.round(minutes / 30);
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
        comments = _.mapa(dom.text, dom.sel("comment", el)),
        clamped = _.detect(_.includes(_, "CLAMPED"), comments),
        disqualified = _.detect(_.includes(_, "DISQUALIFIED"), comments),
        minimum = _.maybe(comments, _.detect(_.includes(_, "MINIMUM PLAYING TIME"), _), _.reFind(/MINIMUM PLAYING TIME\=(\d+)/, _), _.nth(_, 1), _.blot, parseInt),
        eligibility = _.just([clamped ? "clamp" : null, objectid == params.hill ? "hill" : null], _.compact, _.toArray);
    return _.fmap(minplaytime(objectid), function(minplaytime){
      var playunits = units(minimum || minplaytime);
      return _.fmap(_.just(body, _.reFind(/\[thread=(\d+)\]|\[.*url=.*\/thread\/(\d+)\/.+\]/, _), _.drop(1, _), _.compact, _.first, _.partial(thread, params, {id: id, objectid: objectid, objectname: objectname, playunits: playunits, username: username})), _.merge({
        subtype: subtype,
        id: id,
        disqualified: !!disqualified,
        minplaytime: minimum || minplaytime,
        playunits: playunits,
        objectid: objectid,
        objectname: objectname,
        eligibility: eligibility,
        username: username,
        postdate: postdate,
        body: body
      }, _));
    });
  }

  function voted(article){
    return article.vote && !article.edited;
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
    function other(article){
      return article.username !== topic.username;
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
              score: score * topic.playunits,
              minutes: minutes,
              topic: topic
            };
          }, _)),
          votes = _.just(articles, _.filtera(_.and(timelyVote, voted, other), _)), //TODO filter out excess contestant votes
          voters = _.unique(_.map(_.get(_, "username"), votes)),
          loves = _.just(votes, _.filtera(loved, _), _.groupBy(_.get(_, "username"), _), _.vals, _.mapa(_.first, _)),
          score = _.just(votes, _.map(_.get(_, "score"), _), _.sum),
          earliest = _.maybe(votes, _.first, _.get(_, "postdate"));
      return {
        subject: subject,
        articles: articles,
        earliest: earliest,
        loves: loves,
        voters: voters,
        votes: votes,
        score: score
      };
    }) : null;
  }

  var params = _.fromQueryString(location.href);

  //http://localhost:8080/?fake=1&id=278904&hill=13&registered=2021-01-02T05:00:00.000Z&start=2021-02-01T05:00:00.000Z&end=2021-03-01T05:00:00.000Z
  _.fmap(tabulate(params), _.log);

});