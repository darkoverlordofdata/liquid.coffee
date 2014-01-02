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
Tag = require('./tag')

module.exports class Block extends Tag

  IsTag             = /^\{\%/
  IsVariable        = /^\{\{/
  FullToken         = /^\{\%\s*(\w+)\s*(.*)?\%\}$/
  ContentOfVariable = /^\{\{(.*)\}\}$/

  constructor: (tagName, markup, tokens) ->
    @blockName = tagName
    @blockDelimiter = "end" + @blockName
    super tagName, markup, tokens

  parse: (tokens) ->

    # NOTE Don't just blindly re-initialize nodelist; inherited classes may
    # share this through pointers; specifically If points _nodelist at the
    # blocks attachment, so we need to leave that pointer to pickup stuff.
    @nodelist or= []
    @nodelist.length = 0
    token = tokens.shift()
    tokens.push "" # To ensure we don't lose the last token passed in...
    while tokens.length

      if IsTag.test token
        if (tagParts = token.match(FullToken))?

          # if we found the proper block delimitor just end parsing here and let the outer block proceed
          if @blockDelimiter is tagParts[1]
            @endTag()
            return
          if tagParts[1] of Template.tags
            @nodelist.push new Template.tags[tagParts[1]](tagParts[1], tagParts[2], tokens)
          else
            @unknownTag tagParts[1], tagParts[2], tokens
        else
          throw ("Tag '" + token + "' was not properly terminated with: %}")

      else if IsVariable.test token
        @nodelist.push @createVariable(token)

      else #if(token != '') {
        @nodelist.push token
      # Ignores tokens that are empty
      token = tokens.shift() # Assign the next token to loop again...

    # Effectively this method will throw and exception unless the current block is of type Document
    @assertMissingDelimitation()

  endTag: ->

  unknownTag: (tag, params, tokens) ->
    switch tag
      when "else"
        throw (@blockName + " tag does not expect else tag")
      when "end"
        throw ("'end' is not a valid delimiter for " + @blockName + " tags. use " + @blockDelimiter)
      else
        throw ("Unknown tag: " + tag)

  createVariable: (token) ->
    if (match = token.match(ContentOfVariable))?
      new Variable(match[1])
    else
      throw ("Variable '" + token + "' was not properly terminated with: }}")

  render: (context) ->
    @renderAll @nodelist, context

  renderAll: (list, context) ->
    (list or []).map (token, i) ->
      output = ""
      try # hmmm... feels a little heavy
        output = (if (token["render"]) then token.render(context) else token)
      catch e
        output = context.handleError(e)
      output


  assertMissingDelimitation: ->
    throw (@blockName + " tag was never closed")



