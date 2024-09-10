import { Vector2, vec2 } from "littlejsengine";

// Pathfinding function using A* algorithm

export type RoadNode = { pos: Vector2; overpass: boolean };

export function findPath(start: RoadNode, goal: RoadNode): RoadNode[] | null {
  start = { pos: vec2(Math.floor(start.pos.x), Math.floor(start.pos.y)), overpass: start.overpass };
  goal = { pos: vec2(Math.floor(goal.pos.x), Math.floor(goal.pos.y)), overpass: goal.overpass };

  const openSet: RoadNode[] = [start];
  const cameFrom = new Map<string, RoadNode | null>();
  const gScore = new Map<string, number>();
  gScore.set(toKey(start), 0);
  const fScore = new Map<string, number>();
  fScore.set(toKey(start), heuristic(start.pos, goal.pos));

  while (openSet.length > 0) {
    const current = openSet.reduce((a, b) =>
      fScore.get(toKey(a)) ?? Infinity < (fScore.get(toKey(b)) ?? Infinity) ? a : b
    );
    if (current.pos.x === goal.pos.x && current.pos.y === goal.pos.y && current.overpass === goal.overpass) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(openSet.indexOf(current), 1);
    if (!navGraph.has(toKey(current))) {
      throw new Error("Pathfinding error: missing node in navGraph");
    }
    for (const neighbor of navGraph.get(toKey(current))!) {
      const tentativegScore = gScore.get(toKey(current))! + neighbor.cost;
      if (tentativegScore < (gScore.get(toKey({pos: neighbor.pos, overpass: neighbor.overpass})) ?? Infinity)) {
        cameFrom.set(toKey({pos: neighbor.pos, overpass: neighbor.overpass}), current);
        gScore.set(toKey({pos: neighbor.pos, overpass: neighbor.overpass}), tentativegScore);
        fScore.set(toKey({pos: neighbor.pos, overpass: neighbor.overpass}), tentativegScore + heuristic(neighbor.pos, goal.pos));
        if (!openSet.find(({ pos: {x, y}, overpass }) => x === neighbor.pos.x && y === neighbor.pos.y && overpass === neighbor.overpass)) {
          openSet.push({pos: neighbor.pos, overpass: neighbor.overpass});
        }
      }
    }
  }

  // Return null if no path is found
  return null;
}

// Heuristic function for A* (using Chebyshev distance)
function heuristic(a: Vector2, b: Vector2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

// Function to reconstruct the path from start to goal
function reconstructPath(cameFrom: Map<string, RoadNode | null>, current: RoadNode): RoadNode[] {
  const totalPath: RoadNode[] = [{pos: current.pos.add(vec2(0.5, 0.5)), overpass: current.overpass}];
  while (cameFrom.has(toKey(current))) {
    current = cameFrom.get(toKey(current))!;
    // get the middle of the tile
    const waypoint = {pos: current.pos.add(vec2(0.5, 0.5)), overpass: current.overpass};
    totalPath.unshift(waypoint);
  }
  return totalPath;
}

// Helper function to convert coordinates to a string key for the graph
export const toKey = (roadNode: RoadNode) => `${roadNode.pos.x},${roadNode.pos.y},${roadNode.overpass}`; // Define the graph as an adjacency list with movement costs
export const fromKey: (key: string) => RoadNode = (key: string) => ({
  pos: vec2(...key.split(",").map(Number)),
  overpass: key.split(",")[2] === "true",
});

export const navGraph = new Map<string, { pos: Vector2; cost: number, overpass: boolean }[]>();
