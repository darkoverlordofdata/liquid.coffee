config = require("../config")
meals =
  cheeseburger: "Cheeseburger"
  chinese: "Chinese"
  french: "French"
  hotdog: "Hot Dog"
  indian: "Indian"
  italian: "Italian"
  pizza: "Pizza"

exports.show = (req, res, next) ->
  id = req.params.id
  meal = undefined
  return res.send(404)  unless meals[id]
  meal =
    id: id
    title: meals[id]
    url: config.rootUrl + "meals/" + id
    imageUrl: config.rootUrl + "images/meals/" + id + "-full.png"

  res.render "meal",
    appId: config.facebook.appId
    appNamespace: config.facebook.appNamespace
    meal: meal

  return

exports.showWinJs = (req, res, next) ->
  
  # this method is used for facebook-winjs-sdk sample and not required to actually run this sample
  id = req.params.id
  meal = undefined
  return res.send(404)  unless meals[id]
  meal =
    id: id
    title: meals[id]
    url: config.rootUrl + "winjs/meals/" + id
    imageUrl: config.rootUrl + "images/meals/" + id + "-full.png"

  res.render "meal",
    appId: "438749336206495"
    appNamespace: "winjsscrumptious"
    meal: meal

  return
