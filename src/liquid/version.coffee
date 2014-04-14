#+--------------------------------------------------------------------+
#| version.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the MIT License
#|
#+--------------------------------------------------------------------+
#
# Load the Liquid Template Framework
#
Liquid = require('../liquid')

Liquid.VERSION =  require('../../package.json').version
