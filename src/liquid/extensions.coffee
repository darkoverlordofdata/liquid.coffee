#+--------------------------------------------------------------------+
#| extensions.coffee
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
# not-ruby
#

_flatten = ($list) ->
  return [] unless $list?
  $a = []
  for $item in $list
    if Array.isArray($item)
      $a = $a.concat _flatten($item)
    else
      $a.push $item
  return $a


Object.defineProperties Array::,

  first: get: ->
    @[0]

  last: get: ->
    @[@length-1]

  compact: get: ->
    ($item for $item in @ when $item)

  flatten: get: ->
    _flatten @

  inject: value: ($memo, $func) ->
    for $item in @
      $memo = $func.call(@, $memo, $item)
    $memo


  find: value: ($func) ->
    for $item in @
      if $func.call(@, $item)
        return $item

