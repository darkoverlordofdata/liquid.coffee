describe 'Smoke test: ' , ->

  describe 'verify the api', ->

    it "class module", ->

      #Liquid.should.be.a 'function'
      Liquid.should.have.property 'Template'
      Liquid.should.have.property 'Drop'
      Liquid.should.have.property 'Tag'
      Liquid.should.have.property 'Block'

  describe "plain text pass-thru", ->

    it "'plain text'", ->

      render('plain text').should.equal 'plain text'

