require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const plateRouter = require('./routers/plateRouter');

const app = express(); // Defina o app antes de criar o servidor
const server = http.createServer(app);
const io = socketIo(server);

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.json());
app.use(plateRouter);

app.post('/alerta', (req, res) => {
  const alertMessage =
    'Inconsistência de dados ou equipamentos foram detectados no sistema';
  io.sockets.emit('alert', { message: alertMessage });
  res.json({ mensagem: 'Alerta enviado com sucesso' });
});

const PORT = 8080; // ou a porta que você desejar

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // Exporte o app para os testes
