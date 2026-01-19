# Twentie-Four

Simple online game that supports P2P hosting.


## Change Log

### v0.1.0
UI Implementation
- Completes UI of all components, including:
    - Main `GamePlay` page, `PlayerZone` component, `TableArea` component, `Controls` component
    - Re-usable `PokerCards` component with flip animation
- Handles all API connections from the game logic to UI components.
- Game is now ready to play!

### v0.0.3
UI implementation
- Implements `Lobby` page:
    - Implements 3 stages: default, joining room, and waiting to join.
    - Implements `Loader` component.

### v0.0.2
- Improves `useP2PHost` hook:
    - Cleans up `connReducer` and constants from `useP2PHost.js`.
    - Implements maximum host capacity that disconnects new connection beyond capacity.
- Improves `useGameLogic` hook:
    - Changes most `useGameLogic` APIs into action creators.
    - Adds voting mechanics to decide round winner.
    - Optimizes code logic in `gameReducer` and adds more actions.
    - Implements game phase listner in the `GameRoom` to automate game process.
- Couples `useP2PHost` and `useGameLogic` hooks to construct an interactive game logic.

### v0.0.1
- Implements `connReducer, useP2PHost`, the main P2P hosting hook and connection state reducer.
- Implements `gameReducer, useGameLogic`, the main twentie-four game logic hook and game state reducer.