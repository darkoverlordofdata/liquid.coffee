FB = require("fb")
Step = require("step")
config = require("../config")
FB.options
  appId: config.facebook.appId
  appSecret: config.facebook.appSecret
  redirectUri: config.facebook.redirectUri

exports.index = (req, res) ->
  accessToken = req.session.access_token
  unless accessToken
    res.render "index",
      title: "Express"
      loginUrl: FB.getLoginUrl(scope: "user_about_me")

  else
    res.render "menu"
  return

exports.loginCallback = (req, res, next) ->
  code = req.query.code
  if req.query.error
    
    # user might have disallowed the app
    return res.send("login-error " + req.query.error_description)
  else return res.redirect("/")  unless code
  Step (exchangeCodeForAccessToken = ->
    FB.napi "oauth/access_token",
      client_id: FB.options("appId")
      client_secret: FB.options("appSecret")
      redirect_uri: FB.options("redirectUri")
      code: code
    , this
    return
  ), (extendAccessToken = (err, result) ->
    throw (err)  if err
    FB.napi "oauth/access_token",
      client_id: FB.options("appId")
      client_secret: FB.options("appSecret")
      grant_type: "fb_exchange_token"
      fb_exchange_token: result.access_token
    , this
    return
  ), (err, result) ->
    return next(err)  if err
    req.session.access_token = result.access_token
    req.session.expires = result.expires or 0
    if req.query.state
      parameters = JSON.parse(req.query.state)
      parameters.access_token = req.session.access_token
      console.log parameters
      FB.api "/me/" + config.facebook.appNamespace + ":eat", "post", parameters, (result) ->
        console.log result
        return res.send(500, result or "error")  if not result or result.error
        
        # return res.send(500, 'error');
        res.redirect "/"

    else
      res.redirect "/"
    return

  return

exports.logout = (req, res) ->
  req.session = null # clear session
  res.redirect "/"
  return
