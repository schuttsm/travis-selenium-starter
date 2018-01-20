const wdio = require('wdio');
const chai = require('chai');

describe('wdio tests', function() {
  var browser = wdio.getBrowser({
      desiredCapabilities: {
          browserName: 'firefox'
      }
  });

  before(wdio.wrap(function() {
      browser.init();
  }));

  after(wdio.wrap(function() {
      browser.end();
  }));

  it('should hit the base url', wdio.wrap(function() {
    browser.url('http://localhost:3000');
  }));
});
