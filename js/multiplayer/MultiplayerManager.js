export class MultiplayerManager {
  constructor() {
    this.ws = null;
    this.playerId = `player_${Date.now()}_${Math.random()}`;
    this.playerName = 'Player';
    this.connected = false;
    this.ping = 0;
    
    // 게임 상태 분리
    this.serverGameState = {
      timestamp: 0,
      enemies: [],
      projectiles: [],
      playerStats: {}
    };
    
    this.localGameState = {
      timestamp: 0,
      enemies: [],
      projectiles: [],
      playerStats: {},
      buildings: new Map() // 로컬 예측용
    };
    
    // 입력 버퍼 (서버 응답 대기 중인 입력들)
    this.inputBuffer = [];
    this.pendingActions = new Map();
    
    // 상태 히스토리 (보간용)
    this.stateHistory = [];
    this.MAX_HISTORY_SIZE = 60; // 3초치 (20TPS 기준)
    
    this.setupEventHandlers();
  }

  connect(serverUrl = 'ws://localhost:8080') {
    try {
      this.ws = new WebSocket(serverUrl);
      this.setupWebSocket();
    } catch (error) {
      console.error('Failed to connect to server:', error);
    }
  }

  setupWebSocket() {
    this.ws.onopen = () => {
      console.log('Connected to game server');
      this.connected = true;
      this.startPingMeasurement();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleServerMessage(message);
      } catch (error) {
        console.error('Invalid server message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from server');
      this.connected = false;
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  setupEventHandlers() {
    // 게임 이벤트 리스너들
    document.addEventListener('towerPlace', (event) => {
      this.sendPlayerInput('placeTower', event.detail);
    });

    document.addEventListener('towerSell', (event) => {
      this.sendPlayerInput('sellTower', event.detail);
    });

    document.addEventListener('reroll', (event) => {
      this.sendPlayerInput('reroll', event.detail);
    });
  }

  findMatch() {
    if (!this.connected) {
      console.error('Not connected to server');
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'findMatch',
      data: {
        playerId: this.playerId,
        playerName: this.playerName
      }
    }));
  }

  sendPlayerInput(action, data) {
    if (!this.connected) return;

    const input = {
      action: action,
      timestamp: Date.now(),
      data: data,
      inputId: `input_${Date.now()}_${Math.random()}`
    };

    // 로컬에서 즉시 예측 실행
    this.executeActionLocally(input);

    // 서버로 전송
    this.ws.send(JSON.stringify({
      type: 'playerInput',
      data: input
    }));

    // 입력 버퍼에 저장 (서버 응답 대기)
    this.inputBuffer.push(input);
    this.pendingActions.set(input.inputId, input);
  }

  executeActionLocally(input) {
    switch (input.action) {
      case 'placeTower':
        this.predictTowerPlacement(input.data);
        break;
      case 'sellTower':
        this.predictTowerSale(input.data);
        break;
      case 'reroll':
        this.predictReroll(input.data);
        break;
    }
  }

  predictTowerPlacement(data) {
    // 로컬에서 즉시 타워 배치 (회색으로 표시)
    const playerBuildings = this.localGameState.buildings.get(this.playerId) || [];
    
    const predictedTower = {
      id: `pending_${Date.now()}`,
      position: data.position,
      type: data.towerType,
      state: 'pending',
      opacity: 0.5,
      playerId: this.playerId
    };

    playerBuildings.push(predictedTower);
    this.localGameState.buildings.set(this.playerId, playerBuildings);

    // 코인 즉시 차감 (예측)
    if (this.localGameState.playerStats[this.playerId]) {
      this.localGameState.playerStats[this.playerId].coins -= data.cost;
    }
  }

  predictTowerSale(data) {
    const playerBuildings = this.localGameState.buildings.get(this.playerId) || [];
    const towerIndex = playerBuildings.findIndex(b => b.id === data.towerId);
    
    if (towerIndex > -1) {
      const tower = playerBuildings[towerIndex];
      tower.state = 'selling';
      tower.opacity = 0.3;
      
      // 코인 즉시 추가 (예측)
      if (this.localGameState.playerStats[this.playerId]) {
        this.localGameState.playerStats[this.playerId].coins += data.sellPrice;
      }
    }
  }

  handleServerMessage(message) {
    switch (message.type) {
      case 'waitingForMatch':
        console.log('Waiting for opponent...');
        break;
        
      case 'gameStart':
        this.handleGameStart(message);
        break;
        
      case 'gameStateUpdate':
        this.handleGameStateUpdate(message);
        break;
        
      case 'towerPlaced':
        this.handleTowerPlaceConfirm(message.data);
        break;
        
      case 'towerPlaceFailed':
        this.handleTowerPlaceFailed(message);
        break;
        
      case 'gameEnd':
        this.handleGameEnd(message);
        break;
        
      case 'pong':
        this.handlePong(message.timestamp);
        break;
        
      default:
        console.log('Unknown server message:', message.type);
    }
  }

  handleGameStart(message) {
    console.log('Game started!', message);
    this.serverGameState = message.initialState;
    this.localGameState = JSON.parse(JSON.stringify(message.initialState));
    
    // 게임 시작 이벤트 발생
    document.dispatchEvent(new CustomEvent('multiplayerGameStart', {
      detail: message
    }));
  }

  handleGameStateUpdate(message) {
    // 서버 상태를 히스토리에 저장
    this.stateHistory.push({
      timestamp: message.timestamp,
      data: message.data
    });

    // 히스토리 크기 제한
    if (this.stateHistory.length > this.MAX_HISTORY_SIZE) {
      this.stateHistory.shift();
    }

    // 서버 상태로 업데이트
    this.serverGameState = {
      timestamp: message.timestamp,
      ...message.data
    };

    // 서버 상태와 로컬 상태 동기화
    this.reconcileWithServerState();
  }

  reconcileWithServerState() {
    const timeDiff = this.serverGameState.timestamp - this.localGameState.timestamp;
    
    // 시간 차이가 큰 경우 서버 상태로 스냅
    if (Math.abs(timeDiff) > 200) {
      this.localGameState = JSON.parse(JSON.stringify(this.serverGameState));
      return;
    }

    // 적과 발사체는 서버 상태 우선
    this.localGameState.enemies = [...this.serverGameState.enemies];
    this.localGameState.projectiles = [...this.serverGameState.projectiles];
    
    // 플레이어 스탯은 부드럽게 보간
    this.interpolatePlayerStats();
  }

  interpolatePlayerStats() {
    Object.keys(this.serverGameState.playerStats).forEach(playerId => {
      const serverStats = this.serverGameState.playerStats[playerId];
      const localStats = this.localGameState.playerStats[playerId];
      
      if (localStats && serverStats) {
        // 코인과 하트는 즉시 동기화 (중요한 값이므로)
        localStats.hearts = serverStats.hearts;
        
        // 코인은 부드럽게 보간 (애니메이션 효과)
        const coinDiff = serverStats.coins - localStats.coins;
        if (Math.abs(coinDiff) < 50) {
          localStats.coins += coinDiff * 0.1;
        } else {
          localStats.coins = serverStats.coins;
        }
      }
    });
  }

  handleTowerPlaceConfirm(data) {
    // 대기 중인 타워를 확정된 타워로 교체
    const playerBuildings = this.localGameState.buildings.get(this.playerId) || [];
    const pendingIndex = playerBuildings.findIndex(b => b.state === 'pending');
    
    if (pendingIndex > -1) {
      playerBuildings[pendingIndex] = {
        ...data.building,
        state: 'confirmed',
        opacity: 1.0
      };
    }

    // 해당 입력을 버퍼에서 제거
    this.inputBuffer = this.inputBuffer.filter(input => 
      input.action !== 'placeTower' || input.timestamp < data.building.timestamp
    );
  }

  handleTowerPlaceFailed(message) {
    // 실패한 타워 제거
    const playerBuildings = this.localGameState.buildings.get(this.playerId) || [];
    const pendingIndex = playerBuildings.findIndex(b => b.state === 'pending');
    
    if (pendingIndex > -1) {
      playerBuildings.splice(pendingIndex, 1);
    }

    // 코인 복구
    if (message.reason === 'insufficient_coins') {
      console.log('Not enough coins to place tower');
    }
  }

  // 보간된 게임 상태 반환
  getInterpolatedGameState() {
    const now = Date.now();
    const renderDelay = 100; // 100ms 지연 (네트워크 지연 보상)
    const targetTime = now - renderDelay;

    // 타겟 시간 근처의 두 상태를 찾아서 보간
    let beforeState = null;
    let afterState = null;

    for (let i = this.stateHistory.length - 1; i >= 0; i--) {
      const state = this.stateHistory[i];
      if (state.timestamp <= targetTime) {
        beforeState = state;
        afterState = this.stateHistory[i + 1];
        break;
      }
    }

    if (!beforeState) {
      return this.localGameState;
    }

    if (!afterState) {
      return beforeState.data;
    }

    // 선형 보간
    const t = (targetTime - beforeState.timestamp) / 
              (afterState.timestamp - beforeState.timestamp);
    
    return this.interpolateStates(beforeState.data, afterState.data, t);
  }

  interpolateStates(state1, state2, t) {
    const interpolated = JSON.parse(JSON.stringify(state1));
    
    // 적 위치 보간
    interpolated.enemies.forEach((enemy, index) => {
      const enemy2 = state2.enemies[index];
      if (enemy2) {
        enemy.position.x = this.lerp(enemy.position.x, enemy2.position.x, t);
        enemy.position.y = this.lerp(enemy.position.y, enemy2.position.y, t);
      }
    });

    // 발사체 위치 보간
    interpolated.projectiles.forEach((projectile, index) => {
      const projectile2 = state2.projectiles[index];
      if (projectile2) {
        projectile.position.x = this.lerp(projectile.position.x, projectile2.position.x, t);
        projectile.position.y = this.lerp(projectile.position.y, projectile2.position.y, t);
      }
    });

    return interpolated;
  }

  lerp(a, b, t) {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }

  startPingMeasurement() {
    setInterval(() => {
      if (this.connected) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 1000);
  }

  handlePong(serverTimestamp) {
    this.ping = Date.now() - serverTimestamp;
  }

  getLocalGameState() {
    return this.localGameState;
  }

  getServerGameState() {
    return this.serverGameState;
  }

  getPing() {
    return this.ping;
  }

  isConnected() {
    return this.connected;
  }
}