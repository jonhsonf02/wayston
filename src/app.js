const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

app.set('io', io);

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', service: 'waystone-api' });
});

app.use('/api/v1/auth', require('./routes/auth.routes'));
app.use('/api/v1/admin', require('./routes/admin.routes'));
app.use('/api/v1/track', require('./routes/public.routes'));

io.on('connection', (socket) => {
  socket.on('join', (trackingNumber) => {
    socket.join(`shipment:${trackingNumber}`);
  });
});

module.exports = { app, server, io };