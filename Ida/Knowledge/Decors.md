# Exterior Decors in LBA2/Ida

This document explains how exterior decor objects work in the engine, how they are loaded, how visibility is toggled, and what modders must edit when changing island content.

## Scope

This is about **exterior 3D island decors** (`T_DECORS`), not scene actors.

- Actors are loaded from scene files/scripts.
- Exterior decors are loaded from island resources (`.ILE/.OBL`) per cube.

## Key Concepts

### 1) Decors are data-driven, not scene actors

Exterior decor objects are stored in island/cube data and rendered by the exterior engine path.

Relevant code:
- `SOURCES/3DEXT/LOADISLE.CPP` (`LoadIsland`, `LoadCube`)
- `SOURCES/3DEXT/DECORS.CPP` (`FixeObjetsDecorsInvisibles`, `AffichageObjetDecorsZBuf`)
- `SOURCES/3DEXT/LBA_EXT.H` (`T_DECORS`, flags)

### 2) Decors are per cube (not one global list)

When a cube is loaded, its own `DOB` chunk is loaded into `ListDecors`:
- `LoadCube()` sets `NbObjDecors` and `ListDecors` from cube data.

Implication:
- Decor content is tied to the currently loaded exterior cube.
- If you modify visuals in one cube, other cubes are unaffected unless they share the same mapped cube data.

### 3) Visibility control is encoded in decor data (`Beta >> 16`)

Each decor can encode a game-variable condition in the high 16 bits of `Beta`:
- `numvar = ptrobj->Beta >> 16`

Engine rule (from `FixeObjetsDecorsInvisibles`):
- `numvar > 0`: hide if `ListVarGame[numvar] != 0`
- `numvar < 0`: hide if `ListVarGame[-numvar] == 0`
- `numvar == 0`: no variable-based visibility condition

Example (specific to Citadel `citabau` cube 42): both `+83` and `-83` exist for opposite variants, where var `83` toggles spaceship vs occupied/barbed-wire set. 

## Confirmed Citadel Case (Spaceship vs Occupied Props)

For Citadel island cube 42, traces showed:
- `body=101` with `numvar=+83` (spaceship set)
- multiple occupied props with `numvar=-83`

Behavior:
- `ListVarGame[83] == 0` -> `+83` visible, `-83` hidden (spaceship visible)
- `ListVarGame[83] != 0` -> `+83` hidden, `-83` visible (occupied props visible)

So this swap is done by **decor visibility logic**, that allows us to enrich the same island model without need to load another island model.

## Island Model Selection vs Decor Variant Selection

These are separate systems:

1. **Island file selection** (e.g. `citadel` vs `citabau`) in `InitGrilleExt`:
- `SOURCES/EXTFUNC.CPP`

The only 2 places in the game where the whole island model needs to be switched is citadel (initial island model when we have storm) vs citabau, and the volcano island before the ceremony vs after the ceremony. A corresponding API exist in IdaJS to force those models (see the storm sample). In all other cases, we can reuse the same island model and just swap specific decor subsets through game variables.

2. **Decor variant selection** inside the loaded cube data:
- `SOURCES/3DEXT/DECORS.CPP` (`Beta >> 16` + `ListVarGame`)

So you can be on the same island model and still swap specific decor subsets through game variables.

## Map/Cube Data Structure You Need to Know

From `SOURCES/3DEXT/LOADISLE.CPP` and `SOURCES/3DEXT/LBA_EXT.H`:

- Island map index is a 16x16 table (`IsleMapIndex`) in `.ILE`.
- Each map cell points to a cube entry (or empty).
- Cube data is chunked with step `6`:
  - `INF`: cube infos
  - `DOB`: decor objects (`T_DECORS` list)
  - `GRD`: ground polys
  - `TXD`: texture defs
  - `Y`: heightmap
  - `LUM`: lightmap

### Important consequence

To add/change decor objects, you edit cube `DOB` data.

To add a new logical cube layout location, you edit:
- cube data entries (all required cube chunks), and
- 16x16 map index cells to reference the new cube index.

## Limits and Constraints

### Engine compile-time limits

- `MAX_CUBES_PER_ISLE` = `20` (`SOURCES/3DEXT/LBA_EXT.H`)
- `MAX_OBJ_DECORS` = `200` (`SOURCES/3DEXT/LBA_EXT.H`)

### Memory pool limits

In `SOURCES/DEFINES.H`:
- `MIN/MAX_ISLE_OBJ_MEM`
- `MIN/MAX_CUBE_INFOS_MEM`
- `MIN/MAX_LIST_DECORS_MEM`
- `MIN/MAX_MAP_PGROUND_MEM`
- `MIN/MAX_LIST_TEXDEF_MEM`
- `MIN/MAX_MAP_SOMMETY_MEM`
- `MIN/MAX_MAP_INTENSITY_MEM`

If you increase cube/decor complexity, you may need both:
- bigger data resources, and
- increased engine limits/memory pools.

## GRM Is Different From Decor Visibility

GRM (scene fragments) is a separate brick-overlay system and is not the same mechanism as `T_DECORS` visibility flags.

For detailed GRM internals, life opcodes/functions, persistence, and IdaJS usage, see:
- [Fragments.md](Fragments.md)

## IdaJS Usage Pattern

A practical way to force decor variant swaps is to set the controlling game variable after scene load.

Example (Citadel occupation switch variable `83`):

```js
scene.addEventListener(scene.Events.afterLoadScene, (sceneId, loadMode) => {
  if (loadMode === scene.LoadModes.NewGameStarted) return;

  const gameStore = useGameStore();

  const VAR_CITADEL_OCCUPATION_DECORS = 83;
  const OCCUPIED_SET = 8; // nonzero => hide +83, show -83
  const NORMAL_SET = 0;   // zero => show +83, hide -83

  // Optional guard for target scenes only.
  // if (!isCitadelExterior(sceneId)) return;

  scene.setGameVariable(
    VAR_CITADEL_OCCUPATION_DECORS,
    gameStore.showOccupiedSet ? OCCUPIED_SET : NORMAL_SET
  );

  // ... more code
});
```

Notes:
- Only zero/nonzero matters for this visibility rule.

## Recommended Workflow for Modders

1. Identify target cube and island (with runtime trace).
2. Trace conditional decors (`numvar`, `body`, visible/hidden state), using the debug tracing mechanism (`LBA_TRACE_DECORS` env variable, see below).
3. Find the controlling variable(s) used by that cube.
4. Switch in IdaJS afterSceneLoad event when needed
5. If editing map assets:
   - edit cube `DOB` decor list,
   - keep `Beta >> 16` conditions consistent,
   - verify body IDs exist in the island `.OBL` bank.
6. If adding cubes:
   - add cube chunks,
   - update 16x16 map index,
   - verify engine limits and memory pools.

## Troubleshooting Checklist

- Decor not appearing:
  - wrong body ID in `Body & 0xFFFF`
  - wrong sign on `numvar` (`+N` vs `-N`)
  - controlling game variable not in expected state
  - map cell pointing to different cube index than expected

- Works in one area but not another:
  - you edited one cube only; neighboring map cells may reference another cube

- Crash/memory issues after data growth:
  - exceeded `MAX_*` limits or memory pools

## Debug Tracing

`SOURCES/3DEXT/DECORS.CPP` includes optional trace controlled by:

- `LBA_TRACE_DECORS=1` (enable)
- `LBA_TRACE_DECORS=0` (disable)

It logs, per visibility pass:
- island/cube
- each conditional decor: index, body, `numvar`, var value, applied rule, final state
- summary counts

This is useful to compare save states and confirm which variable drives each decor set.
