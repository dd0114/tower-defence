export class GameRoom {
  constructor(roomId, players) {
    this.roomId = roomId;
    this.players = new Map();
    this.gameState = {
      timestamp: Date.now(),
      enemies: [],
      buildings: new Map(), // playerId -> buildings[]
      projectiles: [],
      playerStats: new Map() // playerId -> {coins, hearts, stage}
    };
    
    // 고정 틱레이트 설정
    this.TICK_RATE = 20; // 20 TPS
    this.TICK_INTERVAL = 1000 / this.TICK_RATE; // 50ms
    this.gameLoop = null;
    
    // 플레이어 초기화
    players.forEach((ws, index) => {
      this.players.set(ws.playerId, {
        ws: ws,
        position: index, // 0: left, 1: right
        connected: true,
        lastInputTime: Date.now()
      });
      
      // 초기 게임 상태 설정
      this.gameState.buildings.set(ws.playerId, []);
      this.gameState.playerStats.set(ws.playerId, {
        coins: 100,
        hearts: 3,
        stage: 1
      });
    });
  }

  startGame() {
    // 게임 시작 알림
    this.broadcastToAll({
      type: 'gameStart',
      roomId: this.roomId,
      players: Array.from(this.players.keys()),
      initialState: this.gameState
    });

    // 고정 틱레이트로 게임 루프 시작
    this.gameLoop = setInterval(() => {
      this.updateGameLogic();
      this.broadcastGameState();
    }, this.TICK_INTERVAL);

    console.log(`Game room ${this.roomId} started with ${this.players.size} players`);
  }

  updateGameLogic() {
    const deltaTime = this.TICK_INTERVAL;
    
    // 적 업데이트
    this.updateEnemies(deltaTime);
    
    // 건물 및 발사체 업데이트
    this.updateBuildings(deltaTime);
    this.updateProjectiles(deltaTime);
    
    // 충돌 검사
    this.handleCollisions();
    
    // 게임 종료 조건 확인
    this.checkGameEnd();
    
    // 타임스탬프 업데이트
    this.gameState.timestamp = Date.now();
  }

  updateEnemies(deltaTime) {
    this.gameState.enemies = this.gameState.enemies.filter(enemy => {
      // 적 이동 로직 (서버에서 권위적으로 처리)
      this.moveEnemy(enemy, deltaTime);
      
      // 화면을 벗어나면 제거 및 하트 감소
      if (enemy.position.y > 600) {
        const stats = this.gameState.playerStats.get(enemy.targetPlayer);
        if (stats) {
          stats.hearts -= 1;
        }
        return false; // 제거
      }
      
      return enemy.health > 0;
    });
  }

  moveEnemy(enemy, deltaTime) {
    // waypoint 기반 이동 (기존 로직과 동일하지만 서버에서 처리)
    const waypoints = [
      {x: 60, y: 60},
      {x: 300, y: 60},
      {x: 300, y: 300},
      {x: 540, y: 300},
      {x: 540, y: 540}
    ];
    
    const waypoint = waypoints[enemy.waypointIndex];
    if (!waypoint) return;
    
    const yDistance = waypoint.y - enemy.position.y;
    const xDistance = waypoint.x - enemy.position.x;
    const angle = Math.atan2(yDistance, xDistance);
    
    const normalizedSpeed = enemy.speed * (deltaTime / 16.67);
    
    enemy.position.x += Math.cos(angle) * normalizedSpeed;
    enemy.position.y += Math.sin(angle) * normalizedSpeed;
    
    if (Math.abs(yDistance) < normalizedSpeed && 
        Math.abs(xDistance) < normalizedSpeed &&
        enemy.waypointIndex < waypoints.length - 1) {
      enemy.waypointIndex++;
    }
  }

  updateBuildings(deltaTime) {
    this.gameState.buildings.forEach((buildings, playerId) => {
      buildings.forEach(building => {
        if (building.target && building.canShoot) {
          // 발사체 생성
          this.createProjectile(building, building.target);
          building.canShoot = false;
          
          // 공격 속도에 따른 재장전
          setTimeout(() => {
            building.canShoot = true;
          }, building.attackSpeed || 1000);
        }
      });
    });
  }

  updateProjectiles(deltaTime) {
    this.gameState.projectiles = this.gameState.projectiles.filter(projectile => {
      // 발사체 이동
      const angle = Math.atan2(
        projectile.target.position.y - projectile.position.y,
        projectile.target.position.x - projectile.position.x
      );
      
      const normalizedSpeed = projectile.speed * (deltaTime / 16.67);
      projectile.position.x += Math.cos(angle) * normalizedSpeed;
      projectile.position.y += Math.sin(angle) * normalizedSpeed;
      
      // 적과의 충돌 검사
      const distance = Math.hypot(
        projectile.position.x - projectile.target.position.x,
        projectile.position.y - projectile.target.position.y
      );
      
      if (distance < 20) {
        // 데미지 적용
        projectile.target.health -= projectile.damage;
        return false; // 발사체 제거
      }
      
      return true;
    });
  }

  handleCollisions() {
    // 적이 죽었을 때 처리
    this.gameState.enemies.forEach(enemy => {
      if (enemy.health <= 0 && !enemy.isDead) {
        enemy.isDead = true;
        
        // 코인 보상
        const stats = this.gameState.playerStats.get(enemy.killedBy);
        if (stats) {
          stats.coins += enemy.reward || 5;
        }
      }
    });
    
    // 죽은 적 제거
    this.gameState.enemies = this.gameState.enemies.filter(enemy => !enemy.isDead);
  }

  processPlayerInput(playerId, inputData) {
    if (!this.players.has(playerId)) return;
    
    // 입력 유효성 검사 및 지연 보상
    const playerPing = this.calculatePlayerPing(playerId);
    const inputTime = Date.now() - playerPing;
    
    switch (inputData.action) {
      case 'placeTower':
        this.handlePlaceTower(playerId, inputData);
        break;
      case 'sellTower':
        this.handleSellTower(playerId, inputData);
        break;
      case 'reroll':
        this.handleReroll(playerId, inputData);
        break;
      default:
        console.log('Unknown input action:', inputData.action);
    }
  }

  handlePlaceTower(playerId, inputData) {
    const playerStats = this.gameState.playerStats.get(playerId);
    const playerBuildings = this.gameState.buildings.get(playerId);
    
    if (playerStats.coins >= inputData.cost) {
      // 타워 배치 로직
      const newBuilding = {
        id: `tower_${Date.now()}_${Math.random()}`,
        position: inputData.position,
        type: inputData.towerType,
        playerId: playerId,
        health: 100,
        attackSpeed: 1000,
        canShoot: true,
        target: null
      };
      
      playerBuildings.push(newBuilding);
      playerStats.coins -= inputData.cost;
      
      // 클라이언트에 확인 전송
      this.sendToPlayer(playerId, {
        type: 'towerPlaced',
        data: {
          building: newBuilding,
          newCoinBalance: playerStats.coins
        }
      });
    } else {
      // 코인 부족
      this.sendToPlayer(playerId, {
        type: 'towerPlaceFailed',
        reason: 'insufficient_coins'
      });
    }
  }

  createProjectile(building, target) {
    const projectile = {
      id: `proj_${Date.now()}_${Math.random()}`,
      position: { ...building.position },
      target: target,
      speed: 5,
      damage: building.damage || 10,
      playerId: building.playerId
    };
    
    this.gameState.projectiles.push(projectile);
  }

  broadcastGameState() {
    const stateUpdate = {
      type: 'gameStateUpdate',
      timestamp: this.gameState.timestamp,
      data: {
        enemies: this.gameState.enemies,
        projectiles: this.gameState.projectiles,
        playerStats: Object.fromEntries(this.gameState.playerStats)
      }
    };
    
    this.broadcastToAll(stateUpdate);
  }

  broadcastToAll(message) {
    this.players.forEach((player) => {
      if (player.connected && player.ws.readyState === 1) {
        player.ws.send(JSON.stringify(message));
      }
    });
  }

  sendToPlayer(playerId, message) {
    const player = this.players.get(playerId);
    if (player && player.connected && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify(message));
    }
  }

  calculatePlayerPing(playerId) {
    // 실제로는 ping 측정 로직 구현 필요
    return 50; // 임시값
  }

  checkGameEnd() {
    // 게임 종료 조건 체크
    let alivePlayers = 0;
    let winner = null;
    
    this.gameState.playerStats.forEach((stats, playerId) => {
      if (stats.hearts > 0) {
        alivePlayers++;
        winner = playerId;
      }
    });
    
    if (alivePlayers <= 1) {
      this.endGame(winner);
    }
  }

  endGame(winner) {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
      this.gameLoop = null;
    }
    
    this.broadcastToAll({
      type: 'gameEnd',
      winner: winner,
      finalStats: Object.fromEntries(this.gameState.playerStats)
    });
    
    console.log(`Game ${this.roomId} ended. Winner: ${winner}`);
  }

  handlePlayerDisconnect(playerId) {
    const player = this.players.get(playerId);
    if (player) {
      player.connected = false;
      
      // 게임 일시정지 또는 AI로 대체 로직
      this.broadcastToAll({
        type: 'playerDisconnected',
        playerId: playerId
      });
    }
  }

  hasPlayer(playerId) {
    return this.players.has(playerId);
  }

  isEmpty() {
    return Array.from(this.players.values()).every(player => !player.connected);
  }
}