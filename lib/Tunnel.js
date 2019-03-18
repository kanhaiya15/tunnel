var childProcess = require('child_process'),
  fs = require('fs'),
  running = require('is-running'),
  TunnelBinary = require('./TunnelBinary'),
  TunnelError = require('./TunnelError'),
  psTree = require('ps-tree');

function Tunnel(){
  this.pid = undefined;
  this.isProcessRunning = false;
  this.retriesLeft = 5;

  this.start = function(options, fnCallback){
    if(typeof options['onlyCommand'] !== 'undefined') {
      return fnCallback();
    }

    if((!options['user']) || (!options['key'])){
      return fnCallback(new TunnelError('user and key is required'));
    }
    
    var self = this;
    var binaryArguments = this._addArguments(options);
    this._getBinaryPath(options, function(binaryPath){
      self.binaryPath = binaryPath;
      self.tunnel = childProcess.execFile(self.binaryPath, binaryArguments, { detached: true }, function(error, stdout, stderr){
        if(error) {
          console.error('Error while trying to execute binary', error);
          if(self.retriesLeft > 0) {
            console.log('Retrying Binary Download. Retries Left', self.retriesLeft);
            self.retriesLeft -= 1;
            fs.unlinkSync(self.binaryPath);
            delete(self.binaryPath);
            return self.start(options, fnCallback);
          } else {
            return fnCallback(new TunnelError(error.toString()));
          }
        }
        console.log(self);
        var data = {};
        if(stdout)
          data = JSON.parse(stdout);
        else if(stderr)
          data = JSON.parse(stderr);
        else
          return fnCallback(new TunnelError('No output received'));
        if(data['state'] != 'connected'){
          return fnCallback(new TunnelError(data['message']['message']));
        } else {
          self.pid = data['pid'];
          self.isProcessRunning = true;
          return fnCallback();
        }
      });
    });
  };

  this.isRunning = function(){
    return this.pid && running(this.pid) && this.isProcessRunning;
  };

  this.stop = function (fnCallback) {
    if(!this.pid) return fnCallback();
    this._killRunningProcesses(function(error){
      if(error) fnCallback(new TunnelError(error.toString()));
      fnCallback();
    });
  };

  this.getTunnelName = function(){
    return 'getTunnelName';
  };

  this._addArguments = function(options){
    var binaryArgs = [];
    for(var key in options){
      var value = options[key];
      switch(key){
        case 'user':
        case 'key':
        case 'port':
          if(value) {
            binaryArgs.push('--' + key);
            binaryArgs.push(value);
          }
          break;

        case 'tunnelName':
        case 'tunnelname':
          if(value) {
            binaryArgs.push('--tunnelName');
            binaryArgs.push(value);
          }
          break;

        case 'proxyHost':
        case 'proxyhost':
          if(value) {
            binaryArgs.push('--proxy-host');
            binaryArgs.push(value);
          }
          break;

        case 'proxyPort':
        case 'proxyport':
          if(value) {
            binaryArgs.push('--proxy-port');
            binaryArgs.push(value);
          }
          break;

        case 'proxyUser':
        case 'proxyuser':
          if(value) {
            binaryArgs.push('--proxy-user');
            binaryArgs.push(value);
          }
          break;

        case 'proxyPass':
        case 'proxypass':
          if(value) {
            binaryArgs.push('--proxy-pass');
            binaryArgs.push(value);
          }
          break;

        case 'localDirectory':
        case 'localdirectory':
        case 'localDir':
        case 'localdir':
          if(value) {
            binaryArgs.push('--dir');
            binaryArgs.push(value);
          }
          break;

        case 'env':
        case 'environment':
          if(value) {
            binaryArgs.push('--env');
            binaryArgs.push(value);
          }
          break;

        case 'verbose':
        case 'v':
          if(value) {
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
          if(value) {
            binaryArgs.push('--config');
            binaryArgs.push(value);
          }
          break;

        case 'sharedTunnel':
        case 'sharedtunnel':
          if(value) {
            binaryArgs.push('--shared-tunnel');
            binaryArgs.push(value);
          }
          break;

        case 'localDomains':
        case 'localdomains':
          if(value) {
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
          if(value) {
            binaryArgs.push('--output-config');
            binaryArgs.push(value);
          }
          break;

        case 'dns':
        case 'DNS':
        case 'Dns':
          if(value) {
            binaryArgs.push('--dns');
            binaryArgs.push(value);
          }
          break;

        case 'pidFile':
        case 'pidfile':
          if(value) {
            binaryArgs.push('--pidfile');
            binaryArgs.push(value);
          }
          break;

        case 'pac':
        case 'Pac':
        case 'PAC':
          if(value) {
            binaryArgs.push('--pac');
            binaryArgs.push(value);
          }
          break;
      }
    }
    return binaryArgs;
  };
  // Get Binary file path
  this._getBinaryPath = function(options, fnCallback){
    if(typeof(this.binaryPath) == 'undefined'){
      this.binary = new TunnelBinary();
      var conf = {};
      if(options['proxyHost'] && options['proxyPort']){
        conf.proxyHost = options['proxyHost'];
        conf.proxyPort = options['proxyPort'];
      }
      this.binary._binaryPath(conf, fnCallback);
    } else {
      return fnCallback(this.binaryPath);
    }
  };

  this._killRunningProcesses = function(fnCallback){
    psTree(this.pid, (err, children) => {
      var childPids = children.map(val => val.PID);
      var killChecker = setInterval(() => {
        if(childPids.length === 0) {
          clearInterval(killChecker);
          try {
            process.kill(this.pid);
            setTimeout(() => {
              this.isProcessRunning = false;
              fnCallback();
            }, 2000);
          } catch(err) {
            this.isProcessRunning = false;
            fnCallback();
          }
        }
        for(var i in childPids) {
          try {
            process.kill(childPids[i]);
          } catch(err) {
            childPids.splice(i, 1);
          }
        }
      },500);
    });
  };
}

module.exports = Tunnel;
