var https = require('https'),
  url = require('url'),
  fs = require('fs'),
  path = require('path'),
  os = require('os'),
  HttpsProxyAgent = require('https-proxy-agent'),
  TunnelError = require('./TunnelError'),
  hashPath = 'https://s3.amazonaws.com/lambda-downloads/mac/latest';
function TunnelBinary() {
  this.hostOS = process.platform;
  this.is64bits = process.arch == 'x64';
  if (this.hostOS.match(/darwin|mac os/i)) {
    this.httpPath = 'https://s3.amazonaws.com/lambda-downloads/mac/LT';
  } else if (this.hostOS.match(/mswin|msys|mingw|cygwin|bccwin|wince|emc|win32/i)) {
    this.windows = true;
    this.httpPath = 'https://s3.amazonaws.com/lambda-downloads/windows/LT.exe';
  } else {
    if (this.is64bits)
      this.httpPath = 'https://s3.amazonaws.com/lambda-downloads/linux/LT';
    else
      this.httpPath = 'https://s3.amazonaws.com/bstack-local-prod/BrowserStackLocal-linux-ia32';
  }

  this._retryBinaryDownload = function (conf, destParentDir, fnCallback, retries, binaryPath) {
    var self = this;
    if (retries > 0) {
      console.log('Retrying Download. Retries left', retries);
      fs.stat(binaryPath, function (e) {
        if (!e) {
          fs.unlinkSync(binaryPath);
        }
        self._download(conf, destParentDir, fnCallback, retries - 1);
      });
    } else {
      console.error('Number of retries to download exceeded.');
    }
  };

  this._download = function (conf, destParentDir, fnCallback, retries) {
    var self = this;
    if (!this._checkPath(destParentDir)) {
      fs.mkdirSync(destParentDir);
    }

    var destBinaryName = (this.windows) ? 'LT.exe' : 'LT';
    var binaryPath = path.join(destParentDir, destBinaryName);
    var fileStream = fs.createWriteStream(binaryPath);

    var options = url.parse(this.httpPath);
    if (conf.proxyHost && conf.proxyPort) {
      options.agent = new HttpsProxyAgent({
        host: conf.proxyHost,
        port: conf.proxyPort
      });
    }

    https.get(options, function (response) {
      response.pipe(fileStream);
      response.on('error', function (e) {
        console.error('Got Error in binary download response', e);
        self.retryBinaryDownload(conf, destParentDir, fnCallback, retries, binaryPath);
      });
      fileStream.on('error', function (e) {
        console.error('Got Error while downloading binary file', e);
        self.retryBinaryDownload(conf, destParentDir, fnCallback, retries, binaryPath);
      });
      fileStream.on('close', function () {
        fs.chmod(binaryPath, '0755', function () {
          return fnCallback(binaryPath);
        });
      });
    }).on('error', function (e) {
      console.error('Got Error in binary downloading request', e);
      self.retryBinaryDownload(conf, destParentDir, fnCallback, retries, binaryPath);
    });
  };

  this._binaryPath = function (conf, fnCallback) {
    var destParentDir = this._availableDirs();
    var destBinaryName = (this.windows) ? 'LT.exe' : 'LT';
    var binaryPath = path.join(destParentDir, destBinaryName);
    if (this._checkPath(binaryPath, fs.X_OK)) {
      var that = this;
      this._fetchHash(function (hashContents) {
        var localHashPath = __dirname + '/hash.txt';
        if (!that._checkPath(localHashPath)) {
          var writeStream = fs.createWriteStream(localHashPath);
          writeStream.write(hashContents);
          writeStream.end();
          that._download(conf, destParentDir, fnCallback, 5);
        } else {
          var currentHashContents = fs.readFileSync(localHashPath, 'utf8');
          currentHashContents = currentHashContents.trim();
          if (hashContents === currentHashContents) {
            return fnCallback(binaryPath);
          } else {
            fs.writeFileSync(localHashPath, hashContents);
            that._download(conf, destParentDir, fnCallback, 5);
          }
        }
      })
    } else {
      this._download(conf, destParentDir, fnCallback, 5);
    }
  };

  this._checkPath = function (path, mode) {
    try {
      mode = mode || (fs.R_OK | fs.W_OK);
      fs.accessSync(path, mode);
      return true;
    } catch (e) {
      if (typeof fs.accessSync !== 'undefined') return false;
      try {
        fs.statSync(path);
        return true;
      } catch (e) {
        return false;
      }
    }
  };

  this._availableDirs = function () {
    var orderedPathLength = this.orderedPaths.length;
    for (var i = 0; i < orderedPathLength; i++) {
      var path = this.orderedPaths[i];
      if (this._makePath(path)) {
        return path;
      }
    }
    throw new TunnelError('Error trying to download LambdaTest Tunnel binary');
  };

  this._makePath = function (path) {
    try {
      if (!this._checkPath(path)) {
        fs.mkdirSync(path);
      }
      return true;
    } catch (e) {
      return false;
    }
  };

  this._homeDir = function () {
    if (typeof os.homedir === 'function') return os.homedir();

    var env = process.env;
    var home = env.HOME;
    var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

    if (process.platform === 'win32') {
      return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
    }

    if (process.platform === 'darwin') {
      return home || (user ? '/Users/' + user : null);
    }

    if (process.platform === 'linux') {
      return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
    }

    return home || null;
  };

  this._fetchHash = function (fnCallback) {
    var hashContents = '';
    https.get(hashPath, function (response) {
      response.on('error', function (e) {
        console.error('Got Error in binary download response', e);
        return fnCallback(hashContents);
      });
      response.on('data', function (chunk) {
        hashContents += chunk;
      });
      response.on('end', () => {
        hashContents = hashContents.trim();
        return fnCallback(hashContents);
      });
    }).on('error', function (e) {
      console.error('Got Error in hash downloading request', e);
      return fnCallback(hashContents);
    });
  };

  this.orderedPaths = [
    path.join(this._homeDir(), '.lambdatest'),
    process.cwd(),
    os.tmpdir()
  ];
}

module.exports = TunnelBinary;
