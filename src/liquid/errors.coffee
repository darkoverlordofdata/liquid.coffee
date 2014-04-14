#+--------------------------------------------------------------------+
#| errors.coffee
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
# Liquid Templates
#
Liquid = require('../liquid')

class Liquid.ArgumentError extends Error
class Liquid.ContextError extends Error
class Liquid.FilterNotFound extends Error
class Liquid.FileSystemError extends Error
class Liquid.StandardError extends Error
class Liquid.SyntaxError extends Error
class Liquid.StackLevelError extends Error
class Liquid.MemoryError extends Error
