#+--------------------------------------------------------------------+
#| case.coffee
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
# Case Tag
#
module.exports = (Liquid) ->

  class Include extends Liquid.Tag

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
          attMatchs.each ((pair) ->
            pair = pair.split(":")
            @attributes[pair[0].strip()] = pair[1].strip()
          ), this
      else
        throw ("Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]")
      super tag, markup, tokens

    render: (context) ->
      source = Liquid.readTemplateFile(context.get(@templateName))
      partial = Liquid.parse(source)
      variable = context.get((@variableName or @templateNameVar))
      output = ""
      context.stack =>

        # HACK Until we get Object.each working right
        @attributes.each = (fun) -> #, thisp
          throw "Object.each requires first argument to be a function"  unless typeof fun is "function"
          i = 0
          thisp = arguments[1]
          for key, value of @
            pair = [key, value]
            pair.key = key
            pair.value = value
            fun.call thisp, pair, i, @
            i++
          null

        @attributes.each (pair) ->
          context.set pair.key, context.get(pair.value)

        if variable instanceof Array
          output = variable.map((variable) ->
            context.set @templateNameVar, variable
            partial.render context
          )
        else
          context.set @templateNameVar, variable
          output = partial.render(context)

      output = [output].flatten().join("")
      output

    Liquid.Template.registerTag "include", Include