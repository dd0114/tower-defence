import { config } from "./config.js";

export const waypoints = [

  {
    x : config.grid * 0.5,
    y : (config.numOfHeight + 0.2) * config.grid
  },
  {
    x : config.grid * 0.5,
    y : config.grid * 0.5
  },
  {
    x : (config.numOfWidth - 0.5) * config.grid,
    y : config.grid * 0.5
  },
  {
    x : (config.numOfWidth - 0.5) * config.grid,
    y : (config.numOfHeight + 1) * config.grid
  }

]
