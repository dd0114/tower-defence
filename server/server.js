import { GameServer } from './GameServer.js';

const server = new GameServer(8080);

console.log('Tower Defense Game Server is running...');

// graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  process.exit(0);
});