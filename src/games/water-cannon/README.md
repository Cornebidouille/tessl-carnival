# Water Cannon

Soak the targets on the three rails before your tank runs dry.

## How to play

- Move the mouse to aim the cannon, and click or press Space to fire a shot of water.
  Holding Space down fires a single shot.
- You have 15 shots. The game ends when the tank is empty and the last shot has landed.
- Click or press Space on the game over screen to play another round.

## Scoring

Each target scores 10 points for every 60 px/s of speed, rounded up:

| Rail   | Speed    | Points |
| ------ | -------- | ------ |
| Top    | 180 px/s | 30     |
| Middle | 120 px/s | 20     |
| Bottom | 60 px/s  | 10     |

Your final score is saved to the carnival's score board when the game ends.
The game over screen then shows where that score landed among your recorded
water cannon scores: "New best!" for 1st place, otherwise "2nd best score",
"3rd best score" and so on. A score that ties an earlier one takes the better place.

## Files

- `game.ts`: the game logic (`createState`, `fire`, `press`, `step`, `scoreForHit`, `placeText`) and the
  `waterCannon` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
