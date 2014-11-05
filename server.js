(function(global) {

const HERE_FILE = 'here.txt';
const PASSWORD_FILE = 'password.txt';

var app = require('express')();
var server = require('http').Server(app);
var fs = require('fs');

function read(file) {
  return fs.readFileSync(file, {encoding: 'utf8'}).trim();
}

server.listen(80);

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

function auth(req, res, next) {
  var user = require('basic-auth')(req);
  if (user && user.pass == read(PASSWORD_FILE)) {
    // TODO: re-generate a nonce here and require it for status changes.
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
  return res.sendStatus(401);
}

app.get('/me', auth, function(req, res) {
  res.sendFile(__dirname + '/me.html');
});

console.log('here', global.here = read(HERE_FILE));

var sockets = [];

require('socket.io')(server).on('connect', function(socket) {
  sockets.push(socket);
  console.log(sockets.length, 'connected')

  socket.emit('change', global.here);

  socket.on('change', function(here) {
    console.log('change', here);
    sockets.forEach(function(s) { s.emit('change', here); });
    fs.writeFile(HERE_FILE, here, {encoding: 'utf8'});
    global.here = here;
  });

  socket.on('disconnect', function() {
    sockets.splice(sockets.indexOf(socket), 1);
    console.log(sockets.length, 'connected');
  });
});

})(this);
