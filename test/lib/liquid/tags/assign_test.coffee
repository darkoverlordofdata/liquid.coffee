describe 'Liquid assign tag ', ->
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


