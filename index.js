let WebSocketServer = require('websocket').server;
let http = require('http');
let clients = [];
let usernames = [];

let server = http.createServer(function (request, response) {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});
server.listen(process.env.PORT, function () {});
console.log('listen on port: ' + process.env.PORT);

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

// WebSocket server
wsServer.on('request', function (request) {
  let myUsername;
  let myChats = {};
  var connection = request.accept(null, request.origin);
  // console.log(connection);
  // connection.send();

  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on('message', function (message) {
    // console.log(message.utf8Data);
    let jsonMessage = JSON.parse(message.utf8Data);
    switch (jsonMessage.aksi) {
      case 'daftar':
        console.log(jsonMessage.username);
        //if user is not yet used then register him/her
        if (usernames.indexOf(jsonMessage.username) < 0) {
          clients.push({
            username: jsonMessage.username,
            koneksi: connection
          });
          usernames.push(jsonMessage.username);
          myUsername = jsonMessage.username;
          broadcastUserOnline();
        } else {
          connection.send(convertToPayload({
            aksi: 'tanyaLagi',
          }));
        }
        break;
      case 'kirim':
        // simpan pesan di variable
        /* myChats[jsonMessage.penerima].push({
          pesan: jsonMessage.pesan,
          tipe: 'yours'
        }); */
        let index = usernames.indexOf(jsonMessage.penerima);
        let payload = convertToPayload({
          pesan: jsonMessage.pesan,
          aksi: 'terima',
          pengirim: myUsername
        });
        clients[index].koneksi.send(payload);
        break;
      default:
        console.log('action unknown');
        break;
    }
  });

  connection.on('close', function (connection) {
    // close user connection
    let index = usernames.indexOf(myUsername);
    usernames.splice(index, 1);
    clients.splice(index, 1);
    broadcastUserOnline();
    console.log('client disconnected');
  });
});

function kirimUserOnline(connection) {
  let payload = convertToPayload({
    aksi: 'refreshUserOnline',
    usernames: usernames
  })
  connection.send(payload);
}

function broadcastUserOnline() {
  clients.forEach(function (client) {
    kirimUserOnline(client.koneksi);
  });
}

function convertToPayload(json) {
  return JSON.stringify(json);
}