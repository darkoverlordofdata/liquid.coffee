#
#	test_helper - Set up the test environment
#
#
#
do ->

  Object.defineProperties @,

    # Use chai 'should' semantics
    should: value: require('chai').should()

    # The Liquid framework
    Liquid: value: require("../src/liquid.coffee")

    # helper functions
    render: value: ($src, $ctx) ->
      Liquid.Template.parse($src).renderWithErrors($ctx)


