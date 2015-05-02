#+--------------------------------------------------------------------+
#| liquid.coffee
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
Liquid = require('../liquid')

# LiquidView can be registerered with express
# to use liquid as an template system for .liquid files
#
# Example
# 
#  app.engine('tpl', (new Liquid.LiquidView()).__express)



class Liquid.LiquidView

  cache = {}
  #
  # inner class Vars
  #


  render: (source, data = {}) ->

    if cache[source]?
      template = cache[source]
    else
      template = Liquid.Template.parse(source)

    template.render data


  renderFile: (filePath, options, next) ->

    fs.readFile filePath, 'utf-8', (err, content) ->
      return next(new Error(err)) if (err)
      template = Liquid.Template.parse(content)
      return next(null, template.render(options))


  __express: (filePath, options, next) ->

    fs.readFile filePath, 'utf-8', (err, content) ->
      return next(new Error(err)) if (err)
      template = Liquid.Template.parse(content)
      return next(null, template.render(options))

