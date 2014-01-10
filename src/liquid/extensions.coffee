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
# Syntactic sugar to make the port from ruby flow more easily
#


Object.defineProperties Array,

  flatten: value: ($this) ->
    return [] unless $this?
    $a = []
    for $that in $this
      if Array.isArray($that)
        $a = $a.concat Array.flatten($that)
      else
        $a.push $that
    return $a

  inject: value: ($this, $memo, $func) ->
    for $that in $this
      $memo = $func.call($this, $memo, $that)
    $memo

  find: value: ($this, $func) ->
    for $that in $this
      if $func.call($this, $that)
        return $that


Object.defineProperties Array::,

  first: get: -> @[0]
  last: get: -> @[@length-1]
  compact: get: -> ($that for $that in @ when $that)
  flatten: get: -> Array.flatten @
  inject: value: ($memo, $func) -> Array.inject @, $memo, $func
  find: value: ($func) -> Array.find @, $func

