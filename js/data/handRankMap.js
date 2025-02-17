import {HandRank} from '../enums/handRank.js';

export class HandRankInfo {
  constructor(
    name,
    view = {lineColor: null, lineThick: 0, icon: ""},
    projectTile = {power: 1, speed: 1, spawnTime : 1, range: 1, radius: 1, color: "orange"}
  ) {
    this.name = name;
    this.view = view;
    this.projectTile = projectTile;
  }
}

export const handRankInfoMap = {};

handRankInfoMap[HandRank.ROYAL_STRAIGHT_FLUSH] = new HandRankInfo(
  HandRank.ROYAL_STRAIGHT_FLUSH,
  {
    lineColor: 'Black', lineThick: 15, icon: '🐉'
  },
  {
    power: 500, speed: 3, spawnTime : 50, range: 10, radius: 10, color: "Black"
  }
);

handRankInfoMap[HandRank.STRAIGHT_FLUSH] = new HandRankInfo(
  HandRank.STRAIGHT_FLUSH,
  {
    lineColor: 'Gold', lineThick: 15, icon: '🐉'
  },
  {
    power: 300, speed: 3, spawnTime : 50, range: 10, radius: 10, color: "Gold"
  }
);

handRankInfoMap[HandRank.FOUR_CARD] = new HandRankInfo(
  HandRank.FOUR_CARD,
  {
    lineColor: 'Gold', lineThick: 15, icon: '🐦‍🔥'
  },
  {
    power: 100, speed: 1, spawnTime : 50, range: 10, radius: 5, color: "Red"
  }
);

handRankInfoMap[HandRank.FULL_HOUSE] = new HandRankInfo(
  HandRank.FULL_HOUSE,
  {
    lineColor: 'Purple', lineThick: 10, icon: '🪐'
  },
  {
    power: 100, speed: 0.3, spawnTime: 1, range: 100, radius:5, color: "Purple"
  }
);

handRankInfoMap[HandRank.FLUSH] = new HandRankInfo(
  HandRank.FLUSH,
  {
    lineColor: 'Blue', lineThick: 10, icon: '🌊'
  },
  {
    power: 1, speed: 1, spawnTime: 100, range: 2, radius:3, color: "Blue"
  }
);

handRankInfoMap[HandRank.STRAIGHT] = new HandRankInfo(
  HandRank.STRAIGHT,
  {
    lineColor: 'Yellow', lineThick: 7, icon: '💫️'
  },
  {
    power: 10, speed: 10, spawnTime: 3, range: 3, radius:1, color: "Yellow"
  }
);

handRankInfoMap[HandRank.TRIPLE] = new HandRankInfo(
  HandRank.TRIPLE,
  {
    lineColor: 'Brown', lineThick: 5, icon: '🏹'
  },
  {
    power: 10, speed: 3, spawnTime: 1, range: 3, radius: 2, color : 'Brown'
  }
);

handRankInfoMap[HandRank.TWO_PAIR] = new HandRankInfo(
  HandRank.TWO_PAIR,
  {
    lineColor: 'rgba(135, 206, 235, 0.5)', lineThick: 3, icon: '⚔️'
  },
  {
    power: 3, speed: 2, spawnTime: 2, range: 1.5, radius: 1, color : 'rgba(135, 206, 235, 0.5)'
  }
);

handRankInfoMap[HandRank.ONE_PAIR] = new HandRankInfo(
  HandRank.ONE_PAIR,
  {
    lineColor: 'Gray', lineThick: 2, icon: '🗡'
  },
  {
    power: 2, speed: 1, spawnTime: 1, range: 1.5, radius: 1, color : 'gray'
  }
);