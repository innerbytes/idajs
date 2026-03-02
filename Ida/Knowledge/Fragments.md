# GRM in LBA2/IdaJS (Fragment Zones)

This document explains how GRM works in the original engine and how to control/read it from life scripts and IdaJS.

## What GRM Is

GRM is a **zone-driven brick overlay system** for grid-based map cubes (the isometric `BufCube` world).

At runtime, a GRM zone can:
- apply a brick fragment/overlay chunk onto the current cube (`IncrustGrm`), or
- restore the original bricks in that zone area (`DesIncrustGrm`).

GRM is implemented in:
- `SOURCES/GRILLE.CPP` (`IncrustGrm`, `DesIncrustGrm`, `RedrawGRMs`)
- life opcode handler in `SOURCES/GERELIFE.CPP` (`LM_SET_GRM`)

## Zone Type and Data Model

GRM uses zone type `3`.

- In IdaJS enum naming, this is `object.ZoneTypes.Fragment`.
- Native struct is `T_ZONE` in `SOURCES/COMMON.H`.

Important `T_ZONE` fields for GRM:
- `Type` must be `3` (Fragment/GRM zone)
- `Num` is the logical zone value used by life scripts (`LM_SET_GRM zoneId, onOff`)
- `Info0` is the GRM resource index (`numgrm`) to load
- `Info2` is runtime ON/OFF state used by engine redraw/save/restore
- `X0..Z1` bounds define affected map region

Initialization when scene is loaded (`DISKFUNC.CPP`):
- all GRM zones (`Type==3`) are reset with `Info1 = 0`
- `Info2` is then controlled by scripts/savegame state

## How GRM Is Applied Internally

### ON path: `IncrustGrm(ptrz)`

- Reads `numgrm = ptrz->Info0`
- Loads GRM block from `BKG.HQR` index:
  - `BkgHeader.Grm_Start + GriHeader->My_Grm + numgrm`
- Uses zone start (`X0,Y0,Z0`) and GRM chunk dimensions (`dx,dy,dz`) to copy brick column slices into `BufCube`

In practice: this patches cube bricks with predefined fragment data.

### OFF path: `DesIncrustGrm(ptrz)`

- Uses zone bounds (`X0..X1`, `Y0..Y1`, `Z0..Z1`)
- Rebuilds original columns from map source (`GetAdrColonneMap` + `DecompColonne`)
- Copies only affected vertical span back to `BufCube`

In practice: this removes overlay and restores original map data in zone area.

### Redraw on scene init

`RedrawGRMs()` re-applies every GRM zone where `Info2 != 0`.

This is called during map init (`InitGrille`) and also on savegame load path for GRM zones.

## Life Script Commands and Functions

## Commands that change GRM state

### `LM_SET_GRM` (opcode `76` / `0x4C`)

Definition:
- args: `(zoneValue, onOff)`
- behavior: for each zone where `Type==3` and `Num==zoneValue`:
  - if `onOff != 0` and currently OFF (`Info2==0`) -> `IncrustGrm`
  - if `onOff == 0` and currently ON (`Info2!=0`) -> `DesIncrustGrm`
  - then `Info2 = onOff`

Note in source comment: `"ne marche que si pas autre grm"` (designed assuming non-overlapping GRM interactions).

Related code:
- `SOURCES/GERELIFE.CPP` (case `LM_SET_GRM`)

## Life functions that read GRM state

There is **no dedicated `LF_*` function for GRM**.
So from classic life script, GRM state cannot be directly queried via a dedicated opcode.

Common pattern:
- mirror GRM state in a game variable (`LM_SET_VAR_GAME`) and read it with `LF_VAR_GAME`.

## Save/Load Persistence

Zone runtime fields are persisted in savegames, including GRM state:
- saves: `Info1`, `Info2`, `Info3`, `Info7` for all zones
- loads back those fields
- for GRM (`Type==3`), if restored `Info2 != 0`, engine calls `IncrustGrm`

So GRM ON/OFF survives save/load through zone state serialization.

## IdaJS Control and Inspection

## Triggering GRM changes at runtime

Use life opcode wrapper:

```js
// objectId is the actor context executing the life command (often 0 for Twinsen in mod scripts)
ida.life(ida.Life.LM_SET_GRM, objectId, zoneValue, 1); // ON
ida.life(ida.Life.LM_SET_GRM, objectId, zoneValue, 0); // OFF
```

## Reading GRM-related data in IdaJS

There is no direct `LF_GRM`, but you can inspect zones:

```js
for (const zone of scene.zones) {
  if (zone.getType() === object.ZoneTypes.Fragment) {
    const zoneValue = zone.getZoneValue();   // T_ZONE.Num
    const regs = zone.getRegisters();        // [Info0..Info7]
    const grmResource = regs[0];             // Info0
    const grmState = regs[2];                // Info2 (runtime on/off state)
  }
}
```

Important:
- writing `Info2` via `setRegisters` alone does not execute overlay copy/remove logic.
- to actually apply/remove visually at runtime, use `LM_SET_GRM`.

## Editing GRM in Map/Scene Data

When authoring/modifying scene data:

1. Create or edit zones with `Type=3` (Fragment).
2. Set `Num` (zone value) used by scripts.
3. Set `Info0` to target GRM resource index.
4. Set zone bounds (`X0..X1`, `Y0..Y1`, `Z0..Z1`) to match affected area.
5. Ensure GRM resource exists in `BKG.HQR` for current style (`My_Grm` offset applies).

Practical caution:
- avoid overlapping GRM zones that toggle independently in same area unless carefully tested.

## Relationship to Exterior Decor Visibility

GRM is separate from exterior decor (`T_DECORS`) visibility masking:
- GRM modifies brick map chunks (`BufCube`) via zone overlays.
- Decor visibility uses `T_DECORS.Beta >> 16` and `ListVarGame` checks.

Use GRM for map brick fragment toggles, and decor rules for object-model toggles.

## Quick Reference

- Zone type: `3` (`Fragment`)
- Change state command: `LM_SET_GRM(zoneValue, onOff)`
- Direct read function: none (`LF_GRM` does not exist)
- Runtime state field: `T_ZONE.Info2`
- Resource selector: `T_ZONE.Info0`
- Save persisted: yes (`Info2` persisted and reapplied)
