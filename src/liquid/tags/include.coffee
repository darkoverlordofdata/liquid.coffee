#+--------------------------------------------------------------------+
#| include.coffee
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
Tag = require('../tag')
Template = require('../template')
Utils = require('./utils')

module.exports = class Include extends Tag

  tagSyntax: /((?:"[^"]+"|'[^']+'|[^\s,|]+)+)(\s+(?:with|for)\s+((?:"[^"]+"|'[^']+'|[^\s,|]+)+))?/
  constructor: (tag, markup, tokens) ->
    matches = (markup or "").match(@tagSyntax)
    if matches
      @templateName = matches[1]
      @templateNameVar = @templateName.substring(1, @templateName.length - 1)
      @variableName = matches[3]
      @attributes = {}
      attMatchs = markup.match(/(\w*?)\s*\:\s*("[^"]+"|'[^']+'|[^\s,|]+)/g)
      if attMatchs
        attMatchs.forEach ((pair) ->
          pair = pair.split(":")
          @attributes[pair[0].trim()] = pair[1].trim()
        ), this
    else
      throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]")
    super tag, markup, tokens

  render: (context) ->
    source = Template.fileSystem.readTemplateFile(context.get(@templateName))
    partial = Template.parse(source)
    variable = context.get((@variableName or @templateNameVar))
    output = ""
    context.stack =>

      @attributes.forEach = (fun) -> #, thisp
        throw "Object.forEach requires first argument to be a function"  unless typeof fun is "function"
        i = 0
        thisp = arguments[1]
        for key, value of @
          pair = [key, value]
          pair.key = key
          pair.value = value
          fun.call thisp, pair, i, @
          i++
        null

      @attributes.forEach (pair) ->
        context.set pair.key, context.get(pair.value)

      if variable instanceof Array
        output = variable.map((variable) ->
          context.set @templateNameVar, variable
          partial.render context
        )
      else
        context.set @templateNameVar, variable
        output = partial.render(context)

    output = Utils.flatten([output]).join("")

Template.registerTag "include", Include
