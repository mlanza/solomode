require(['atomic/core', 'atomic/dom', 'atomic/reactives', 'atomic/transducers', 'atomic/repos'], function(_, dom, $, t, repos){

  function geeklist(id){
    return _.fmap(fetch("https://boardgamegeek.com/xmlapi/geeklist/" + id), repos.xml, function(doc){
      var title = _.just(doc, dom.sel1("title", _), dom.text),
          username = _.just(doc, dom.sel1("username", _), dom.text),
          numitems = _.just(doc, dom.sel1("numitems", _), dom.text, parseInt);
      return _.fmap(_.just(doc, dom.sel("item", _), _.mapa(item, _), function(items){
        return Promise.all(items);
      }), function(items){
        return {title: title, username: username, numitems: numitems, items: items};
      });
    });
  }

  function item(el){
    var subtype = dom.attr(el, "subtype"),
        objectid = _.just(el, dom.attr(_ ,"objectid"), parseInt),
        objectname = dom.attr(el, "objectname"),
        username = dom.attr(el, "username"),
        postdate = _.date(dom.attr(el, "postdate")),
        body = dom.text(el);
    return _.fmap(_.just(body, _.reFind(/\[thread=(\d+)\]|\[.*url=.+\/thread\/(\d+)\/.+\]/, _), _.drop(1, _), _.compact, _.first, thread), function(thread){
      return Object.assign({
          subtype: subtype,
          objectid: objectid,
          objectname: objectname,
          username: username,
          postdate: postdate,
          body: body
        }, thread);
    });
  }

  function thread(id){
    return id ? _.fmap(fetch("https://boardgamegeek.com/xmlapi2/thread?id=" + id), repos.xml, function(el){
      var subject = _.just(el, dom.sel1("subject", _), dom.text),
          articles = _.just(el, dom.sel("article", _), _.mapa(function(el){
            var id = _.just(el, dom.attr(_, "id"), parseInt),
                username = dom.attr(el, "username"),
                postdate = _.just(el, dom.attr(_, "postdate"), _.date),
                body = _.just(el, dom.sel1("body", _), dom.text);
            return {id: id, username: username, postdate: postdate, body: body};
          }, _));
      return {subject: subject, articles: articles};
    }) : null;
  }

  var params = _.fromQueryString(location.href);

  //http://localhost:8080/?id=278904
  _.fmap(geeklist(params.id), _.log);

});