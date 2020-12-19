require(['atomic/core', 'atomic/dom', 'atomic/reactives', 'atomic/transducers', 'atomic/repos'], function(_, dom, $, t, repos){

  /*
    Comments which must be added to the submissions geeklist prior to processing:

    DISQUALIFIED - rules violation
    CLAMPED - eligible for The Clamp
    MINIMUM PLAYING TIME=n - as determined by looking to the rules PDF

  */

  var delay = 0;

  function request(url, options){
    delay += 600; //stagger to avoid overwhelming server
    return new Promise(function(resolve, reject){
      setTimeout(function(){
        _.fork(fetch(url, options || {}), reject, resolve);
      }, delay);
    })
  }

  //get submissions
  function submissions(params){
    return _.fmap(request("https://boardgamegeek.com/xmlapi/geeklist/" + params.id + "/?comments=1"), repos.xml);
  }

  function addminplaytimes(items){
    return _.fmap(_.just(items, _.mapa(_.get(_, "objectid"), _), _.unique, minplaytimes), function(times){
      return _.mapa(function(item){
        var minplaytime = item.minimum || times[item.objectid];
        return _.merge(item, {minplaytime: minplaytime, playunits: units(minplaytime)});
      }, items);
    });
  }

  function voters(items){
    return _.just(items, _.mapcat(_.get(_, "votes"), _), _.groupBy(_.get(_, "username"), _), _.reducekv(function(memo, voter, votes){
      return _.conj(memo, {username: voter, votes: votes});
    }, [], _));
  }

  function deadline(registered){
    return function(item){
      return item.postdate < registered;
    }
  }

  //tabulate results
  function tabulate(params){
    return _.fmap(submissions(params), function(doc){
      var title = _.just(doc, dom.sel1("title", _), dom.text),
          username = _.just(doc, dom.sel1("username", _), dom.text);
      return _.just(doc, dom.sel("item", _), _.mapa(_.partial(item, params), _), addminplaytimes, _.fmap(_, Promise.all.bind(Promise), _.filtera(deadline(_.date(params.registered)), _), _.remove(_.get(_, "disqualified"), _), function(items){
        var contestants = _.unique(_.mapa(_.get(_, "username"), items));
        return {
          title: title,
          host: username,
          contestants: contestants,
          items: items
        }
      }, function(data){
        return _.fmap(Promise.all(_.mapa(_.partial(addthread, params, data.contestants), data.items)),
          _.assoc({}, "items", _),
          _.merge(data, _));
      }, function(data){
        var _voters = voters(data.items),
            _accolades = accolades(data.items, _voters, data.contestants),
            _ranked = rank(ranked, _accolades),
            _positions = positions(_ranked),
            _monospace = monospace(_positions);
        return _.merge(data, {
          voters: _voters,
          accolades: _accolades,
          ranked: _ranked,
          positions: _positions,
          monospace: _monospace
        });
      }));
    });
  }

  //rankings
  var byScore = _.desc(_.get(_, "score")),
      byPlays = _.desc(_.getIn(_, ["plays", "length"])),
      byPlayers = _.desc(_.comp(_.count, _.get(_, "voters"))),
      byLoved = _.desc(_.getIn(_, ["loves", "length"])),
      byFastestCentennial = _.asc(threshold("score", "postdate", 100)),
      byFastestQuarter = _.asc(_.comp(_.get(_, "postdate"), _.last, _.take(25, _), _.get(_, "votes"))),
      byFastestDime = _.asc(_.comp(_.get(_, "postdate"), _.last, _.take(10, _), _.get(_, "votes"))),
      byFastestVote = _.desc(_.get(_, "earliest"));

  //accolade eligibility?
  function accolades(items, voters, contestants){
    var clamped = _.filtera(_.comp(_.includes(_, "clamp"), _.get(_, "eligibility")), items),
        hill = _.just(items, _.filtera(_.comp(_.includes(_, "hill"), _.get(_, "eligibility")), _), entrants(3)),
        centennials = _.filtera(_.comp(_.gte(_, 100), _.get(_, "score")), items),
        quarters = _.filtera(_.comp(_.gte(_, 25), _.getIn(_, ["votes", "length"])), items),
        dimes = _.filtera(_.comp(_.gte(_, 10), _.getIn(_, ["votes", "length"])), items);
    return {
      devotion: _.just(items, _.sort(byScore, byPlays, byPlayers, byLoved, byFastestCentennial, byFastestQuarter, byFastestDime, byFastestVote, _)),
      plays: _.just(items, _.sort(byPlays, byScore, byPlayers, byLoved, byFastestCentennial, byFastestQuarter, byFastestDime, byFastestVote, _)),
      players: _.just(items, _.sort(byPlayers, byScore, byPlays, byLoved, byFastestCentennial, byFastestQuarter, byFastestDime, byFastestVote, _)),
      clamped: _.just(clamped, _.sort(byScore, byPlays, byPlayers, byLoved, byFastestCentennial, byFastestQuarter, byFastestDime, byFastestVote, _)),
      kingofthehill: _.just(hill, _.sort(byScore, byPlays, byPlayers, byLoved, byFastestCentennial, byFastestQuarter, byFastestDime, byFastestVote, _)),
      loved: _.just(items, _.sort(byLoved, byScore, byPlays, byPlayers, byFastestCentennial, byFastestQuarter, byFastestDime, byFastestVote, _)),
      mvp: _.just(voters, _.sort(_.desc(_.getIn(_, ["votes", "length"])), _.asc(_.getIn(_, ["votes", 0, "postdate"])), _)),
      centennial: _.sort(byFastestCentennial, byScore, byPlays, byPlayers, byLoved, byFastestQuarter, byFastestDime, byFastestVote, centennials),
      quarter: _.sort(byFastestQuarter, byScore, byPlays, byPlayers, byLoved, byFastestCentennial, byFastestDime, byFastestVote, quarters),
      dime: _.sort(byFastestDime, byScore, byPlays, byPlayers, byLoved, byFastestCentennial, byFastestQuarter, byFastestVote, dimes)
    }
  }

  //ranked from better to worse
  var ranked = [
    {accolade: "devotion", limit: 2},
    {accolade: "plays", limit: 2},
    {accolade: "players", limit: 2},
    {accolade: "clamped", limit: 2},
    {accolade: "kingofthehill", limit: 2},
    {accolade: "loved", limit: 2},
    {accolade: "mvp", limit: 2},
    {accolade: "centennial"},
    {accolade: "quarter"},
    {accolade: "dime"}
  ]

  function rank(ranked, accolades){
    return _.toArray(_.mapcat(function(ranking){
      return _.just(accolades, _.get(_, ranking.accolade), ranking.limit ? _.take(ranking.limit, _) : _.identity, _.mapa(_.merge(_, {accolade: ranking.accolade}), _), _.mapIndexed(function(idx, item){
        return _.merge(item, {idx: idx});
      }, _));
    }, ranked));
  }

  //rank users and list their accolades
  function positions(items){
    return _.just(items, _.mapa(_.get(_, "username"), _), _.unique, _.reduce(function(memo, username){
      return _.conj(memo, {username: username, accolades: _.just(items, _.filter(function(item){
        return item.username == username;
      }, _), _.sort(_.asc(_.get(_, "id")), _), _.toArray)});
    }, [], _));
  }

  function desc(type, idx){
    var title = _.get({
      "devotion": "Most Devotion",
      "clamped": "Clamped Award",
      "kingofthehill": "King of the Hill",
      "loved": "Most Loved",
      "players": "Most Players",
      "plays": "Most Played",
      "mvp": "Most Valuable Player",
      "centennial": "Centennial",
      "quarter": "Quarter",
      "dime": "Dime"
    }, type);
    switch(type){
      case "devotion":
      case "clamped":
      case "kingofthehill":
      case "loved":
      case "plays":
      case "players":
      case "mvp":
        return (title || type) + (idx === 0 ? "" : " Runner Up");
      default:
        var pos = _.get({
          0: "1st",
          1: "2nd",
          2: "3rd",
          3: "4th",
          4: "5th",
          5: "6th",
          6: "7th",
          7: "8th",
          8: "9th",
          9: "10th"
        }, idx);
        return pos + " " + (title || type);
    }
  }

  function stats(type, accolade){
    switch(type){
      case "devotion":
      case "clamped":
      case "kingofthehill":
      case "centennial":
        return accolade.score + " Score";
      case "loved":
        return accolade.loves.length + " Players";
      case "plays":
      case "mvp":
      case "quarter":
      case "dime":
        return accolade.votes.length + " Plays";
      case "players":
        return accolade.voters.length + " Players";
    }
  }

  function monospace(positions){
    var strip = _.just(_, _.replace(_, /\[[a-z]+\=[a-z0-9]+\]/gi, ""), _.replace(_, /\[\/[a-z]+\]/gi, "")),
        len = _.just(_, strip, _.get(_, "length"));
    function pad(n){
      return function(text){
        return text + _.rpad("", n - len(text));
      }
    }
    function underline(text){
      return _.just(text, len, _.lpad("", _, "-"));
    }
    return _.just(positions, _.mapcat(function(position){
      return _.mapIndexed(function(idx, accolade){
        return {
          username: idx == 0 ? "[user=" + position.username + "]" + position.username + "[/user]" : "",
          submission: accolade.objectid ? "[thing=" + accolade.objectid + "]" + accolade.objectname + "[/thing] ([thread=" + accolade.id + "]" + accolade.id + "[/thread])" : "",
          accolade: desc(accolade.accolade, accolade.idx),
          stats: stats(accolade.accolade, accolade)
        }
      }, position.accolades);
    }, _), _.toArray, function(rows){
      var username = _.just(rows, _.map(_.comp(len, _.get(_, "username")), _), _.spread(_.max), pad),
          submission = _.just(rows, _.map(_.comp(len, _.get(_, "submission")), _), _.spread(_.max), pad),
          accolade =  _.just(rows, _.map(_.comp(len, _.get(_, "accolade")), _), _.spread(_.max), pad),
          stats = _.just(rows, _.map(_.comp(len, _.get(_, "stats")), _), _.spread(_.max), pad);

      var headers = username("User") + "  " +
        submission("Submission") + "  " +
        accolade("Accolade") + "  " +
        stats("Stats");

      var underlines = underline(username("")) + "  " +
        underline(submission("")) + "  " +
        underline(accolade("")) + "  " +
        underline(stats(""));

      return _.just(rows, _.mapa(function(row){
        return username(row.username) + "  " +
          submission(row.submission) + "  " +
          accolade(row.accolade) + "  " +
          stats(row.stats );
      }, _), _.cons(underlines, _), _.cons(headers, _), _.join("\n", _));
    });
  }

  //determine the date a threshold was reached
  function threshold(num, dt, max){
    return function(item){
      var total = 0;
      for(var vote of item.votes || []) {
        total += vote[num];
        if (total >= max) {
          return vote[dt];
        }
      }
      return null;
    }
  }

  //set minimum number of entrants for category
  function entrants(min){
    return function(items){
      return items.length >= min ? items : [];
    }
  }

  function minplaytimes(ids){
    return _.fmap(request("https://boardgamegeek.com/xmlapi2/thing?type=boardgame&id=" + _.join(",", ids)), repos.xml, function(el){
      return _.reduce(function(memo, id){
        var minutes = _.maybe(el, dom.sel1("item[id=\"" + id +"\"] minplaytime", _), dom.attr(_, "value"), _.blot, parseInt)
        return _.assoc(memo, id, minutes);
      }, {}, ids);
    });
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
    return {
      subtype: subtype,
      id: id,
      minimum: minimum,
      disqualified: !!disqualified,
      objectid: objectid,
      objectname: objectname,
      eligibility: eligibility,
      username: username,
      postdate: postdate,
      body: body
    };
  }

  function addthread(params, contestants, item){
    return _.fmap(_.just(item.body, _.reFind(/\[thread=(\d+)\]|\[.*url=.*\/thread\/(\d+)\/.+\]/, _), _.drop(1, _), _.compact, _.first, parseInt, _.partial(thread, params, item, contestants)), _.merge(item, _));
  }

  var scored = _.get({"LIKE": 1.0, "LUMP": 0.75, "LOVE": 1.25}, _);

  function loved(article){
    return article.vote == "LOVE";
  }

  function fakevote(){
    return _.get({0: "LIKE", 1: "LUMP", 2: "LOVE"}, _.randInt(3));
  }

  function limited(articles, contestants){
    return function(article){ //count only the last vote of a contestant
      return _.includes(contestants, article.username) ? _.just(articles, _.filter(function(a){
        return a.username === article.username;
      }, _), _.last, _.get(_, "id")) == article.id : true;
    }
  }

  function timely(start, end){
    return function(article){
      return article.postdate > start && article.postdate < end;
    }
  }

  function voted(article){
    return article.vote && !article.edited;
  }

  function unbiased(username){
    return function(article){
      return article.username !== username;
    }
  }

  //get the votes for the submission
  function thread(params, topic, contestants, id){
    return id ? _.fmap(request("https://boardgamegeek.com/xmlapi2/thread?id=" + id), repos.xml, function(el){
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
              topic: topic,
              id: id,
              subject: subject,
              username: username,
              postdate: postdate,
              editdate: editdate,
              edited: edited,
              body: body,
              vote: vote,
              score: score * topic.playunits,
              minutes: minutes
            };
          }, _)),
          votes = _.just(articles, _.filtera(_.and(timely(_.date(params.start), _.date(params.end)), voted, unbiased(topic.username), limited(articles, contestants)), _)),
          voters = _.unique(_.map(_.get(_, "username"), votes)),
          loves = _.just(votes, _.filtera(loved, _), _.groupBy(_.get(_, "username"), _), _.vals, _.mapa(_.first, _)),
          score = _.just(votes, _.map(_.get(_, "score"), _), _.sum),
          earliest = _.maybe(votes, _.first, _.get(_, "postdate"));
      return {
        id: id,
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

  _.fmap(tabulate({
    fake: 1,
    id: 278904,
    hill: 13,
    registered: "2021-01-02T05:00:00.000Z",
    start: "2020-02-01T05:00:00.000Z",
    end: "2021-03-01T05:00:00.000Z"
  }), function(data){
    dom.html(document.body, data.monospace);
    _.log(data);
  });

});