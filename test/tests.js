const wdio = require('wdio');
const chai = require('chai');

describe('wdio tests', function() {
  var browser;
  before(function() {
    browser = wdio.getBrowser({desiredCapabilities: {browserName: 'chrome'}});
    browser.init();
  });

  after(function() {
    browser.end();
  });

  it('should hit the base url', function() {
    browser.url('http://localhost:3000');
  });
});
