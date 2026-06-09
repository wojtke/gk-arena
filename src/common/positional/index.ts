// The shared positional-game engine: a hypergraph of winning sets plus Maker–Breaker rules and
// Erdős–Selfridge / minimax AI. Game-agnostic — instantiated as Van der Waerden (APs on a line) or
// Ramsey (cliques on K_v) by feeding the matching hypergraph builder. Games import from here.

export * from './types';
export * from './hypergraph';
export * from './rules';
export * from './ai';
export { makeRng } from '../rng';
