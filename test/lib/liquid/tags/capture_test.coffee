describe "Liquid capture tag ", ->

  it "{% capture varname %} content {% endcapture %}", ->
      src = "{% capture myContent %}Good 'old content!{% endcapture %}Before {{ myContent }}";
      Liquid.Template.parse(src).render().should.equal "Before Good 'old content!"
