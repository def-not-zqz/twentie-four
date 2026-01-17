import { GAME_ACTYPE, GAME_PHASE, CARD_NUMBERS, CARD_SUITS } from '../constants';

export const MAX_HAND_COUNT = 2;
export const PLAY_CARD_COUNT = 2;
export const LOSE_BELOW_COUNT = 10;

export const INITIAL_GAME_STATE = {
	players: {
		p1: { hand: [], deck: [], loot: [], played: [] },
		p2: { hand: [], deck: [], loot: [], played: [] },
	},
	field: [],
	round: 1,
	phase: GAME_PHASE.GAME_START,
	winner: null,
};

// --- Helper Functions ---
// Construct a full deck of poker cards 13 x 4.
function buildDeck(numbers = CARD_NUMBERS, suits = CARD_SUITS) {
	const deck = [];
	for (const number of numbers) {
		for (const suit of suits) {
			deck.push({
				number: number,
				suit: suit,
				id: `${number}${suit}`,
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

	if (played.length !== cards.length) return player;
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
		phase: GAME_PHASE.ROUND_PREP,
		round: state.round + 1,
	}
};

// --- Main Reducer ---
export function gameReducer(state, action) {
	switch (action.type) {
		case GAME_ACTYPE.SETUP_GAME: {
			const { phase } = state;
			const rand = action.payload;
			if (phase != GAME_PHASE.GAME_START) return state;

			const deck = buildDeck();
			const shuffledDeck = shuffleFisherYates(deck, rand);
			return {
				...INITIAL_GAME_STATE,
				players: {
					p1: { hand: [], deck: shuffledDeck.slice(0, 26), loot: [], played: [] },
					p2: { hand: [], deck: shuffledDeck.slice(26), loot: [], played: [] },
				},
				phase: GAME_PHASE.ROUND_PREP,
			}
		}

		case GAME_ACTYPE.RESET_GAME: {
			return INITIAL_GAME_STATE;
		}

		case GAME_ACTYPE.DRAW_CARDS: {
			const { players, phase } = state;
			const { p1, p2 } = players;
			if (phase !== GAME_PHASE.ROUND_PREP) return state;

			return {
				...state,
				players: {
					p1: drawFromDeck(p1, MAX_HAND_COUNT),
					p2: drawFromDeck(p2, MAX_HAND_COUNT),
				},
				phase: GAME_PHASE.ROUND_DRAWED,
			}
		}

		case GAME_ACTYPE.PLAY_CARDS: {
			const { players, field, phase } = state;
			const { slot, cards } = action.payload;
			const player = players[slot];

			if (phase !== GAME_PHASE.ROUND_DRAWED) return state;
			if (player.played.length > 0) return state;
			if (cards.length !== PLAY_CARD_COUNT) return state;

			const newPlayer = playCards(player, cards);
			const newState = {
				...state,
				players: {
					...players,
					[slot]: newPlayer,
				},
				field: [...field, ...newPlayer.played],
			};

			// Update phase when both players played
			const allPlayersPlayed = Object.values(newState.players)
				.every((p) => p.played.length > 0);
			if (allPlayersPlayed) {
				newState.players = {
					p1: resetPlayed(newState.players.p1),
					p2: resetPlayed(newState.players.p2),
				}
				newState.phase = GAME_PHASE.ROUND_PLAYED;
			}
			return newState;
		}

		case GAME_ACTYPE.LOOT_CARDS: {
			const { players, field, phase } = state;
			const slot = action.payload;
			const player = players[slot];

			if (phase !== GAME_PHASE.ROUND_PLAYED) return state;
			return {
				...state,
				players: {
					...players,
					[slot]: lootCards(player, field),
				},
				field: [],
				phase: GAME_PHASE.ROUND_RESULT,
			};
		}

		case GAME_ACTYPE.NEXT_ROUND: {
			const { players, phase, round } = state;
			const rand = action.payload;
			if (phase !== GAME_PHASE.ROUND_RESULT) return state;

			const somePlayerDeckEmpty = Object.values(players)
				.some((p) => p.deck.length == 0);
			if (somePlayerDeckEmpty) {
				return mergeLootIntoDeck(state, rand);
			}

			return {
				...state,
				phase: GAME_PHASE.ROUND_PREP,
				round: round + 1,
			};
		}

		case GAME_ACTYPE.SYNC_STATE:
			return action.payload;

		default:
			return state;
	};
};