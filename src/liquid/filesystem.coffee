#+--------------------------------------------------------------------+
#| blankfilesystem.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the MIT License
#|
#+--------------------------------------------------------------------+
#
# Liquid Templates
#
fs = require('fs')
path = require('path')
Liquid = require('../liquid')

class Liquid.BlankFileSystem

  readTemplateFile: (path) ->
    throw ("This liquid context does not allow includes.")


class Liquid.LocalFileSystem

  constructor: (@root) ->

  readTemplateFile: ($template) =>
    String(fs.readFileSync(path.resolve(@root, $template)))
