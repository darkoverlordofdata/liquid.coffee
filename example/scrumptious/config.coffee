config = {}

# should end in /
config.rootUrl = process.env.ROOT_URL or "http://localhost:3000/"
config.facebook =
  appId: process.env.FACEBOOK_APPID or "130243393813697"
  appSecret: process.env.FACEBOOK_APPSECRET or "c82696768ae4ad8b63db874cb64eb558"
  appNamespace: process.env.FACEBOOK_APPNAMESPACE or "nodescrumptious"
  redirectUri: process.env.FACEBOOK_REDIRECTURI or config.rootUrl + "login/callback"

module.exports = config
