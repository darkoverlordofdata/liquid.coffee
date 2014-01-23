describe 'given a template with an extends tag', ->

  Liquid.Template.fileSystem =
    root: __dirname
    readTemplateFile: (path) ->
      if path is 'simple'
        "test"
      else if path is 'complex'
        """
          beginning

          {% block thing %}
          rarrgh
          {% endblock %}

          {% block another %}
          bum
          {% endblock %}

          end
        """
      else if path is 'nested'
        """
          {% extends 'complex' %}

          {% block thing %}
          from nested
          {% endblock %}

          {% block another %}
          from nested (another)
          {% endblock %}
        """
      else
        """
          {% extends 'complex' %}

          {% block thing %}
          from nested
          {% endblock %}
        """



  it "should output the contents of the extended template", ->

    render("{% extends 'simple' %}").should.contain "test"

    render("""
        {% extends 'simple' %}

        {% block thing %}
        yeah
        {% endblock %}

      """).should.contain "test"



  it 'should render original content of block if no child block given', ->

    test = render("{% extends 'complex' %}")
    test.should.contain "rarrgh"
    test.should.contain "bum"


  it 'should render child content of block if child block given', ->

    test = render("""
        {% extends 'complex' %}

        {% block thing %}
        booyeah
        {% endblock %}
      """)
    test.should.contain "booyeah"
    test.should.contain "bum"


  it 'should render child content of blocks if multiple child blocks given', ->

    test = render("""
        {% extends 'complex' %}

        {% block thing %}
        booyeah
        {% endblock %}

        {% block another %}
        blurb
        {% endblock %}
      """)
    test.should.contain "booyeah"
    test.should.contain "blurb"

  it 'should remember context of child template', ->

    test = render("""
        {% extends 'complex' %}

        {% block thing %}
        booyeah
        {% endblock %}

        {% block another %}
        {{ a }}
        {% endblock %}
      """, a: 1234)
    test.should.contain "booyeah"
    test.should.contain "1234"


  it 'should work with nested templates', ->

    test = render("""
        {% extends 'nested' %}

        {% block thing %}
        booyeah
        {% endblock %}
      """, a: 1234)
    test.should.contain "booyeah"
    test.should.contain "from nested"

  it 'should work with nested templates if middle template skips a block', ->

    test = render("""
        {% extends 'nested2' %}

        {% block another %}
        win
        {% endblock %}
      """)
    test.should.contain "win"

  it 'should render parent for block.super', ->

    test = render("""
        {% extends 'complex' %}

        {% block thing %}
        {{ block.super }}
        {% endblock %}
      """, a: 1234)
    test.should.contain "rarrgh"
