#+--------------------------------------------------------------------+
#| standardfilters.coffee
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
strftime = require('strftime')
Liquid = require('../liquid')

class Liquid.StandardFilters

  @size = (iterable) ->
    (if (iterable["length"]) then iterable.length else 0)

  @downcase = (input) ->
    input.toString().toLowerCase()

  @upcase = (input) ->
    input.toString().toUpperCase()

  @capitalize = (input) ->
    str = input.toString()
    str.charAt(0).toUpperCase() + str.substring(1).toLowerCase()

  @escape = (input) ->

    # FIXME: properly HTML escape input...
    input = input.toString()
    input = input.replace(/&/g, "&amp;")
    input = input.replace(/</g, "&lt;")
    input = input.replace(/>/g, "&gt;")
    input = input.replace(/"/g, "&quot;")
    input

  @h = (input) ->

    # FIXME: properly HTML escape input...
    input = input.toString()
    input = input.replace(/&/g, "&amp;")
    input = input.replace(/</g, "&lt;")
    input = input.replace(/>/g, "&gt;")
    input = input.replace(/"/g, "&quot;")
    input

  @truncate = (input, length, string) ->
    return ""  if not input or input is ""
    length = length or 50
    string = string or "..."
    seg = input.slice(0, length)
    (if input.length > length then input.slice(0, length) + string else input)

  @truncatewords = (input, words, string) ->
    return ""  if not input or input is ""
    words = parseInt(words or 15)
    string = string or "..."
    wordlist = input.toString().split(" ")
    l = Math.max((words), 0)
    (if (wordlist.length > l) then wordlist.slice(0, l).join(" ") + string else input)

  @truncate_words = (input, words, string) ->
    return ""  if not input or input is ""
    words = parseInt(words or 15)
    string = string or "..."
    wordlist = input.toString().split(" ")
    l = Math.max((words), 0)
    (if (wordlist.length > l) then wordlist.slice(0, l).join(" ") + string else input)

  @strip_html = (input) ->
    input.toString().replace /<.*?>/g, ""

  @strip_newlines = (input) ->
    input.toString().replace /\n/g, ""

  @join = (input, separator) ->
    separator = separator or " "
    input.join separator

  @split = (input, separator) ->
    separator = separator or " "
    input.split separator

  @sort = (input) ->
    input.sort()

  @reverse = (input) ->
    input.reverse()

  @replace = (input, string, replacement) ->
    replacement = replacement or ""
    input.toString().replace new RegExp(string, "g"), replacement

  @replace_first = (input, string, replacement) ->
    replacement = replacement or ""
    input.toString().replace new RegExp(string, ""), replacement

  @newline_to_br = (input) ->
    input.toString().replace /\n/g, "<br/>\n"

  @date = (input, format) ->
    date = undefined
    date = input  if input instanceof Date
    date = new Date()  if (date not instanceof Date) and input is "now"
    date = new Date(input)  unless date instanceof Date
    date = new Date(Date.parse(input))  unless date instanceof Date
    return input  unless date instanceof Date # Punt
    strftime(format, date)

  @first = (input) ->
    input[0]

  @last = (input) ->
    input = input
    input[input.length - 1]

Liquid.Template.registerFilter Liquid.StandardFilters

