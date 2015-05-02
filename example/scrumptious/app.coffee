express = require("express")
FB = require("fb")
fs = require('fs')
http = require("http")
path = require("path")
config = require("./config")
api = require("./routes/api")
home = require("./routes/home")
meals = require("./routes/meals")
app = express()
Liquid = require('liquid.coffee')

throw new Error("facebook appId and appSecret required in config.js")  if not config.facebook.appId or not config.facebook.appSecret
app.configure ->
  app.set "port", process.env.PORT or 3000
  app.set "views", __dirname + "/views"
  app.set "view engine", "tpl"
  app.engine 'tpl', (new Liquid.LiquidView()).__express
  app.use express.favicon()
  app.use express.logger("dev")
  app.use express.cookieParser()
  app.use express.cookieSession(secret: "secret")
  app.use express.bodyParser()
  app.use express.methodOverride()
  app.use app.router
  app.use express.static(path.join(__dirname, "public"))
  return

app.configure "development", ->
  app.use express.errorHandler()
  return

app.get "/", home.index
app.get "/login/callback", home.loginCallback
app.get "/logout", home.logout
app.get "/search", api.search
app.get "/friends", api.friends
app.post "/announce", api.announce
app.get "/meals/:id", meals.show
app.get "/winjs/meals/:id", meals.showWinJs # this is used for facebook-winjs-sdk sample and not required to actually run this sample
http.createServer(app).listen app.get("port"), ->
  console.log "Express server listening on port " + app.get("port")
  return

