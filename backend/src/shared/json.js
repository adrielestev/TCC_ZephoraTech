"use strict";

const parseJson = (value) => {
  if (value === null || value === undefined) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const canonical = (value) => {
  if (value === null || value === undefined) return "null";
  const sorted = Object.entries(value).sort(([a], [b]) =>
    a < b ? -1 : a > b ? 1 : 0,
  );
  return JSON.stringify(Object.fromEntries(sorted));
};

/** Compara dois estados (objetos planos) ignorando a ordem das chaves. */
const sameState = (a, b) => canonical(a) === canonical(b);

/** true se todas as chaves de `condition` batem com `state`. */
const isSubset = (condition, state) =>
  state !== null &&
  state !== undefined &&
  Object.entries(condition).every(([k, v]) => state[k] === v);

module.exports = { parseJson, sameState, isSubset };
