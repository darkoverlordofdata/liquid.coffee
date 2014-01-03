#+--------------------------------------------------------------------+
#| liquid-test.coffee
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
#	liquid.coffee spec
#
#
#


Liquid = require("../src/liquid.coffee")

render = ($src, $ctx) ->
  Liquid.Template.parse($src).renderWithErrors($ctx)

#? -------------------------------------------------------------------+
describe 'liquid', ->

  #? -----------------------------------------------------------------+
  describe 'Verify API', ->

    #! ---------------------------------------------------------------+
    it "class module", ->

      #Liquid.should.be.a 'function'
      Liquid.should.have.property 'Template'
      Liquid.should.have.property 'Drop'
      Liquid.should.have.property 'Tag'
      Liquid.should.have.property 'Block'

  #? -----------------------------------------------------------------+
  describe "Plain text pass-thru", ->

    #! ---------------------------------------------------------------+
    it "'plain text'", ->

      render('plain text').should.equal 'plain text'

  #? -----------------------------------------------------------------+
  describe "Testing variables...", ->

    #! ---------------------------------------------------------------+
    it "{{ 'string literal' }}", ->

      render('{{"string literal"}}').should.equal       'string literal'
      render('{{ "string literal" }}').should.equal     'string literal'
      render("{{'string literal'}}").should.equal       'string literal'
      render("{{ 'string literal' }}").should.equal     'string literal'
      render("{{'string \"literal\"'}}").should.equal   'string "literal"'
      render("{{ 'string \"literal\"' }}").should.equal 'string "literal"'

    #! ---------------------------------------------------------------+
    it "{{ 10 }}", ->
      render('{{10}}').should.equal '10'
      render('{{ 10 }}').should.equal '10'

    #! ---------------------------------------------------------------+
    it "{{ 5.5 }}", ->
      render('{{5.5}}').should.equal '5.5'
      render('{{ 5.5 }}').should.equal '5.5'

    #! ---------------------------------------------------------------+
    it "{{ (1..5) }}", ->
      render('{{(1..5)}}').should.equal '1,2,3,4,5'
      render('{{ (1..5) }}').should.equal '1,2,3,4,5'


    #! ---------------------------------------------------------------+
    it "{{ (a..e) }}", ->
      render('{{(a..e)}}').should.equal 'a,b,c,d,e'

    #! ---------------------------------------------------------------+
    it "{{ varname }}", ->
      render("{{ user }}", {user:'Bob'}).should.equal 'Bob'

    #! ---------------------------------------------------------------+
    it "{{ parent.child }}", ->
      render("{{ user.name }}", {user:{ name:'Bob' }}).should.equal 'Bob'

    #! ---------------------------------------------------------------+
    it "{{ collection[0] }}", ->
      render("{{ users[0] }}", {users:['Bob']}).should.equal 'Bob'

    #! ---------------------------------------------------------------+
    it "{{ collection[0].child }}", ->
      render("{{ users[0].name }}", {users:[{name:'Bob'}]}).should.equal 'Bob'


  #? -----------------------------------------------------------------+
  describe "Testing filters...", ->

    #! ---------------------------------------------------------------+
    it "{{ string | size }}", ->
      render("{{user | size}}", {user:'Bob'}).should.equal '3'
      render("{{user|size}}", {user:'Bob'}).should.equal '3'
      render("{{ user | size }}", {user:'Bob'}).should.equal '3'

    #! ---------------------------------------------------------------+
    it "{{ collection | size }}", ->
      render("{{user|size}}", {user:['','','']}).should.equal '3'
      render("{{ user | size }}", {user:['','','']}).should.equal '3'

    #! ---------------------------------------------------------------+
    it "{{ string | upcase }}", ->
      render("{{user|upcase}}", {user:'Bob'}).should.equal 'BOB'
      render("{{ user | upcase }}", {user:'Bob'}).should.equal 'BOB'

    #! ---------------------------------------------------------------+
    it "{{ string | downcase }}", ->
      render("{{user|downcase}}", {user:'Bob'}).should.equal 'bob'
      render("{{ user | downcase }}", {user:'Bob'}).should.equal 'bob'

    #! ---------------------------------------------------------------+
    it "{{ string | capitalize }}", ->
      render("{{user|capitalize}}", {user:'bob'}).should.equal 'Bob'
      render("{{ user | capitalize }}", {user:'bob'}).should.equal 'Bob'

    #! ---------------------------------------------------------------+
    it "{{ string | escape }}", ->
      render("{{'<br/>'|escape}}", {user:'bob'}).should.equal '&lt;br/&gt;'
      render("{{ '<br/>' | escape }}", {user:'bob'}).should.equal '&lt;br/&gt;'
      render("{{ 'this & \"that\"' | escape }}", {user:'bob'}).should.equal 'this &amp; &quot;that&quot;'

    #! ---------------------------------------------------------------+
    it "{{ string | truncate }}", ->

      render("{{'I am the very model of a modern major general, really.'|truncate}}")
      .should.equal 'I am the very model of a modern major general, rea...'

      render("{{'I am the very model of a modern major general, really.' | truncate}}")
      .should.equal 'I am the very model of a modern major general, rea...'

    #! ---------------------------------------------------------------+
    it "{{ string | truncate:2 }}", ->
      render("{{user|truncate:2}}", {user:'Bob'}).should.equal 'Bo...'
      render("{{ user | truncate:2 }}", {user:'Bob'}).should.equal 'Bo...'
      render("{{ user | truncate: 2 }}", {user:'Bob'}).should.equal 'Bo...'

    #! ---------------------------------------------------------------+
    it "{{ string | truncate:1,'-' }}", ->
      render("{{user|truncate:1,'-'}}", {user:'Bob'}).should.equal 'B-'
      render("{{ user | truncate:1,'-' }}", {user:'Bob'}).should.equal 'B-'
      render("{{ user | truncate: 1,'-' }}", {user:'Bob'}).should.equal 'B-'
      render("{{ user | truncate: 1, '-' }}", {user:'Bob'}).should.equal 'B-'

    #! ---------------------------------------------------------------+
    it "{{ string | truncatewords }}", ->
      render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords}}")
      .should.equal 'a b c d e f g h i j k l m n o...'
      render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords }}")
      .should.equal 'a b c d e f g h i j k l m n o...'

    #! ---------------------------------------------------------------+
    it "{{ string | truncatewords:5 }}", ->
      render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords:5}}")
      .should.equal 'a b c d e...'
      render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords:5 }}")
      .should.equal 'a b c d e...'

    #! ---------------------------------------------------------------+
    it "{{ string | truncatewords:5,'-' }}", ->
      render("{{'a b c d e f g h i j k l m n o p q r s t u v w x y z'|truncatewords:5,'-'}}")
      .should.equal 'a b c d e-'
      render("{{ 'a b c d e f g h i j k l m n o p q r s t u v w x y z' | truncatewords:5,'-' }}")
      .should.equal 'a b c d e-'

    #! ---------------------------------------------------------------+
    it "{{ string | strip_html }}", ->
      render("{{'hello <b>bob</b>'|strip_html}}")
      .should.equal 'hello bob'
      render("{{ 'hello <b>bob</b>' | strip_html }}")
      .should.equal 'hello bob'

    #! ---------------------------------------------------------------+
    it "{{ string | strip_newlines }}", ->

      src = "\nhello \nbob \n\nold\n friend\n"

      render("{{src|strip_newlines}}", {src:src})
      .should.equal 'hello bob old friend'
      render("{{ src | strip_newlines }}", {src:src})
      .should.equal 'hello bob old friend'

    #! ---------------------------------------------------------------+
    it "{{ collection | join }}", ->
      render("{{(1..3)|join}}").should.equal "1 2 3"
      render("{{ (1..3) | join }}").should.equal "1 2 3"

    #! ---------------------------------------------------------------+
    it "{{ collection | join:',' }}", ->
      render("{{(1..3)|join:','}}").should.equal "1,2,3"
      render("{{ (1..3) | join:',' }}").should.equal "1,2,3"


    it "{{ collection | sort }}", ->
      render("{{c|sort}}", {c:[2,1,3]}).should.equal "1,2,3"
      render("{{ c | sort }}", {c:[2,1,3]}).should.equal "1,2,3"
      render("{{(1..3)|sort}}").should.equal "1,2,3"
      render("{{ (1..3) | sort }}").should.equal "1,2,3"

    it "{{ collection | reverse }}", ->
      render("{{(1..3)|reverse}}").should.equal "3,2,1"
      render("{{ (1..3) | reverse }}").should.equal "3,2,1"
      render("{{c|reverse}}", {c:[1,2,3]}).should.equal "3,2,1"
      render("{{ c | reverse }}", {c:[1,2,3]}).should.equal "3,2,1"

    it "{{ string | relace:string }}", ->
      render("{{'bananas'|replace:'a'}}").should.equal "bnns"
      render("{{ 'bananas' | replace:'a' }}").should.equal "bnns"

    it "{{ string | relace_first:string }}", ->
      render("{{'bananas'|replace_first:'a'}}").should.equal "bnanas"
      render("{{ 'bananas' | replace_first:'a' }}").should.equal "bnanas"

    it "{{ string | newline_to_br }}", ->
      src = "Hello,\nHow are you?\nI'm glad to here it."
      exp = "Hello,<br/>\nHow are you?<br/>\nI'm glad to here it."
      render("{{src|newline_to_br}}", {src:src}).should.equal exp
      render("{{ src | newline_to_br }}", {src:src}).should.equal exp

    it "{{ 'now' | date:'format' }}", -> # Duplicates issue #1 from github
      exp = String((new Date()).getFullYear())
      render("{{'now' | date: '%Y'}}", {}).should.equal exp

    it "{{ date | date:'format' }}", ->
      src = new Date('8/30/2008')
      exp = "08.30.2008"
      fmt = "%m.%d.%Y"
      render("{{src|date:'%m.%d.%Y'}}", {src:src, fmt:fmt}).should.equal exp
      render("{{ src | date:'%m.%d.%Y' }}", {src:src, fmt:fmt}).should.equal exp
      render("{{src|date:fmt}}", {src:src, fmt:fmt}).should.equal exp
      render("{{ src | date:fmt }}", {src:src, fmt:fmt}).should.equal exp


    it "{{ collection | first }}", ->
      render("{{(1..3)|first}}").should.equal "1"
      render("{{ (1..3) | first }}").should.equal "1"
      render("{{c|first}}", {c:[1,2,3]}).should.equal "1"
      render("{{ c | first }}", {c:[1,2,3]}).should.equal "1"

    it "{{ collection | last }}", ->
      render("{{(1..3)|last}}").should.equal "3"
      render("{{ (1..3) | last }}").should.equal "3"
      render("{{c|last}}", {c:[1,2,3]}).should.equal "3"
      render("{{ c | last }}", {c:[1,2,3]}).should.equal "3"

  #? -----------------------------------------------------------------+
  describe "Testing tags...", ->

    it "{% assign varname = value %}", ->
      tmpl = Liquid.Template.parse("{% assign myVar = 'VALUE' %}.{{ myVar }}.");
      tmpl.render().should.equal '.VALUE.'

      tmpl = Liquid.Template.parse("{% assign myVar = 10 %}.{{ myVar }}.");
      tmpl.render().should.equal '.10.'

      tmpl = Liquid.Template.parse("{% assign myVar = 5.5 %}.{{ myVar }}.");
      tmpl.render().should.equal '.5.5.'

      tmpl = Liquid.Template.parse("{% assign myVar = (1..3) %}.{{ myVar }}.");
      tmpl.render().should.equal ".1,2,3."

      # Also make sure that nothing leaks out...
      tmpl = Liquid.Template.parse("{% assign myVar = 'foo' %}");
      tmpl.render().should.equal ''


    it "{% capture varname %} content {% endcapture %}", ->
      src = "{% capture myContent %}Good 'old content!{% endcapture %}Before {{ myContent }}";
      Liquid.Template.parse(src).render().should.equal "Before Good 'old content!"


    it "{% case conditionLeft %} {% when conditionRight %} {% else %} {% endcase %}", ->
      src = """
          {% case testVar %}
          {% when 1 %} One!{% when 2 %} Two!{% when 'test' %} Test!{% else %} Got me{% endcase %}
        """
      tmpl = Liquid.Template.parse(src)

      tmpl.render({ testVar:1 }).should.equal " One!"
      tmpl.render({ testVar:2 }).should.equal " Two!"
      tmpl.render({ testVar:'test' }).should.equal " Test!"
      tmpl.render({ testVar:null }).should.equal " Got me"
      tmpl.render({ }).should.equal " Got me"

    it "{% comment %} content {% endcomment %}", ->
      render("{% comment %} I'm a comment! {% endcomment %}").should.equal ""

    it "{% cycle 'odd', 'even' %}", ->
      src = "{% cycle 'odd', 'even' %} {% cycle 'odd', 'even' %} {% cycle 'odd', 'even' %}";
      render(src).should.equal 'odd even odd'

      src = "{% cycle 'odd', 'even' %}{% cycle 'odd', 'even' %}{% cycle 'odd', 'even' %}";
      render(src).should.equal 'oddevenodd'

    it "{% for item in collection %}{% endfor %}", ->
      render("{% for item in (1..3) %}{{ item }}{% endfor %}").should.equal "123"
      render("{% for item in (1..3) %} {{ forloop.index }} {% endfor %}").should.equal " 1  2  3 "
      render("{% for item in (1..3) %} {{ forloop.index0 }} {% endfor %}").should.equal " 0  1  2 "
      render("{% for item in (1..3) %} {{ forloop.first }} {% endfor %}").should.equal " true  false  false "
      render("{% for item in (1..3) %} {{ forloop.last }} {% endfor %}").should.equal " false  false  true "

    it "{% if conditions %}{% else %}{% endif %}", ->
      render("{% if true %}TRUE{% endif %}").should.equal "TRUE"
      render("{% if 1 == 1 %}TRUE{% endif %}").should.equal "TRUE"
      render("{% if 1 != 1 %}TRUE{% endif %}").should.equal ""
      render("{% if 1 > 1 %}TRUE{% endif %}").should.equal ""
      render("{% if 1 < 1 %}TRUE{% endif %}").should.equal ""
      render("{% if 1 <= 1 %}TRUE{% endif %}").should.equal "TRUE"
      render("{% if 1 >= 1 %}TRUE{% endif %}").should.equal "TRUE"
      render("{% if 'Test' contains 'T' %}TRUE{% endif %}").should.equal "TRUE"
      # Testing else as well...
      render("{% if true %}TRUE{% else %}FALSE{% endif %}").should.equal "TRUE"
      render("{% if 1 == 1 %}TRUE{% else %}FALSE{% endif %}").should.equal "TRUE"
      render("{% if 1 != 1 %}TRUE{% else %}FALSE{% endif %}").should.equal "FALSE"
      render("{% if 1 > 1 %}TRUE{% else %}FALSE{% endif %}").should.equal "FALSE"
      render("{% if 1 < 1 %}TRUE{% else %}FALSE{% endif %}").should.equal "FALSE"
      render("{% if 1 <= 1 %}TRUE{% else %}FALSE{% endif %}").should.equal "TRUE"
      render("{% if 1 >= 1 %}TRUE{% else %}FALSE{% endif %}").should.equal "TRUE"
      render("{% if 'Test' contains 'T' %}TRUE{% else %}FALSE{% endif %}").should.equal "TRUE"

    it "{% ifchanged %}{% endifchanged %}", ->
      render("{% for item in col %}{% ifchanged %}{{ item }}{% endifchanged %}{% endfor %}", {col:[1,1,1,2,2,2]})
      .should.equal "12"

    it "{% include 'templateName' %}", ->

      Liquid.Template.fileSystem =
        root: __dirname
        readTemplateFile: (path) ->
          if(path == 'simple')
            return "simple INCLUDED!";
          else
            return "{{ data }} INCLUDED!";

      render("{% include 'simple' %}").should.equal "simple INCLUDED!"
      render("{% include 'variable' with data:'Data' %}").should.equal "Data INCLUDED!"

    it "{% unless conditions %}{% else %}{% endunless %}", ->
      render("{% unless true %}TRUE{% endunless %}").should.equal ""
      render("{% unless 1 == 1 %}TRUE{% endunless %}").should.equal ""
      render("{% unless 1 != 1 %}TRUE{% endunless %}").should.equal "TRUE"
      render("{% unless 1 > 1 %}TRUE{% endunless %}").should.equal "TRUE"
      render("{% unless 1 < 1 %}TRUE{% endunless %}").should.equal "TRUE"
      render("{% unless 1 <= 1 %}TRUE{% endunless %}").should.equal ""
      render("{% unless 1 >= 1 %}TRUE{% endunless %}").should.equal ""
      render("{% unless 'Test' contains 'T' %}TRUE{% endunless %}").should.equal ""
      # Testing else as well...
      render("{% unless true %}TRUE{% else %}FALSE{% endunless %}").should.equal "FALSE"
      render("{% unless 1 == 1 %}TRUE{% else %}FALSE{% endunless %}").should.equal "FALSE"
      render("{% unless 1 != 1 %}TRUE{% else %}FALSE{% endunless %}").should.equal "TRUE"
      render("{% unless 1 > 1 %}TRUE{% else %}FALSE{% endunless %}").should.equal "TRUE"
      render("{% unless 1 < 1 %}TRUE{% else %}FALSE{% endunless %}").should.equal "TRUE"
      render("{% unless 1 <= 1 %}TRUE{% else %}FALSE{% endunless %}").should.equal "FALSE"
      render("{% unless 1 >= 1 %}TRUE{% else %}FALSE{% endunless %}").should.equal "FALSE"
      render("{% unless 'Test' contains 'T' %}TRUE{% else %}FALSE{% endunless %}").should.equal "FALSE"

  #? -----------------------------------------------------------------+
  describe "Testing context...", ->
    it "{{ collection['missing_key'].value }}", ->
      render("{{ collection['missing_key'].value }}").should.equal ""
      render("{{ collection['missing_key'].value }}", {collection: {}}).should.equal ""
