export interface Player {
  id?: string;
  name: string;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
}

export interface Pokemon {
  id: string;
  name: string;
  level: number;
  ivs?: Record<string, number>;
  evs?: Record<string, number>;
  nature?: string;
  moves?: string[];
}

export interface PokemonBuild extends Pokemon {
  ability: string;
  ivs?: Record<string, number>;
  evs?: Record<string, number>;
  nature?: string;
  moves?: string[];
}