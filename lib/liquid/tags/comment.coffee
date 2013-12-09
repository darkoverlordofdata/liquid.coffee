#+--------------------------------------------------------------------+
#| comment.coffee
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
# Comment Tag
#

module.exports = (Liquid) ->

  class Comment extends Liquid.Block
    render: (context) ->
      ""
    Liquid.Template.registerTag "comment", Comment
