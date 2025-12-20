// IdaJS - Execution protection policy

const ExecutionPhase = {
  None: 0,
  BeforeScene: 1,
  InScene: 2,
  InMove: 3,
  InYield: 4,
};

const ExecutionPhaseNames = new Map([
  [ExecutionPhase.None, "before any events"],
  [ExecutionPhase.BeforeScene, "in beforeLoadScene event"],
  [
    ExecutionPhase.InScene,
    "in afterLoadScene event, and afterwards, excl. coroutines",
  ],
  [ExecutionPhase.InMove, "in a coroutine"],
  [ExecutionPhase.InYield, "in yield do...() or yield doMove coroutine action"],
]);

var isEnabled = true;
var currentExecutionPhase = ExecutionPhase.None;

const setCurrentPhase = (phase) => {
  currentExecutionPhase = phase;
};

const allowInPhases = (...allowedPhases) => {
  if (!isEnabled) {
    return;
  }

  if (!allowedPhases.includes(currentExecutionPhase)) {
    throw new Error(
      `This function can only be called in the following phases: ${Array.from(
        allowedPhases,
        (phase) => ExecutionPhaseNames.get(phase)
      ).join(", ")}. However, current phase is: ${ExecutionPhaseNames.get(
        currentExecutionPhase
      )}`
    );
  }
};

const setEnabled = (enabled) => {
  isEnabled = Boolean(enabled);
};

module.exports = {
  ExecutionPhase,
  setCurrentPhase,
  allowInPhases,
  setEnabled,
};
