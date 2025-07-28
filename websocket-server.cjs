// 간단한 WebSocket 서버 (CommonJS)
const http = require('http');
const crypto = require('crypto');

class SimpleWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.clients = new Map();
    this.waitingPlayers = [];
    this.games = new Map();
    this.setupServer();
  }

  setupServer() {
    this.server = http.createServer();
    
    this.server.on('upgrade', (request, socket, head) => {
      this.handleUpgrade(request, socket, head);
    });

    this.server.listen(this.port, () => {
      console.log(`WebSocket server running on port ${this.port}`);
      console.log('Ready for multiplayer connections!');
      console.log('\n=== 테스트 방법 ===');
      console.log('1. 크롬에서 multiplayer.html 열기');
      console.log('2. 사파리에서 multiplayer.html 열기');
      console.log('3. 각각 "Connect to Server" → "Find Match" 클릭');
      console.log('4. 2명 매칭되면 게임 시작!');
    });
  }

  handleUpgrade(request, socket, head) {
    const key = request.headers['sec-websocket-key'];
    const acceptKey = this.generateAcceptKey(key);
    
    const responseHeaders = [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '',
      ''
    ].join('\r\n');

    socket.write(responseHeaders);
    
    const clientId = `client_${Date.now()}_${Math.random()}`;
    this.clients.set(clientId, { socket, clientId });
    
    socket.on('data', (buffer) => {
      const message = this.parseWebSocketFrame(buffer);
      if (message) {
        this.handleMessage(clientId, message);
      }
    });

    socket.on('close', () => {
      this.handleDisconnect(clientId);
    });
    
    console.log(`✅ Client ${clientId} connected (${this.clients.size} total)`);
  }

  generateAcceptKey(key) {
    const magicString = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    return crypto
      .createHash('sha1')
      .update(key + magicString)
      .digest('base64');
  }

  parseWebSocketFrame(buffer) {
    if (buffer.length < 2) return null;
    
    const firstByte = buffer[0];
    const secondByte = buffer[1];
    
    const opCode = firstByte & 0x0f;
    const masked = (secondByte & 0x80) === 0x80;
    
    let payloadLength = secondByte & 0x7f;
    let offset = 2;
    
    if (payloadLength === 126) {
      payloadLength = buffer.readUInt16BE(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      payloadLength = buffer.readBigUInt64BE(offset);
      offset += 8;
    }
    
    let maskKey;
    if (masked) {
      maskKey = buffer.slice(offset, offset + 4);
      offset += 4;
    }
    
    const payload = buffer.slice(offset, offset + Number(payloadLength));
    
    if (masked) {
      for (let i = 0; i < payload.length; i++) {
        payload[i] ^= maskKey[i % 4];
      }
    }
    
    try {
      return JSON.parse(payload.toString('utf8'));
    } catch (e) {
      return null;
    }
  }

  sendMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;
    
    const payload = JSON.stringify(message);
    const payloadBuffer = Buffer.from(payload, 'utf8');
    
    let frame;
    if (payloadBuffer.length < 126) {
      frame = Buffer.allocUnsafe(2);
      frame[0] = 0x81; // FIN + text frame
      frame[1] = payloadBuffer.length;
    } else if (payloadBuffer.length < 65536) {
      frame = Buffer.allocUnsafe(4);
      frame[0] = 0x81;
      frame[1] = 126;
      frame.writeUInt16BE(payloadBuffer.length, 2);
    } else {
      frame = Buffer.allocUnsafe(10);
      frame[0] = 0x81;
      frame[1] = 127;
      frame.writeBigUInt64BE(BigInt(payloadBuffer.length), 2);
    }
    
    client.socket.write(Buffer.concat([frame, payloadBuffer]));
  }

  handleMessage(clientId, message) {
    console.log(`📨 Message from ${clientId}: ${message.type}`);
    
    switch (message.type) {
      case 'findMatch':
        this.handleFindMatch(clientId, message.data);
        break;
      case 'playerInput':
        this.handlePlayerInput(clientId, message.data);
        break;
      case 'ping':
        this.sendMessage(clientId, { type: 'pong', timestamp: Date.now() });
        break;
    }
  }

  handleFindMatch(clientId, playerData) {
    this.waitingPlayers.push(clientId);
    console.log(`🔍 Player searching for match... (${this.waitingPlayers.length}/2)`);
    
    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers.shift();
      const player2 = this.waitingPlayers.shift();
      
      const gameId = `game_${Date.now()}`;
      this.games.set(gameId, { players: [player1, player2] });
      
      // 게임 시작 알림
      [player1, player2].forEach(playerId => {
        this.sendMessage(playerId, {
          type: 'gameStart',
          roomId: gameId,
          players: [player1, player2],
          initialState: {
            timestamp: Date.now(),
            enemies: [],
            playerStats: {
              [player1]: { coins: 100, hearts: 3, stage: 1 },
              [player2]: { coins: 100, hearts: 3, stage: 1 }
            }
          }
        });
      });
      
      console.log(`🎮 Game ${gameId} started! Players: ${player1} vs ${player2}`);
    } else {
      this.sendMessage(clientId, {
        type: 'waitingForMatch',
        message: 'Waiting for opponent...'
      });
    }
  }

  handlePlayerInput(clientId, inputData) {
    console.log(`🎯 Player action: ${inputData.action}`);
    
    // 같은 게임의 다른 플레이어에게 브로드캐스트
    const game = this.findGameByPlayer(clientId);
    if (game) {
      game.players.forEach(playerId => {
        if (playerId !== clientId) {
          this.sendMessage(playerId, {
            type: 'playerAction',
            playerId: clientId,
            data: inputData
          });
        }
      });
    }
  }

  findGameByPlayer(clientId) {
    for (const game of this.games.values()) {
      if (game.players.includes(clientId)) {
        return game;
      }
    }
    return null;
  }

  handleDisconnect(clientId) {
    console.log(`❌ Client ${clientId} disconnected`);
    
    // 대기열에서 제거
    const waitingIndex = this.waitingPlayers.indexOf(clientId);
    if (waitingIndex > -1) {
      this.waitingPlayers.splice(waitingIndex, 1);
    }
    
    // 게임에서 제거
    const game = this.findGameByPlayer(clientId);
    if (game) {
      game.players.forEach(playerId => {
        if (playerId !== clientId) {
          this.sendMessage(playerId, {
            type: 'playerDisconnected',
            playerId: clientId
          });
        }
      });
    }
    
    this.clients.delete(clientId);
  }
}

// 서버 시작
new SimpleWebSocketServer(8080);