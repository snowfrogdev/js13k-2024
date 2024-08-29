import { Vector2, vec2 } from "littlejsengine";

// Pathfinding function using A* algorithm
export function findPath(start: Vector2, goal: Vector2): Vector2[] | null {
  start = vec2(Math.floor(start.x), Math.floor(start.y));
  goal = vec2(Math.floor(goal.x), Math.floor(goal.y));

  const openSet: Vector2[] = [start];
  const cameFrom = new Map<string, Vector2 | null>();
  const gScore = new Map<string, number>();
  gScore.set(toKey(start), 0);
  const fScore = new Map<string, number>();
  fScore.set(toKey(start), heuristic(start, goal));

  while (openSet.length > 0) {
    const current = openSet.reduce((a, b) =>
      fScore.get(toKey(a)) ?? Infinity < (fScore.get(toKey(b)) ?? Infinity) ? a : b
    );
    if (current.x === goal.x && current.y === goal.y) {
      return reconstructPath(cameFrom, current);
    }

    openSet.splice(openSet.indexOf(current), 1);
    for (const neighbor of navGraph.get(toKey(current))!) {
      const tentativegScore = gScore.get(toKey(current))! + neighbor.cost;
      if (tentativegScore < (gScore.get(toKey(neighbor.pos)) ?? Infinity)) {
        cameFrom.set(toKey(neighbor.pos), current);
        gScore.set(toKey(neighbor.pos), tentativegScore);
        fScore.set(toKey(neighbor.pos), tentativegScore + heuristic(neighbor.pos, goal));
        if (!openSet.find(({ x, y }) => x === neighbor.pos.x && y === neighbor.pos.y)) {
          openSet.push(neighbor.pos);
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
function reconstructPath(cameFrom: Map<string, Vector2 | null>, current: Vector2): Vector2[] {
  const totalPath = [current.add(vec2(0.5, 0.5))];
  while (cameFrom.has(toKey(current))) {
    current = cameFrom.get(toKey(current))!;
    // get the middle of the tile
    const waypoint = current.add(vec2(0.5, 0.5));
    totalPath.unshift(waypoint);
  }
  return totalPath;
} // Helper function to convert coordinates to a string key for the graph

export const toKey = (pos: Vector2) => `${pos.x},${pos.y}`; // Define the graph as an adjacency list with movement costs

export const navGraph = new Map<string, { pos: Vector2; cost: number }[]>();
