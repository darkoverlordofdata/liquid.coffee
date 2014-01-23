#+--------------------------------------------------------------------+
#| i18n.coffee
#+--------------------------------------------------------------------+
#| Copyright DarkOverlordOfData (c) 2013 - 2014
#+--------------------------------------------------------------------+
#|
#| This file is a part of liquid.coffee
#|
#| liquid.coffee is free software; you can copy, modify, and distribute
#| it under the terms of the GNU General Public License Version 3
#|
#+--------------------------------------------------------------------+
#
# messages
#

module.exports =
  errors:
    syntax:
      assign: "Syntax Error in 'assign' - Valid syntax: assign [var] = [source]"
      capture: "Syntax Error in 'capture' - Valid syntax: capture [var]"
      case: "Syntax Error in 'case' - Valid syntax: case [condition]"
      case_invalid_when: "Syntax Error in tag 'case' - Valid when condition: {% when [condition] [or condition2...] %}"
      case_invalid_else: "Syntax Error in tag 'case' - Valid else condition: {% else %} (no parameters) "
      cycle: "Syntax Error in 'cycle' - Valid syntax: cycle [name :] var [, var2, var3 ...]"
      for: "Syntax Error in 'for loop' - Valid syntax: for [item] in [collection]"
      for_invalid_in: "For loops require an 'in' clause"
      for_invalid_attribute: "Invalid attribute in for loop. Valid attributes are limit and offset"
      if: "Syntax Error in tag 'if' - Valid syntax: if [expression]"
      include: "Error in tag 'include' - Valid syntax: include '[template]' (with|for) [object|collection]"
      unknown_tag: "Unknown tag '%{tag}'"
      invalid_delimiter: "'end' is not a valid delimiter for %{block_name} tags. use %{block_delimiter}"
      unexpected_else: "%{block_name} tag does not expect else tag"
      tag_termination: "Tag '%{token}' was not properly terminated with regexp: %{tag_end}"
      variable_termination: "Variable '%{token}' was not properly terminated with regexp: %{tag_end}"
      tag_never_closed: "'%{block_name}' tag was never closed"
      meta_syntax_error: "Liquid syntax error: %s"
      table_row: "Syntax Error in 'table_row loop' - Valid syntax: table_row [item] in [collection] cols=3"