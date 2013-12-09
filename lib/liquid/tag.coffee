#+--------------------------------------------------------------------+
#| tag.coffee
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
# Liquid.Tag
#
module.exports = (Liquid) ->

  class Tag

    constructor: (tagName, markup, tokens) ->
      @tagName = tagName
      @markup = markup
      @nodelist = @nodelist or []
      @parse tokens

    parse: (tokens) ->


    #      console.log("Tag.parse not implemented...");
    render: (context) ->
      ""


  # From ruby: def name; self.class.name.downcase; end
