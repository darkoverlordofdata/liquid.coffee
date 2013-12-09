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
    ", (err, output) ->
    console.log output
    console.log err.message if err?


#  --------------------------------------------------------------------

#
# Build the project
#
#
task "buildz", "build liquid", ->

  $build = ''

  for $name in [
    "lib/liquid/extensions.coffee"
    "lib/liquid/tag.coffee"
    "lib/liquid/block.coffee"
    "lib/liquid/document.coffee"
    "lib/liquid/strainer.coffee"
    "lib/liquid/context.coffee"
    "lib/liquid/template.coffee"
    "lib/liquid/variable.coffee"
    "lib/liquid/condition.coffee"
    "lib/liquid/drop.coffee"
    "lib/liquid/standardfilters.coffee"
    "lib/liquid/tags/assign.coffee"
    "lib/liquid/tags/capture.coffee"
    "lib/liquid/tags/case.coffee"
    "lib/liquid/tags/comment.coffee"
    "lib/liquid/tags/cycle.coffee"
    "lib/liquid/tags/for.coffee"
    "lib/liquid/tags/if.coffee"
    "lib/liquid/tags/ifchanged.coffee"
    "lib/liquid/tags/include.coffee"
    "lib/liquid/tags/raw.coffee"
  ]
    $code = String(fs.readFileSync("#{__dirname}/#{$name}"))

    $class = $code.split('module.exports = (Liquid) ->')[1]
    $build+= $class.replace(/^  /gm, "")

    $code = String(fs.readFileSync("#{__dirname}/liquid.coffee"))
    $code+= $build

    #fs.writeFileSync "#{__dirname}/liquid.coffee", $build


