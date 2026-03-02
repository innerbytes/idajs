# AGENTS.md

## What is IdaJS

IdaJS is a JavaScript-powered modding engine for Little Big Adventure 2 (LBA2). It lets you create mods for the classic LBA2 game using JavaScript or TypeScript — modifying scenes, characters, behaviors, dialogs, and more through a modern scripting API.

## API Reference

The full IdaJS TypeScript API with JSDoc documentation is available in `./node_modules/@idajs/types/`, structured by entities. The global objects (such as `scene`, `ida`, `text`, `object`, etc.) are defined in `global.d.ts`. Always consult these type definitions when implementing any feature.

## Mod Execution Phases

Different phases of mod execution allow different APIs. Be aware which phase you are in:

- **Scene setup phase** (`scene.Events.afterLoadScene` handler): Configure the scene before gameplay starts. Use `scene`, `object`, `text`, zone and waypoint APIs to add/modify objects, zones, waypoints, register life script handlers, register coroutines, and set initial state. Do **not** call life or move script commands here.
- **Life script handler** (`handleLifeScript`): Runs every frame per actor. Use `ida.life()` and `ida.lifef()` for life script commands/functions (conditions, dialogs, state changes). Can start/pause/stop coroutines from here.
- **Coroutine (move script)** (generator function registered via `registerCoroutine`): Runs across multiple frames. Use `yield doMove()` for move commands (animations, movement, timing) and other `yield do...()` helpers (`doSceneStore`, `doGameStore`, etc.). Cannot check game conditions directly — that logic belongs in life scripts.

## Mod Examples

For examples of working mods, look at `Ida/Samples` in the IdaJS installation folder. The path to the installation folder is written in a JSON file either in the user's home directory: `~/.idajs.json` or in the root directory of this project.

## Web Documentation

Full readme, API reference, and guides are available at: https://ida.innerbytes.com
