#+--------------------------------------------------------------------+
#| utils.coffee
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

module.exports =
#
# flatten a nested list
#
# @param  [Array] list  nested list
# @return [Array] the flattened list
#
  flatten: flatten = ($list) ->

    return [] unless $list?

    $a = []
    for $item in $list
      if Array.isArray($item)
        $a = $a.concat flatten($item)
      else
        $a.push $item
    return $a
