import { GAME_ACTYPE, GAME_PHASE, CARD_VALUES as CARD_VALUES, CARD_SUITS } from '../constants';

export const MAX_HAND_COUNT = 2;
export const PLAY_CARD_COUNT = 2;
export const LOSE_BELOW_COUNT = 10;

export const INITIAL_GAME_STATE = {
  players: {
    p1: { hand: [], deck: [], loot: [], played: [] },
    p2: { hand: [], deck: [], loot: [], played: [] },
  },
  votes: { p1: null, p2: null },	// null, "p1", "p2", "tie"
  idToSlot: {},	// { id: slot }
  field: [],
  round: 1,
  phase: GAME_PHASE.GAME_READY,
  roundWinner: null,	// null, "p1", "p2", "tie"
  gameWinner: null,
};

export const validVotes = ["p1", "p2", "tie"];
export const validPlayers = ["p1", "p2"];

// --- Helper Functions ---
// Construct a full deck of poker cards 13 x 4.
function buildDeck(values = CARD_VALUES, suits = CARD_SUITS) {
  const deck = [];
  for (const value of values) {
    for (const suit of suits) {
      deck.push({
        value: value,
        suit: suit,
        id: `${value}${suit}`,
      });
    }
  }
  return deck;
}

// Immutable shuffle using Fisher-Yates algorithm.
function shuffleFisherYates(arr, rand) {
  if (rand.length < arr.length - 1) {
    throw new Error("random array for shuffle too short")
  }
  const out = arr.slice();
  let k = 0;
  for (let i = out.length - 1; i > 0; i--) {
    const r = rand[k++];
    const j = Math.floor(r * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// --- Reducer Logic Functions ---
// Draw cards for one player.
const drawFromDeck = (player, max_hand) => {
  const count = max_hand - player.hand.length;
  return {
    ...player,
    hand: [...player.hand, ...player.deck.slice(0, count)],
    deck: player.deck.slice(count),
  }
};

// Play cards from one player.
const playCards = (player, cards) => {
  const cardsId = new Set(cards.map(c => c.id));
  const newHand = [];
  const played = [];

  for (const card of player.hand) {
    if (cardsId.has(card.id)) {
      played.push(card);
    } else {
      newHand.push(card);
    }
  }

  if (played.length !== cards.length) return player;	// check illegal cards
  return {
    ...player,
    hand: newHand,
    played: played,
  };
};

// Reset played cards for one player.
const resetPlayed = (player) => {
  return {
    ...player,
    played: [],
  }
};

// Loot cards.
const lootCards = (player, cards) => {
  return {
    ...player,
    loot: [...player.loot, ...cards],
  }
};

// Merge loot into deck for one player.
const mergeLoot = (player) => {
  return {
    ...player,
    deck: [...player.deck, ...player.loot],
    loot: [],
  };
};

// TODO: merge into reducer as a special action
const mergeLootIntoDeck = (state, rand) => {
  const { p1, p2 } = state.players;
  const newP1 = mergeLoot(p1);
  const newP2 = mergeLoot(p2);
  // Game winner is found.
  let winner;
  if (newP1.deck.length < LOSE_BELOW_COUNT) winner = "p2";
  if (newP2.deck.length < LOSE_BELOW_COUNT) winner = "p1";
  if (winner) {
    return {
      ...state,
      players: { p1: newP1, p2: newP2 },
      phase: GAME_PHASE.GAME_OVER,
      winner: winner,
    };
  }
  // Otherwise, shuffle new deck.
  const lenP1 = newP1.deck.length;
  newP1.deck = shuffleFisherYates(newP1.deck, rand.slice(0, lenP1));
  newP2.deck = shuffleFisherYates(newP2.deck, rand.slice(lenP1));
  return {
    ...state,
    players: { p1: newP1, p2: newP2 },
    phase: GAME_PHASE.DRAW_CARDS,
    round: state.round + 1,
  }
};

// --- Main Reducer ---
export function gameReducer(state, action) {
  switch (action.type) {
    case GAME_ACTYPE.SETUP_GAME: {
      const { phase } = state;
      const { id1, id2, rand } = action.payload;
      if (phase !== GAME_PHASE.GAME_READY) return state;

      const deck = buildDeck();
      const shuffledDeck = shuffleFisherYates(deck, rand);
      return {
        ...INITIAL_GAME_STATE,
        players: {
          p1: { hand: [], deck: shuffledDeck.slice(0, 26), loot: [], played: [] },
          p2: { hand: [], deck: shuffledDeck.slice(26), loot: [], played: [] },
        },
        idToSlot: { [id1]: "p1", [id2]: "p2" },
        phase: GAME_PHASE.DRAW_CARDS,
      }
    }

    case GAME_ACTYPE.RESET_GAME: {
      return INITIAL_GAME_STATE;
    }

    case GAME_ACTYPE.SYNC_STATE: {
      return action.payload;
    }

    // --- In-Game Actions ---
    // 1. draw cards
    case GAME_ACTYPE.DRAW_CARDS: {
      const { players, phase } = state;
      const { p1, p2 } = players;

      if (phase !== GAME_PHASE.DRAW_CARDS) return state;

      return {
        ...state,
        players: {
          p1: drawFromDeck(p1, MAX_HAND_COUNT),
          p2: drawFromDeck(p2, MAX_HAND_COUNT),
        },
        phase: GAME_PHASE.PLAY_CARDS,
      }
    }

    // 2.a. play cards
    case GAME_ACTYPE.PLAY_CARDS: {
      const { players, field, phase } = state;
      const { slot, cards } = action.payload;
      const player = players[slot];

      if (phase !== GAME_PHASE.PLAY_CARDS) return state;	// check phase
      if (player.played.length > 0) return state;					// check if already played
      if (cards.length !== PLAY_CARD_COUNT) return state;	// check illegal cards

      const newPlayer = playCards(player, cards);
      return {
        ...state,
        players: { ...players, [slot]: newPlayer },
        field: [...field, ...newPlayer.played],
      };
    }

    // 2.b. flip cards (upon everyone played)
    case GAME_ACTYPE.FLIP_CARDS: {
      const { players, phase } = state;
      const allPlayersPlayed = Object.values(players)
        .every((p) => p.played.length > 0);

      if (phase !== GAME_PHASE.PLAY_CARDS) return state;	// check phase
      if (!allPlayersPlayed) return state;								// check all players played

      return {
        ...state,
        players: {
          p1: resetPlayed(players.p1),
          p2: resetPlayed(players.p2),
        },
        phase: GAME_PHASE.VOTE_WINNER,
      }
    }

    // 3.a. vote winner
    case GAME_ACTYPE.VOTE_WINNER: {
      const { votes, phase } = state;
      const { slot, voteFor } = action.payload;

      if (phase !== GAME_PHASE.VOTE_WINNER) return state;
      if (votes[slot]) return state;
      if (!validVotes.includes(voteFor)) return state;

      return {
        ...state,
        votes: { ...votes, [slot]: voteFor },
      }
    }

    // 3.b. decide winner (upon everyone voted)
    case GAME_ACTYPE.DECIDE_WINNER: {
      const { votes, phase } = state;
      const voteValues = Object.values(votes);
      const roundWinner = voteValues[0];
      const allPlayersVoted = voteValues.every(v => validVotes.includes(v));
      const allPlayersConsensus = voteValues.every(v => v === roundWinner);

      if (phase !== GAME_PHASE.VOTE_WINNER) return state;
      if (!allPlayersVoted) return state;

      if (!allPlayersConsensus) {
        // Vote again if players don't agree.
        return {
          ...state,
          votes: { p1: null, p2: null },
        }
      } else {
        return {
          ...state,
          votes: { p1: null, p2: null },
          phase: GAME_PHASE.LOOT_CARDS,
          roundWinner: roundWinner,
        }
      }
    }

    // 4. loot winner
    case GAME_ACTYPE.LOOT_CARDS: {
      const { players, field, phase, roundWinner: winner } = state;

      if (phase !== GAME_PHASE.LOOT_CARDS) return state;

      const newState = {
        ...state,
        field: [],
        phase: GAME_PHASE.NEXT_ROUND,
        roundWinner: null,
      };
      if (validPlayers.includes(winner)) {
        // One player takes all.
        newState.players = {
          ...players,
          [winner]: lootCards(players[winner], field),
        };
      } else {
        // Players chop cards.
        const chopSize = field.length / 2;
        newState.players = {
          p1: lootCards(players.p1, field.slice(0, chopSize)),
          p2: lootCards(players.p2, field.slice(chopSize)),
        };
      }
      return newState;
    }

    // 5. new round
    case GAME_ACTYPE.NEXT_ROUND: {
      const { players, phase, round } = state;
      const rand = action.payload;

      if (phase !== GAME_PHASE.NEXT_ROUND) return state;

      const somePlayerDeckEmpty = Object.values(players)
        .some((p) => p.deck.length === 0);
      if (somePlayerDeckEmpty) {
        return mergeLootIntoDeck(state, rand);
      }

      return {
        ...state,
        phase: GAME_PHASE.DRAW_CARDS,
        round: round + 1,
      };
    }

    default:
      return state;
  };
};