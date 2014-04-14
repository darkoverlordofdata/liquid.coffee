#+--------------------------------------------------------------------+
#| drop.coffee
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

# A drop in liquid is a class which allows you to export DOM like things to liquid.
# Methods of drops are callable.
# The main use for liquid drops is to implement lazy loaded objects.
# If you would like to make data available to the web designers which you don't want loaded unless needed then
# a drop is a great way to do that.
#
# Example:
#
#   class ProductDrop extends Liquid.Drop
#     top_sales: ->
#       Shop.current.products.find('all', order: 'sales', limit: 10 )
#
#   tmpl = Liquid.Template.parse( ' {% for product in product.top_sales %} {{ product.name }} {%endfor%} '  )
#   tmpl.render(product: new ProductDrop ) # will invoke top_sales query.
#
# Your drop can either implement the methods sans any parameters or implement the before_method(name) method which is a
# catch all.
class Liquid.Drop

  setContext: (context) ->
    @context = context

  beforeMethod: (method) ->

  invokeDrop: (method) ->

    if 'function' is typeof Drop::[method]
      @[method].apply(@)
    else
      @beforeMethod(method)

  hasKey: (name) ->
    true

