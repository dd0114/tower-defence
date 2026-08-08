import { WebSocketServer } from 'ws';
import { GameRoom } from './GameRoom.js';

export class GameServer {
  constructor(port = 8080) {
    this.wss = new WebSocketServer({ port });
    this.rooms = new Map();
    this.waitingPlayers = [];
    
    console.log(`Game server started on port ${port}`);
    this.setupWebSocket();
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected');
      
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Invalid message format:', error);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case 'findMatch':
        this.handleFindMatch(ws, message.data);
        break;
      case 'playerInput':
        this.handlePlayerInput(ws, message.data);
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
        break;
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  handleFindMatch(ws, playerData) {
    ws.playerId = playerData.playerId;
    ws.playerName = playerData.playerName;
    
    this.waitingPlayers.push(ws);
    
    // 2명이 모이면 게임 시작
    if (this.waitingPlayers.length >= 2) {
      const player1 = this.waitingPlayers.shift();
      const player2 = this.waitingPlayers.shift();
      
      const roomId = `room_${Date.now()}`;
      const gameRoom = new GameRoom(roomId, [player1, player2]);
      
      this.rooms.set(roomId, gameRoom);
      gameRoom.startGame();
      
      console.log(`Game started: ${roomId}`);
    } else {
      ws.send(JSON.stringify({
        type: 'waitingForMatch',
        message: 'Waiting for opponent...'
      }));
    }
  }

  handlePlayerInput(ws, inputData) {
    // 플레이어가 속한 방 찾기
    const room = this.findPlayerRoom(ws.playerId);
    if (room) {
      room.processPlayerInput(ws.playerId, inputData);
    }
  }

  handleDisconnect(ws) {
    // 대기열에서 제거
    const waitingIndex = this.waitingPlayers.indexOf(ws);
    if (waitingIndex > -1) {
      this.waitingPlayers.splice(waitingIndex, 1);
    }

    // 게임 방에서 제거
    const room = this.findPlayerRoom(ws.playerId);
    if (room) {
      room.handlePlayerDisconnect(ws.playerId);
      
      // 방이 비어있으면 제거
      if (room.isEmpty()) {
        this.rooms.delete(room.roomId);
      }
    }
    
    console.log('Client disconnected');
  }

  findPlayerRoom(playerId) {
    for (const room of this.rooms.values()) {
      if (room.hasPlayer(playerId)) {
        return room;
      }
    }
    return null;
  }
}