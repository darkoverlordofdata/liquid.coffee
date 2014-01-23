#+--------------------------------------------------------------------+
#| Cakefile
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
# Cakefile
#

fs = require('fs')
util = require 'util'
{exec} = require "child_process"

#  --------------------------------------------------------------------

#
# Run all tests
#
#
task "test", "run tests", ->
  REPORTER = "nyan"
  exec "NODE_ENV=test
      ./node_modules/.bin/mocha
      --compilers coffee:coffee-script
      --reporter #{REPORTER}
      --require coffee-script
      --require test/test_helper.coffee
      --recursive
      ", (err, output) ->
    console.log output
    console.log err.message if err?


#  --------------------------------------------------------------------

#
# Build Source
#
#
task 'build:src', 'Build the coffee source', ->

  #
  # Build the intermediate js
  #
  exec 'coffee -o lib -c src', ($err, $stdout, $stderr) ->

    util.log $err if $err if $err?
    util.log $stderr if $stderr if $stderr?
    util.log $stdout if $stdout if $stdout?
    util.log 'ok' unless $stdout?

    exec 'browserify  lib/liquid.js --debug --standalone Liquid > dist/liquid-0.0.7.dbg.js', ($err, $stdout, $stderr) ->

      util.log $err if $err if $err?
      util.log $stderr if $stderr if $stderr?
      util.log $stdout if $stdout if $stdout?
      util.log 'ok' unless $stdout?

      exec 'browserify lib/liquid.js --standalone Liquid | uglifyjs > dist/liquid-0.0.7.min.js', ($err, $stdout, $stderr) ->

        util.log $err if $err if $err?
        util.log $stderr if $stderr if $stderr?
        util.log $stdout if $stdout if $stdout?
        util.log 'ok' unless $stdout?

        exec 'browserify  lib/liquid.js --standalone Liquid > dist/liquid-0.0.7.js', ($err, $stdout, $stderr) ->

          util.log $err if $err if $err?
          util.log $stderr if $stderr if $stderr?
          util.log $stdout if $stdout if $stdout?
          util.log 'ok' unless $stdout?

