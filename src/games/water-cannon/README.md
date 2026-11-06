# Water Cannon

Soak the targets on the three rails before your tank runs dry.

## Under the Christmas skin: Snowball Cannon

With the Christmas skin, the game is **Snowball Cannon**: an elf tests the
workshop's new toys by firing snowballs at them as they ride past. The targets
are toys (wrapped presents on the top rail, wooden soldiers in the middle and
teddy bears at the bottom), the shots are snowballs that burst into snow, and the
booth is a workshop wall with a snowy shelf. The counter reads `Snowballs 12/15`
and the game over line reads "Out of snowballs! You scored N".

Only the look and the words change. The rules, the controls, the 15 shots, the
rail speeds and the scoring below are the same under both skins, and so is the
game's id, `water-cannon`, so scores from either skin go on the same board.

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

- `game.ts`: the game logic (`createState`, `fire`, `press`, `step`, `scoreForHit`, `placeText`,
  `labelsFor`, `toyFor`) and the
  `waterCannon` entry, the default export the midway finds.
- `game.test.ts`: tests for the game logic.
