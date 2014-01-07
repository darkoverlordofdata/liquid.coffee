describe 'Liquid comment tag ', ->

  it "{% comment %} content {% endcomment %}", ->
    render("{% comment %} I'm a comment! {% endcomment %}").should.equal ""

