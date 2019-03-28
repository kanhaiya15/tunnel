var childProcess = require('child_process'),
  TunnelBinary = require('./TunnelBinary'),
  ELKLogger = require('./ELKLogger'),
  split = require('split'),
  request = require('request'),
  getPort = require('get-port'),
  AUTH_API_URL = 'https://stage-accounts.lambdatest.com/api/user/token/auth';

function Tunnel() {
  this.isProcessRunning = false;
  this.retriesLeft = 5;
  this.options = null;
  this.start = function (options, fnCallback) {
    this.options = options;
    if (typeof options['onlyCommand'] !== 'undefined') {
      return fnCallback(null, true);
    }
    if ((!options['user']) || (!options['key'])) {
      return fnCallback({ message: 'user and key is required' }, false);
    }

    _verifyToken(options, (e, res) => {
      if (e) {
        ELKLogger(options['user'], options['key'], { filename: __filename }, res || e);
        console.log(res.message || res || e);
        return fnCallback(res || e, false);
      }
      var self = this;
      this._getBinaryPath(options, function (binaryPath) {
        self.binaryPath = binaryPath;
        var retryBinaryCount = 5;
        _runBinary(self, retryBinaryCount, fnCallback);
      });
    });
  };

  this.isRunning = function () {
    return this.isProcessRunning && this.proc && true;
  };

  this.stop = function (fnCallback) {
    try {
      if (!this.isRunning()) return fnCallback();
      var that = this;
      _killRunningProcess(that, function (e) {
        if (e) {
          ELKLogger(that.options['user'], that.options['key'], { filename: __filename }, e);
          return fnCallback(e);
        }
        return fnCallback();
      });
    } catch (e) {
      ELKLogger(this.options['user'], this.options['key'], { filename: __filename }, e);
      return fnCallback(e);
    }
  };

  this.getTunnelName = function () {
    return 'getTunnelName';
  };

  // Get Binary file path
  this._getBinaryPath = function (options, fnCallback) {
    if (typeof (this.binaryPath) == 'undefined') {
      this.binary = new TunnelBinary();
      var conf = {
        user: options['user'],
        key: options['key']
      };
      if ((options['proxyHost'] || options['proxyhost']) && (options['proxyPort'] || options['proxyport'])) {
        conf.proxyHost = options['proxyHost'] || options['proxyhost'];
        conf.proxyPort = options['proxyPort'] || options['proxyport'];
      }
      this.binary._binaryPath(conf, fnCallback);
    } else {
      return fnCallback(this.binaryPath);
    }
  };
}

function _runBinary(self, retryBinaryCount, fnCallback) {

  if(retryBinaryCount >= 0){
    _addArguments(self.options, function(e, binaryArguments) {
      if(e) {
        ELKLogger(self.options['user'], self.options['key'], { filename: __filename }, e);
        return fnCallback(null, false);
      }
      self.proc = childProcess.spawn(self.binaryPath, binaryArguments);
      var isCallback = false;
      self.proc.stdout.pipe(split()).on('data', function (data) {
        if(!isCallback){
          self.isProcessRunning = true;
          isCallback = true
          return fnCallback(null, true);
        }
      });

      self.proc.stderr.pipe(split()).on('data', function (data) {
        ELKLogger(self.options['user'], self.options['key'], { filename: __filename }, data);
        self.isProcessRunning = false;
        if(!isCallback) {
          return fnCallback(null, false);
        }
      });

      self.proc.on('exit', function (code) {
        if(code && code === 2) {
          _runBinary(self, retryBinaryCount - 1, fnCallback);
        }
        ELKLogger(self.options['user'], self.options['key'], { filename: __filename }, code);
        self.isProcessRunning = false;
        if(!isCallback) {
          return fnCallback(null, false);
        }
      });
    });
    
  } else {
    ELKLogger(self.options['user'], self.options['key'], { filename: __filename }, 'Number of retries to run binary exceeded.');
    return fnCallback(null, false);
  }
}

function _verifyToken(options, fnCallback) {
  try {
    request.post({
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      url: AUTH_API_URL,
      body: JSON.stringify({
        "username": options['user'],
        "token": options['key']
      })
    }, function(e, response, json){
      if(e) {
        ELKLogger(options['user'], options['key'], { filename: __filename }, e);
        return fnCallback(true, e);
      } else {
        if(typeof json === 'string') {
          json = JSON.parse(json);
        }
        if (json && json.type === 'error') {
          ELKLogger(options['user'], options['key'], { filename: __filename }, json);
          return fnCallback(true, json);
        }
        return fnCallback(false, json);
      }
    });
  } catch (e) {
    ELKLogger(options['user'], options['key'], { filename: __filename }, e);
    return fnCallback(true, e);
  }
};

function _killRunningProcess (that, fnCallback) {
  try {
    if (that.proc) {
      that.proc.on('exit', function () {
        return fnCallback();
      });
      that.proc.kill('SIGINT');
    } else {
      return fnCallback();
    }
  } catch (e) {
    ELKLogger(that.options['user'], that.options['key'], { filename: __filename }, e);
    return fnCallback(e);
  }
};

function _addArguments(options, fnCallback) {
  try {
    var binaryArgs = [];
    for (var key in options) {
      var value = options[key];
      switch (key) {
        case 'user':
        case 'key':
        case 'port':
          if (value) {
            binaryArgs.push('--' + key);
            binaryArgs.push(value);
          }
          break;

        case 'tunnelName':
        case 'tunnelname':
          if (value) {
            binaryArgs.push('--tunnelName');
            binaryArgs.push(value);
          }
          break;

        case 'proxyHost':
        case 'proxyhost':
          if (value) {
            binaryArgs.push('--proxy-host');
            binaryArgs.push(value);
          }
          break;

        case 'proxyPort':
        case 'proxyport':
          if (value) {
            binaryArgs.push('--proxy-port');
            binaryArgs.push(value);
          }
          break;

        case 'proxyUser':
        case 'proxyuser':
          if (value) {
            binaryArgs.push('--proxy-user');
            binaryArgs.push(value);
          }
          break;

        case 'proxyPass':
        case 'proxypass':
          if (value) {
            binaryArgs.push('--proxy-pass');
            binaryArgs.push(value);
          }
          break;

        case 'localDirectory':
        case 'localdirectory':
        case 'localDir':
        case 'localdir':
        case 'dir':
          if (value) {
            binaryArgs.push('--dir');
            binaryArgs.push(value);
          }
          break;

        case 'env':
        case 'environment':
          if (value) {
            binaryArgs.push('--env');
            binaryArgs.push(value);
          }
          break;

        case 'verbose':
        case 'v':
          if (value) {
            binaryArgs.push('--v');
            binaryArgs.push(value);
          }
          break;

        case 'configurationFile':
        case 'configurationfile':
        case 'confFile':
        case 'conffile':
        case 'configFile':
        case 'configfile':
          if (value) {
            binaryArgs.push('--config');
            binaryArgs.push(value);
          }
          break;

        case 'sharedTunnel':
        case 'sharedtunnel':
        case 'shared-tunnel':
          if (value) {
            binaryArgs.push('--shared-tunnel');
            binaryArgs.push(value);
          }
          break;

        case 'localDomains':
        case 'localdomains':
        case 'local-domains':
          if (value) {
            binaryArgs.push('--local-domains');
            binaryArgs.push(value);
          }
          break;

        case 'outputConfiguration':
        case 'outputconfiguration':
        case 'outputConf':
        case 'outputconf':
        case 'outputConfig':
        case 'outputconfig':
        case 'output-config':
          if (value) {
            binaryArgs.push('--output-config');
            binaryArgs.push(value);
          }
          break;

        case 'dns':
        case 'DNS':
        case 'Dns':
          if (value) {
            binaryArgs.push('--dns');
            binaryArgs.push(value);
          }
          break;

        case 'pidFile':
        case 'pidfile':
          if (value) {
            binaryArgs.push('--pidfile');
            binaryArgs.push(value);
          }
          break;

        case 'pac':
        case 'Pac':
        case 'PAC':
          if (value) {
            binaryArgs.push('--pac');
            binaryArgs.push(value);
          }
          break;
      }
    }
    _getFreePort(options, 5, function(e, port){
      // if(typeof port === 'number') {
      //   binaryArgs.push('--infoAPIPort');
      //   binaryArgs.push(port);
      // }
      ELKLogger(options['user'], options['key'], { filename: __filename }, binaryArgs);
      return fnCallback(false, binaryArgs);
    })
  } catch(e) {
    return fnCallback(true, e);
  }
};

function _getFreePort(options, retryCount, fnCallback){
  getPort(function (e, port) {
    if(e) {
      if(retryCount >= 0){
        _getFreePort(options, retryCount -1 , fnCallback);
      } else {
        ELKLogger(options['user'], options['key'], { filename: __filename }, ('Error trying to get Free Port on LambdaTest Tunnel' + e));
        throw Error('Error trying to get Free Port on LambdaTest Tunnel, Please contact support' + e);
      }
    }
    return fnCallback(false, port);
  });
}

module.exports = Tunnel;
