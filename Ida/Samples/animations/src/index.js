// Set the entityId you want to inspect here
// See Ida/srcjs/architect/entities.md for the list of entities
const entityId = 20;

// ============================================================================================

console.log(`
This is an animations viewer to find the needed animation and body for an entity.

Press action button to change animations.

Approach the frog and press action button to change body.

See the Console for all the bodies and animations available for the selected entity.

Start a new game to run this viewer.
`);

const sceneId = 80;

var textId;
let animations;
let bodies;

let animIndex = 0;
let bodyIndex = 0;

const triggerBodyId = 4;

ida.setStartSceneId(sceneId);
ida.setIntroVideo("");

let tmp;

// After load scene event is where we should do all the custom scenes setup
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, loadMode) => {
  tmp = {};

  if (sceneId != sceneId) {
    return;
  }

  const wp0Pos = [5632, 256, 7680];
  scene.updateWaypoint(0, wp0Pos);

  for (let obj of scene.objects) {
    obj.handleLifeScript();
    obj.handleMoveScript();
  }

  scene.getObject(6).disable();

  scene.setStartPos([5120, 256, 11264]);
  const twinsen = scene.getObject(0);
  twinsen.setAngle(object.directionToAngle(object.North));

  const demoObject = scene.getObject(5);
  demoObject.setPos(wp0Pos);
  demoObject.setEntity(entityId);
  demoObject.setTalkColor(text.Colors.CocoaBrown);

  bodies = Object.keys(ida.getBodies(entityId)).map((k) => parseInt(k));
  animations = ida.getAnimations(entityId);

  if (bodies.length > 0) {
    demoObject.setBody(bodies[bodyIndex]);
  }

  if (animations.length > 0) {
    demoObject.setAnimation(animations[animIndex]);
  }

  const triggerBody = scene.getObject(triggerBodyId);
  triggerBody.setEntity(226);
  triggerBody.setPos(scene.getStartPos().plus(object.West.mul(500)));
  triggerBody.setAngle(object.directionToAngle(object.East));

  printInfo();

  textId = text.create();

  twinsen.handleLifeScript((objectId) => {
    if (isTriggeredTrue(tmp, "action", ida.lifef(objectId, ida.Life.LF_ACTION) > 0)) {
      const angleToFrog = ida.lifef(objectId, ida.Life.LF_ANGLE, triggerBodyId);
      const distanceToFrog = ida.lifef(objectId, ida.Life.LF_DISTANCE, triggerBodyId);
      if (angleToFrog < 550 && distanceToFrog < 700) {
        // Switching body
        const nextBody = getNextBody();
        console.log(`Switching to body ${nextBody}`);

        ida.life(5, ida.Life.LM_POS_POINT, 0);
        ida.life(objectId, ida.Life.LM_BODY_OBJ, 5, nextBody);

        ida.life(
          objectId,
          ida.Life.LM_MESSAGE_OBJ,
          5,
          text.update(textId, [`Body ${nextBody}`, text.Flags.DialogSay])
        );

        printInfo();
      } else {
        // Switching animation

        const nextAnimation = getNextAnimation();
        console.log(`Switching to animation ${nextAnimation}`);

        ida.life(5, ida.Life.LM_POS_POINT, 0);

        ida.life(objectId, ida.Life.LM_ANIM_OBJ, 5, nextAnimation);

        ida.life(
          objectId,
          ida.Life.LM_MESSAGE_OBJ,
          5,
          text.update(textId, [`Animation ${nextAnimation}`, text.Flags.DialogSay])
        );

        printInfo();
      }
    }
  });
});

function printInfo() {
  const bodies = ida.getBodies(entityId);
  console.log(`Entity ID: ${entityId} bodies:`, bodies);

  const animations = ida.getAnimations(entityId);
  console.log(`Entity ID: ${entityId} animations:`, animations, animations.length);
}

function getNextAnimation() {
  if (animations.length == 0) {
    return 0;
  }

  animIndex = animIndex < animations.length - 1 ? animIndex + 1 : 0;
  return animations[animIndex];
}

function getNextBody() {
  if (bodies.length == 0) {
    return 0;
  }

  bodyIndex = bodyIndex < bodies.length - 1 ? bodyIndex + 1 : 0;
  return bodies[bodyIndex];
}
