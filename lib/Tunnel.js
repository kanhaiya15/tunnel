var childProcess = require('child_process'),
  TunnelBinary = require('./TunnelBinary'),
  TunnelError = require('./TunnelError'),
  split = require('split');
function Tunnel() {
  this.tunnelId = undefined;
  this.isProcessRunning = false;
  this.retriesLeft = 5;

  this.start = function (options, fnCallback) {
    if (typeof options['onlyCommand'] !== 'undefined') {
      return fnCallback(null, true);
    }
    if ((!options['user']) || (!options['key'])) {
      return fnCallback(new TunnelError('user and key is required'), false);
    }

    var self = this;
    var binaryArguments = this._addArguments(options);
    this._getBinaryPath(options, function (binaryPath) {
      self.binaryPath = binaryPath;
      self.proc = childProcess.spawn(self.binaryPath, binaryArguments);
      self.proc.stdout.pipe(split()).on('data', function (data) {
        var match = data.match(/Tunnel ID \:[0-9]{5}/);
        if (match) {
          var tunnelSplit = match[0].split(':');
          if (tunnelSplit && tunnelSplit.length) {
            self.tunnelId = tunnelSplit[1];
            self.isProcessRunning = true;
          }
          return fnCallback(null, true);
        }
      });

      self.proc.stderr.pipe(split()).on('data', function (data) {
        self.tunnelId = undefined;
        self.isProcessRunning = false;
        return fnCallback(null, false);
      });

      self.proc.on('exit', function (code) {
        console.log("called here" + code)
        self.tunnelId = undefined;
        self.isProcessRunning = false;
        return fnCallback(null, false);
      });
    });
  };

  this.isRunning = function () {
    return this.proc && this.tunnelId && this.isProcessRunning;
  };

  this.stop = function (fnCallback) {
    try{
      if (!this.isRunning()) return fnCallback();
      this._killRunningProcess(function (e) {
        if (e) return fnCallback(new TunnelError(e));
        return fnCallback();
      });
    } catch (e) {
      return fnCallback(new TunnelError(e));
    }
  };

  this.getTunnelName = function () {
    return 'getTunnelName';
  };

  this._addArguments = function (options) {
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
    return binaryArgs;
  };
  // Get Binary file path
  this._getBinaryPath = function (options, fnCallback) {
    if (typeof (this.binaryPath) == 'undefined') {
      this.binary = new TunnelBinary();
      var conf = {};
      if ((options['proxyHost'] || options['proxyhost']) && (options['proxyPort'] || options['proxyport'])) {
        conf.proxyHost = options['proxyHost'] || options['proxyhost'];
        conf.proxyPort = options['proxyPort'] || options['proxyport'];
      }
      this.binary._binaryPath(conf, fnCallback);
    } else {
      return fnCallback(this.binaryPath);
    }
  };

  this._killRunningProcess = function (fnCallback) {
    try {
      if (this.proc) {
        this.proc.kill('SIGINT');
      }
      return fnCallback();
    } catch (e) {
      return fnCallback(e);
    }
  };
}

module.exports = Tunnel;
