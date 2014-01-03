#+--------------------------------------------------------------------+
#| localfilesystem.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# Liquid Templates
#
fs = require('fs')
path = require('path')

module.exports = (Liquid) ->

  class LocalFileSystem

    constructor: (@root) ->

    readTemplateFile: ($template) ->
      String(fs.readFileSync(path.resolve(@root, $template)))
