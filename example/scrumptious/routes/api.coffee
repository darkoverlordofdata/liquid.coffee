FB = require("fb")
config = require("../config")
exports.search = (req, res) ->
  parameters = req.query
  parameters.access_token = req.session.access_token
  FB.api "/search", req.query, (result) ->
    return res.send(500, "error")  if not result or result.error
    res.send result
    return

  return

exports.friends = (req, res) ->
  FB.api "me/friends",
    fields: "name,picture"
    limit: 250
    access_token: req.session.access_token
  , (result) ->
    return res.send(500, "error")  if not result or result.error
    res.send result
    return

  return

exports.announce = (req, res) ->
  parameters = req.body
  parameters.access_token = req.session.access_token
  FB.api "/me/" + config.facebook.appNamespace + ":eat", "post", parameters, (result) ->
    unless result
      return res.send(500, "error")
    else if result.error
      if result.error.type is "OAuthException"
        result.redirectUri = FB.getLoginUrl(
          scope: "user_about_me,publish_actions"
          state: encodeURIComponent(JSON.stringify(parameters))
        )
      return res.send(500, result)
    res.send result
    return

  return
