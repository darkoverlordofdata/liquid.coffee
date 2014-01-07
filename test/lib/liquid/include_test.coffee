describe 'Liquid include tag ', ->

  it "{% include 'templateName' %}", ->

    Liquid.Template.fileSystem =
      root: __dirname
      readTemplateFile: (path) ->
        if(path == 'simple')
          return "simple INCLUDED!";
        else
          return "{{ data }} INCLUDED!";

    render("{% include 'simple' %}").should.equal "simple INCLUDED!"
    render("{% include 'variable' with data:'Data' %}").should.equal "Data INCLUDED!"

