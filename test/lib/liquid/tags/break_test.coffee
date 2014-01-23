describe 'Liquid break tag ', ->

  it "{% break %}", ->
    render("{% break %}").should.equal ""

