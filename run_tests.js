var kill = require('kill-process'),
  path = require('path'),
  selenium = require('selenium-standalone'),
  spawn = require('child_process').spawn;
var procs = [],
  errors = [];

var isWin = /^win/.test(process.platform);

const closeProcs = () => {
  console.log('closing procs');
  procs.forEach(function(proc) {
    kill(proc.pid);
  });
  return;
}

process.on('unhandledRejection', (reason, p) => {
  console.error(reason, 'Unhandled Rejection at Promise', p);
  closeProcs();
  process.exit(1);
}).on('uncaughtException', err => {
  console.error(err, 'Uncaught Exception thrown');
  closeProcs();
  process.exit(1);
}).on('SIGINT', function() {
  console.log('Caught interrupt signal');
  closeProcs();
  process.exit();
});

const startServerProcess = () => {
  return new Promise((resolve, reject) => {
    var server_process = spawn('node', ['./test_server.js']);
    procs.push(server_process);
    server_process.on('message', function(message) {
        console.log(message);
    });
    server_process.stdout.on('data', function(data) {
      var message = data.toString();
      console.log(message);

      if (message.indexOf('port 3000') != -1) {
          resolve();
      }
    });
  });
};

const startSelenium = () => {
  return new Promise((resolve, reject) => {
    console.log('starting selenium');
    selenium.start({
      drivers: {
        chrome: {
          // check for more recent versions of chrome driver here:
          // https://chromedriver.storage.googleapis.com/index.html
          version: '2.31',
          arch: process.arch,
          baseURL: 'https://chromedriver.storage.googleapis.com'
        },
      }, spawnOptions: {stdio: 'inherit'}}, (err, selenium_proc) => {
      if (err) {
        console.error('Error starting selenium: ');
        console.error(err);
        return reject(err);
      }
      procs.push(selenium_proc);

      console.log('selenium started');
      resolve();
    });
  });
};

const runTestPackage = ((package_name, callback) => {
  return new Promise((resolve, reject) => {
    var wdio_conf_file = 'wdio.conf.js';
    console.log('running test package: ' + wdio_conf_file);
    var wdio_proc = spawn(path.join(__dirname, 'node_modules', '.bin', 'wdio' + (isWin ? '.cmd' : '')),
      [wdio_conf_file], {'stdio': 'inherit'});
    wdio_proc.on('error', function(data) {
      return reject(new Error(data.toString()));
    });
    wdio_proc.on('close', function(code) {
      if (code == 0)
        resolve();
      else
        reject('wdio exited with code: ' + code);
    });
  });
});

startServerProcess()
  .then(startSelenium)
  .then(runTestPackage)
  .catch((reason) => {
    errors.push(reason);
    console.log('Error running ' + __filename);
  })
  .then(() => {
    closeProcs();
    if (errors.length) {
      console.error('Errors in ' + __filename);
      errors.forEach(function(error) {
        console.error(error);
      });
      process.exit(-1);
    }
    else {
      console.log('Successfully run tests');
    }
  });
