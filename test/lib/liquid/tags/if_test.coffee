describe 'Liquid if tag ', ->

  it "{% if conditions %}{% else %}{% endif %}", ->
    render("{% if year == 2007 %}2007{% endif %}", year: 2007).should.equal "2007"
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
