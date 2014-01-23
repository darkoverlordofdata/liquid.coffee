#+--------------------------------------------------------------------+
#| liquid.coffee
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
Liquid = require('../liquid')

# LiquidView can be registerered with express
# to use liquid as an template system for .liquid files
#
# Example
# 
#   app.engine('.liquid', require('huginn-liquid').__express


class Liquid.LiquidView

  cache = {}
  #
  # inner class Vars
  #


  render: ($source, $data = {}) ->

    if cache[$source]?
      $template = cache[$source]
    else
      $template = Liquid.Template.parse($source)

    $template.render $data

  renderFile: ($path, $data, $next) ->

    fs.readFile $path, ($err, $source) =>
      return $next $err if $err?
      $next null, @render($source, $data)


lv = new Liquid.LiquidView

module.exports =
  __express   : lv.renderFile
  render      : lv.render
  renderFile  : lv.renderFile



