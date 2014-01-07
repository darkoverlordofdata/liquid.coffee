describe "Liquid case tag ", ->

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
