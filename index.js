// module.exports.Tunnel = require('./lib/Tunnel');

var LambdatestTunnel = require('./lib/Tunnel');

var tunnel = new LambdatestTunnel();
tunnel.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
  if(e) throw e;
  console.log("Started LambdatestTunnel Status" + status);
})

// var getPort = require('get-port');
 
// getPort(function (err, port) {
//   console.log(port);
//   //=> 51402
// });