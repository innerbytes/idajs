// The life.ts serves to show how we can decompose a TypeScript IdaJS project by modules.
// To see how a JavaScript project can be decomposed by modules, see the Bathroom sample.

import { useMyGameStore } from "./GameStore";

const outsideTwinsenHouseSceneId = 49; // Scene id of the outside of Twinsen's house
const voidSceneId = 94; // Scene id of the Void

export function twinsenTalksToMeteoMage(
  objectId: number,
  textId: number,
  choices: number[],
  meteoMageId: number
): void {
  ida.life(objectId, ida.Life.LM_MESSAGE, text.update(textId, "Hello!"));

  ida.life(objectId, ida.Life.LM_ADD_CHOICE, text.update(choices[0], "I like when it's stormy"));
  ida.life(objectId, ida.Life.LM_ADD_CHOICE, text.update(choices[1], "I prefer sunny weather"));
  ida.life(
    objectId,
    ida.Life.LM_ADD_CHOICE,
    text.update(choices[2], "Water, water, everywhere...")
  );

  ida.life(
    objectId,
    ida.Life.LM_ASK_CHOICE_OBJ,
    meteoMageId,
    text.update(textId, "Hello, Twinsen! Which weather do you prefer?")
  );

  const choice = ida.lifef(objectId, ida.Life.LF_CHOICE);
  const gameStore = useMyGameStore();

  // If we want stormy weather
  if (choice === choices[0]) {
    // If it's already stormy
    if (!gameStore.isSunny) {
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE_OBJ,
        meteoMageId,
        text.update(textId, "Ok, it is already stormy.")
      );
    } else {
      gameStore.isSunny = false;
      ida.life(objectId, ida.Life.LM_CHANGE_CUBE, outsideTwinsenHouseSceneId); // We need to reload scene to change the weather (palette changes)
    }
  }
  // If we want sunny weather
  else if (choice === choices[1]) {
    if (gameStore.isSunny) {
      ida.life(
        objectId,
        ida.Life.LM_MESSAGE_OBJ,
        meteoMageId,
        text.update(textId, "Ok, it is already sunny.")
      );
    } else {
      gameStore.isSunny = true;
      ida.life(objectId, ida.Life.LM_CHANGE_CUBE, outsideTwinsenHouseSceneId); // We need to reload scene to change the weather (palette changes)
    }
  } else {
    // A joke :)
    ida.life(objectId, ida.Life.LM_CHANGE_CUBE, voidSceneId);
  }
}
