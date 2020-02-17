module.exports = function(io) {
  global.SOCKET_DATA = {};

  io.on('connection', (socket) => {
    socket.emit('CONNECTION SUCCESS', 'Done')
    socket.join(`BOAT DEMO`);

    socket.on('disconnect', () => {
      socket.leave('BOAT DEMO');
    })
  })
}
