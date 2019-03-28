// module.exports.Tunnel = require('./lib/Tunnel');

var LambdatestTunnel = require('./lib/Tunnel');

// var tunnel = new LambdatestTunnel();
// tunnel.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelR76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
//   console.log("Started LambdatestTunnel Status " + status);
//   console.log(tunnel.isRunning());
// })
// var tunnel = new LambdatestTunnel();
// tunnel.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
//   console.log("Started LambdatestTunnel2 Status " + status);
// })

var tunnel2 = new LambdatestTunnel();
tunnel2.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
  console.log("Started LambdatestTunnel2 Status " + status);
  console.log('tunnel2.start ' +tunnel2.isRunning());
  tunnel2.stop(function(){
    console.log('tunnel2.stop ' + tunnel2.isRunning());
  });
})

var tunnel3 = new LambdatestTunnel();
tunnel3.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
  console.log("Started LambdatestTunnel3 Status " + status);
  console.log('tunnel3.start ' +tunnel3.isRunning());
})
var tunnel4 = new LambdatestTunnel();
tunnel4.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
  console.log("Started LambdatestTunnel4 Status " + status);
  console.log('tunnel4.start ' +tunnel4.isRunning());
})

// var tunnel3 = new LambdatestTunnel();
// tunnel3.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
//   console.log("Started LambdatestTunnel2 Status " + status);
// })
// var tunnel3 = new LambdatestTunnel();
// tunnel3.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
//   console.log("Started LambdatestTunnel2 Status " + status);
// })
// var tunnel4 = new LambdatestTunnel();
// tunnel4.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
//   console.log("Started LambdatestTunnel2 Status " + status);
// })
// var tunnel5 = new LambdatestTunnel();
// tunnel5.start({ key: 'jbhUoF5lLRIjAN9DGp4jtoQZaGCyLUXEelRf76m4ZVbrKR3KFo', user:'kanhaiya1501@gmail.com' }, function(e, status) {
//   console.log("Started LambdatestTunnel2 Status " + status);
// })

// var getPort = require('get-port');
 
// getPort(function (err, port) {
//   console.log(port);
//   //=> 51402
// });


// var Logger = require('./lib/ELKLogger');
// var elkLogger = new Logger();
// elkLogger._log();