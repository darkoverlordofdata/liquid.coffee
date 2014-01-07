describe 'Liquid cycle tag ', ->

  it "{% cycle 'odd', 'even' %}", ->
    src = "{% cycle 'odd', 'even' %} {% cycle 'odd', 'even' %} {% cycle 'odd', 'even' %}";
    render(src).should.equal 'odd even odd'

    src = "{% cycle 'odd', 'even' %}{% cycle 'odd', 'even' %}{% cycle 'odd', 'even' %}";
    render(src).should.equal 'oddevenodd'
