const { EnumHandler } = require("./enums");
const { deepFreeze } = require("./utils");

// A free id after all the LBA2 images in SCREEN.HQR. In the vanilla game it will be 39
var currentImageName = null;
var gameImageIdToName = new Map();
var firstImageId = null;

function loadFirstImageId() {
  firstImageId = firstImageId ?? ida.getFirstImageId();
}

function validateImageName(imageName) {
  if (
    typeof imageName !== "string" ||
    imageName.trim() === "" ||
    imageName.includes("\\")
  ) {
    console.error(`Invalid image name: ${imageName}`);
    return false;
  }
  return true;
}

function validateImageId(imageId) {
  if (typeof imageId !== "number" || imageId < 0 || imageId > 255) {
    console.error(`Invalid image ID: ${imageId}; Available range: [0..255]`);
    return false;
  }
  return true;
}

function validateGameImageId(gameImageId) {
  if (!validateImageId(gameImageId)) {
    return false;
  }

  if (gameImageId >= firstImageId) {
    console.error(
      `Invalid game image ID: ${gameImageId}; Available range: [0..${
        firstImageId - 1
      }]`
    );
    return false;
  }
  return true;
}

const image = {
  /** Only one user image can be used at a time */
  use(imageName) {
    if (!validateImageName(imageName)) {
      return;
    }
    loadFirstImageId();
    imageName = imageName.trim();
    currentImageName = imageName;
    return firstImageId;
  },
  replace(gameImageId, imageName) {
    loadFirstImageId();
    if (!validateGameImageId(gameImageId)) {
      return;
    }
    if (!validateImageName(imageName)) {
      return;
    }
    imageName = imageName.trim();
    gameImageIdToName.set(gameImageId, imageName);

    return gameImageId;
  },
  restore(gameImageId) {
    loadFirstImageId();
    if (!validateGameImageId(gameImageId)) {
      return;
    }

    gameImageIdToName.delete(gameImageId);
  },
  _reset() {
    currentImageName = null;
    gameImageIdToName.clear();
  },
  __get(imageId) {
    if (!validateImageId(imageId)) {
      return null;
    }
    loadFirstImageId();
    if (imageId < firstImageId) {
      if (gameImageIdToName.has(imageId)) {
        return gameImageIdToName.get(imageId);
      }
      return null;
    }

    if (imageId > firstImageId) {
      console.error(`Invalid user image ID: ${imageId}`);
      return null;
    }

    if (!currentImageName) {
      return null;
    }

    return currentImageName;
  },
  PaletteAlgorithms: {
    Euclidean: 0,
    EuclideanDithered: 1,
    WeightedEuclidean: 2,
    WeightedEuclideanDithered: 3,
    CIELABDeltaE: 4,
    CIELABDeltaEDithered: 5,
  },

  Pictures: {
    FirstLogo: 0, // First logo picture (Adeline logo)
    LBA2Demo: 1, // LBA2 DEMO picture
    MenuBackground: 2, // Menu background (Stormy sea image)
    MagicSlate: 3, // Magic slate picture
    MapSewers: 4, // Map of the sewers
    MapSewersCopy: 5, // Map of the sewers (on the slate)
    MapDome: 6, // Map of the Dome of the slate
    MapDomeCopy: 7, // Copy of the map of the Dome of the slate
    MapEmeraldMoon: 8, // Map of Emerald Moon
    MapEmeraldMoonCopy: 9, // Copy of the map of Emerald moon
    ViewHaciendaIsland: 10, // View of the island across the hacienda
    LighthouseNight: 11, // View of the lighthouse (night)
    LighthouseDay: 12, // View of the lighthouse (day)
    Presentation1: 13, // 1st presentation picture (Zeelich)
    Presentation2: 14, // 2nd presentation picture (Researchers)
    Presentation3: 15, // 3rd presentation picture (Picnic)
    ViewEmeraldMoon: 16, // View of Emerald Moon
    TempleWannies: 17, // Temple on the Island of the Wannies
    DissectionTwinsen: 18, // Dissection of Twinsun
    MonaTwinsen: 19, // Mona Twinsen
    DissectionZeelich: 20, // Dissection of Zeelich
    DissectionZeelichCopy: 21, // Copy of the dissection of Zeelich on slate
    WantedTwinsen: 22, // Wanted: Twinsen
    Presentation4: 23, // 4th presentation picture (Bust of the Emperor)
    Presentation5: 24, // 5th presentation picture (Parade)
    Presentation6: 25, // 6th presentation picture (Disco)
    Presentation7: 26, // 7th presentation picture (Celebration)
    Presentation8: 27, // 8th presentation picture (Dark Monk's statue)
    Presentation9: 28, // 9th presentation picture (Zeelich + UFO)
    Presentation10: 29, // 10th presentation picture (Casino)
    TwinsenZoeCD: 30, // Twinsen + Zoé on CD
    SendellsBall: 31, // Sendell's Ball
    PlanIslandCX: 32, // Plan of island CX
    PlanIslandCXCopy: 33, // Copy of the plan of island CX
    TwinsenWell: 34, // Twinsen on the well of Sendell
    SendellWell: 35, // Sendell on the well of Sendell
    SecondLogo: 36, // Second logo picture (Activision logo)
    SecondLogoAltEA: 37, // Alternative second logo picture (EA logo)
    SecondLogoAltVirgin: 38, // Second alternative second logo picture (Virgin logo)
  },
  Videos: {
    ASCENSEU: "ASCENSEU", // Going down with the elevator
    ASRETOUR: "ASRETOUR", // Going up with the elevator
    BALDINO: "BALDINO", // Escape with Baldino
    BOAT1: "BOAT1", // Boat ride, variant 1
    BOAT2: "BOAT2", // Boat ride, variant 2
    BOAT3: "BOAT3", // Boat ride, variant 3
    BOAT4: "BOAT4", // Boat ride, variant 4
    BU: "BU", // Temple of Bu ride
    CRASH: "CRASH", // Twinsen crashes with the shuttle
    DARK: "DARK", // Dark Monk statue rises
    DELUGE: "DELUGE", // The bad ending
    END: "END", // End game, part 1
    END2: "END2", // End game, part 2
    ENFA: "ENFA", // Kids being kidnapped by Aliens
    FRAGMENT: "FRAGMENT", // Twinsen takes the Wannies fragment
    GROTTE: "GROTTE", // Exit the cliffs with Zoe
    INTRO: "INTRO", // Intro movie
    LUNES1: "LUNES1", // Emerald moon moving 1
    LUNES2: "LUNES2", // Emerald moon moving 2
    MONTCH: "MONTCH", // Departing from the alien base on the Desert island
    MOON: "MOON", // Landing on the moon
    PASSEUR: "PASSEUR", // The lava ferryman
    PUB1: "PUB1", // Zeelich promotional video 1
    PUB2: "PUB2", // Zeelich promotional video 2
    PUB3: "PUB3", // Zeelich promotional video 3
    PUB4A6: "PUB4A6", // Zeelich promotional video 4-6
    SENDELL: "SENDELL", // Sendell's ball
    SORT: "SORT", // Chasing the storm with magic, and then Aliens arrive
    SURSAUT: "SURSAUT", // Dying emperor starts the reactor
    TAXI: "TAXI", // Dirigeable taxi ride
    TAXI_J: "TAXI_J", // Yellow air taxi ride
    VOYAGEZ: "VOYAGEZ", // Flying in space
    ZEELP: "ZEELP", // Landing on Zeelich
    BABY: "BABY", // The ending credits baby view
  },
};

image.Pictures.$ = new EnumHandler(image.Pictures);
image.PaletteAlgorithms.$ = new EnumHandler(image.PaletteAlgorithms);
deepFreeze(image);

module.exports.image = image;
