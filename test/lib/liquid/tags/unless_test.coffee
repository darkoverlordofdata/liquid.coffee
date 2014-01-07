describe 'Liquid unless tag ', ->

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
