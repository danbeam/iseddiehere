(function(global) {

const HERE_FILE = 'here.txt';
const PASSWORD_FILE = 'password.txt';
const SECRET_FILE = 'secret.txt';

var app = require('express')();
var server = require('http').Server(app);
var port = process.env.PORT || 5000;
var fs = require('fs');

function read(file) {
  return fs.readFileSync(file, {encoding: 'utf8'}).trim();
}

const SECRET = read(SECRET_FILE);

function auth(req, res, next) {
  var user = require('basic-auth')(req);
  if (user && user.pass == read(PASSWORD_FILE)) {
    res.set('Set-Cookie', 'secret=' + SECRET);
    // TODO: re-generate a nonce here and require it for status changes.
    next();
  } else {
    res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
    res.sendStatus(401);
  }
}

function createHandler(file) {
  return function(req, res) {
    res.sendFile(__dirname + '/' + file);
  };
}

function defined(arg) {
  return arg !== undefined;
}

[
  {
    path: '/',
    file: 'index.html',
  },
  {
    path: '/app.css',
    file: 'app.css',
  },
  {
    path: '/app.js',
    file: 'app.js',
  },
  {
    path: '/icon.png',
    file: 'icon.png',
  },
  {
    path: '/me',
    file: 'me.html',
    auth: auth
  },
  {
    path: '/robots.txt',
    file: 'robots.txt',
  },
].forEach(function(route) {
  var args = [route.path, route.auth, createHandler(route.file)];
  app.get.apply(app, args.filter(defined));
});

console.log('here', global.here = read(HERE_FILE));

var sockets = [];

require('socket.io')(server).on('connect', function(socket) {
  sockets.push(socket);
  console.log(sockets.length, 'connected')

  socket.emit('change', global.here);

  socket.on(SECRET, function(here) {
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

server.listen(port);

})(this);
