#+--------------------------------------------------------------------+
#| variable.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2012
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# Liquid.Variable
#
module.exports = (Liquid) ->

  class Variable

    constructor: (markup) ->
      @markup = markup
      @name = null
      @filters = []
      self = this
      match = markup.match(/\s*("[^"]+"|'[^']+'|[^\s,|]+)/)
      if match
        @name = match[1]
        filterMatches = markup.match(/\|\s*(.*)/)
        if filterMatches
          filters = filterMatches[1].split(/\|/)
          filters.each (f) ->
            matches = f.match(/\s*(\w+)/)
            if matches
              filterName = matches[1]
              filterArgs = []
              (f.match(/(?:[:|,]\s*)("[^"]+"|'[^']+'|[^\s,|]+)/g) or []).flatten().each (arg) ->
                cleanupMatch = arg.match(/^[\s|:|,]*(.*?)[\s]*$/)
                filterArgs.push cleanupMatch[1]  if cleanupMatch

              self.filters.push [filterName, filterArgs]


    render: (context) ->
      return ""  unless @name?
      output = context.get(@name)
      @filters.each (filter) ->
        filterName = filter[0]
        filterArgs = (filter[1] or []).map((arg) ->
          context.get arg
        )
        filterArgs.unshift output # Push in input value into the first argument spot...
        output = context.invoke(filterName, filterArgs)

      output

