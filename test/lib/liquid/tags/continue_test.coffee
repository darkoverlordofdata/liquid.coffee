describe 'Liquid continue tag ', ->

  it "{% continue %}", ->
    render("{% continue %}").should.equal ""

