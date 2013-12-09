#+--------------------------------------------------------------------+
#| index.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
#+--------------------------------------------------------------------+
#|
#| This file is a part of Liquid.coffee
#|
#| Liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the MIT License
#|
#+--------------------------------------------------------------------+
#

(require './core')()

$x = Liquid.parse("{{ 10 }}").renderWithErrors()

console.log "result: "+$x