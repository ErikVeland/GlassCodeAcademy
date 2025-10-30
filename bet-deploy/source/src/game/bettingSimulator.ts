// src/game/bettingSimulator.ts
// Betting simulator for use with the simulated racing engine.
// Supports WIN, PLACE, EACH_WAY, and MULTI (parlay) across legs.
// Settles using decimal odds; derives PLACE odds from WIN via configurable factors.
// No external deps. Ready to plug into UI + your createRaceSimulation() module.

export type CategoryId =
	| '4a2788f8-e825-4d36-9894-efd4baf1cfae' // Horse
	| '9daef0d7-bf3c-4f50-921d-8e818c60fe61' // Greyhound
	| '161d9be2-e909-4326-8c2c-35ed71fb460b' // Harness
	| string

// Extended bet types to include exotic bets
export type WagerType = 'WIN' | 'PLACE' | 'EACH_WAY' | 'MULTI' | 'QUINELLA' | 'TRIFECTA' | 'FIRST_FOUR'

export interface RunnerQuote {
	runnerId: string
	number: number
	name: string
	decimalOdds: number | null // null => SP/unknown; we will treat as 6.00 default unless you override
}

export interface RaceQuote {
	raceId: string
	meetingName: string
	raceNumber: number
	categoryId: CategoryId
	advertisedStartMs: number
	runners: RunnerQuote[]
	// Optional field size to drive place terms; if omitted, we infer from runners.length
	fieldSize?: number
}

export interface RaceResult {
	raceId: string
	placings: string[] // runnerIds ordered 1..last
	finishTimesMs: Record<string, number>
}

export interface BankrollSnapshot {
	balance: number
	locked: number
	settledProfitLoss: number
	turnover: number
}

export interface BetLeg {
	raceId: string
	selectionRunnerId: string
	selectionName: string
	oddsDecimalAtPlacement: number // WIN decimal odds at placement (snapshot)
	// Derived place odds factorised from win; filled at placement for consistency
	placeOddsDecimal: number
	categoryId: CategoryId
	fieldSize: number
}

export interface BetBase {
	betId: string
	placedAtMs: number
	stake: number // for MULTI: this is the unit stake applied to leg multiplier
	type: WagerType
	status: 'PENDING' | 'WON' | 'LOST' | 'VOID' | 'SETTLED_PARTIAL' | 'CASHED_OUT'
	potentialReturn?: number // snapshot (for UI only)
	cashoutValue?: number // partial cashout value
}

export interface SingleBet extends BetBase {
	type: 'WIN' | 'PLACE' | 'EACH_WAY'
	leg: BetLeg
}

export interface MultiBet extends BetBase {
	type: 'MULTI'
	legs: BetLeg[]
	// progressive cashout calc helper (optional UI feature)
	progressiveReturn?: number
}

// New interfaces for exotic bets
export interface ExoticBet extends BetBase {
	type: 'QUINELLA' | 'TRIFECTA' | 'FIRST_FOUR'
	legs: BetLeg[]
	selections: string[][] // Array of runner IDs for each position
}

export type Bet = SingleBet | MultiBet | ExoticBet

export interface SettlementRecord {
	betId: string
	type: WagerType
	stake: number
	result: 'WON' | 'LOST' | 'VOID' | 'CASHED_OUT'
	payout: number // stake + profit for winning; stake for void; 0 for lost
	profitLoss: number // payout - stake (for EACH_WAY, sum of components)
	breakdown: string // human-readable details for receipts
	settledAtMs: number
}

export interface BettingConfig {
	defaultSpDecimal: number // used if odds missing
	// Place terms by category: multiplier applied to (winOdds - 1); placeOdds = 1 + factor*(winOdds-1)
	placeTerms: Record<string, { factor: number; places: (fieldSize: number) => number }>
	maxLegsMulti: number
	minStake: number
	maxStake: number
	currency: string
	// Cashout configuration
	cashoutFeePercent: number // Percentage fee for cashout (0-100)
}

export const DEFAULT_CONFIG: BettingConfig = {
	defaultSpDecimal: 6.0,
	placeTerms: {
		// Realistic place terms by category
		'4a2788f8-e825-4d36-9894-efd4baf1cfae': { // Horse - Typically pays 3 places for 8+ runners, 2 places for 5-7 runners, 1 place for 4 or fewer
			factor: 0.25,
			places: (n) => (n >= 8 ? 3 : n >= 5 ? 2 : 1)
		},
		'161d9be2-e909-4326-8c2c-35ed71fb460b': { // Harness - Typically pays 3 places for 8+ runners, 2 places for 5-7 runners, 1 place for 4 or fewer
			factor: 0.25,
			places: (n) => (n >= 8 ? 3 : n >= 5 ? 2 : 1)
		},
		'9daef0d7-bf3c-4f50-921d-8e818c60fe61': { // Greyhound - Typically pays 3 places for 8+ runners, 2 places for 5-7 runners, 1 place for 4 or fewer
			factor: 0.33,
			places: (n) => (n >= 8 ? 3 : n >= 5 ? 2 : 1)
		},
		default: {
			factor: 0.25,
			places: (n) => (n >= 8 ? 3 : n >= 5 ? 2 : 1)
		}
	},
	maxLegsMulti: 10,
	minStake: 0.1,
	maxStake: 1000, // Updated to 1000 cents ($10.00) as per project requirements
	currency: 'Credits',
	cashoutFeePercent: 5 // 5% fee for cashout
}

/* --------------------------------- Helpers -------------------------------- */

function pickTerms(cfg: BettingConfig, cat: CategoryId) {
	return cfg.placeTerms[cat] ?? cfg.placeTerms['default']
}

function derivePlaceOddsDecimal(winDecimal: number, cfg: BettingConfig, cat: CategoryId): number {
	const terms = pickTerms(cfg, cat)
	const overOne = Math.max(0, winDecimal - 1)
	return 1 + terms.factor * overOne
}

function getPlacesAllowed(cfg: BettingConfig, cat: CategoryId, fieldSize: number): number {
	const terms = pickTerms(cfg, cat)
	return Math.max(1, terms.places(fieldSize))
}

function decimalOddsOrSP(odds: number | null | undefined, cfg: BettingConfig): number {
	return odds && odds > 1.01 ? Number(odds) : cfg.defaultSpDecimal
}

function fmt(n: number): string {
	return (Math.round(n * 100) / 100).toFixed(2)
}

/* ------------------------------- Main Engine ------------------------------ */

export class BettingEngine {
	private cfg: BettingConfig
	private balance: number
	private locked: number
	private settledPnl: number
	private turnover: number
	private bets: Map<string, Bet>
	private raceToPendingBets: Map<string, Set<string>>

	constructor(initialBankroll = 1000, cfg: BettingConfig = DEFAULT_CONFIG) {
		this.cfg = cfg
		this.balance = initialBankroll
		this.locked = 0
		this.settledPnl = 0
		this.turnover = 0
		this.bets = new Map()
		this.raceToPendingBets = new Map()
	}

	// Method to add credits to the bankroll (for restarting the game)
	addCredits(amount: number) {
		if (amount > 0) {
			this.balance += amount
			this.settledPnl += amount
		}
	}

	getBankroll(): BankrollSnapshot {
		return { balance: this.balance, locked: this.locked, settledProfitLoss: this.settledPnl, turnover: this.turnover }
	}

	listBets(): Bet[] {
		return Array.from(this.bets.values()).sort((a, b) => a.placedAtMs - b.placedAtMs)
	}

	getPendingBetsForRace(raceId: string): Bet[] {
		const betIds = this.raceToPendingBets.get(raceId)
		if (!betIds) return []
		
		const pendingBets: Bet[] = []
		for (const betId of betIds) {
			const bet = this.bets.get(betId)
			if (bet && bet.status === 'PENDING') {
				pendingBets.push(bet)
			}
		}
		
		return pendingBets.sort((a, b) => a.placedAtMs - b.placedAtMs)
	}

	/* ---------------------------- Bet Placement --------------------------- */

	placeSingleWin(rq: RaceQuote, runnerId: string, stake: number, betId: string): SingleBet {
		return this.placeSingle(rq, runnerId, stake, betId, 'WIN')
	}

	placeSinglePlace(rq: RaceQuote, runnerId: string, stake: number, betId: string): SingleBet {
		return this.placeSingle(rq, runnerId, stake, betId, 'PLACE')
	}

	placeSingleEachWay(rq: RaceQuote, runnerId: string, stake: number, betId: string): SingleBet {
		// EACH_WAY: stake is total stake (split 50/50 into WIN and PLACE components)
		return this.placeSingle(rq, runnerId, stake, betId, 'EACH_WAY')
	}

	// New method to place exotic bets
	placeExoticBet(
		rq: RaceQuote,
		selections: string[][], // Array of runner IDs for each position
		stake: number,
		betType: 'QUINELLA' | 'TRIFECTA' | 'FIRST_FOUR',
		betId: string
	): ExoticBet {
		this.ensureStake(stake)
		
		// Check if betting is allowed
		if (!this.isBettingAllowed(rq.advertisedStartMs)) {
			throw new Error('Betting is closed for this race')
		}
		
		// Validate selections
		if (betType === 'QUINELLA' && selections.length !== 2) {
			throw new Error('QUINELLA requires exactly 2 positions')
		}
		if (betType === 'TRIFECTA' && selections.length !== 3) {
			throw new Error('TRIFECTA requires exactly 3 positions')
		}
		if (betType === 'FIRST_FOUR' && selections.length !== 4) {
			throw new Error('FIRST_FOUR requires exactly 4 positions')
		}
		
		// Build legs for each selection
		const legs: BetLeg[] = []
		for (const [index, positionSelections] of selections.entries()) {
			// For simplicity, we'll use the first selection in each position for the leg
			// In a real implementation, this would be more complex
			const runnerId = positionSelections[0]
			const r = rq.runners.find(x => x.runnerId === runnerId)
			if (!r) throw new Error(`Runner ${runnerId} not found in race ${rq.raceId}`)
			
			const winOdds = decimalOddsOrSP(r.decimalOdds, this.cfg)
			const placeOdds = derivePlaceOddsDecimal(winOdds, this.cfg, rq.categoryId)
			
			legs.push({
				raceId: rq.raceId,
				selectionRunnerId: r.runnerId,
				selectionName: r.name,
				oddsDecimalAtPlacement: winOdds,
				placeOddsDecimal: placeOdds,
				categoryId: rq.categoryId,
				fieldSize: rq.fieldSize ?? rq.runners.length
			})
		}
		
		// Calculate potential return (simplified calculation)
		let potentialMultiplier = 1
		for (const leg of legs) {
			potentialMultiplier *= leg.oddsDecimalAtPlacement
		}
		
		// Adjust for multiple selections in each position
		for (const positionSelections of selections) {
			potentialMultiplier /= positionSelections.length
		}
		
		const potential = stake * potentialMultiplier
		
		const bet: ExoticBet = {
			betId,
			placedAtMs: Date.now(),
			stake,
			type: betType,
			status: 'PENDING',
			legs,
			selections,
			potentialReturn: Number(fmt(potential))
		}
		
		this.lockFunds(stake)
		this.storeBet(bet)
		this.indexBetForRace(rq.raceId, bet.betId)
		return bet
	}

	placeBet(raceId: string, runnerId: string, stake: number, odds: number | 'SP', advertisedStartMs?: number, meetingName?: string, raceNumber?: number, runnerName?: string, categoryId?: CategoryId): string {
		// BettingEngine.placeBet called with: { raceId, runnerId, stake, odds, advertisedStartMs }
		
		// Validate required parameters - throw error if not provided
		if (!raceId) throw new Error('Race ID is required')
		if (!runnerId) throw new Error('Runner ID is required')
		if (!meetingName) throw new Error('Meeting name is required')
		if (!raceNumber) throw new Error('Race number is required')
		if (!runnerName) throw new Error('Runner name is required')
		if (!categoryId) throw new Error('Category ID is required')
		if (!advertisedStartMs) throw new Error('Advertised start time is required')
		
		// Create a RaceQuote with actual race information
		const rq: RaceQuote = {
			raceId: raceId,
			meetingName: meetingName,
			raceNumber: raceNumber,
			categoryId: categoryId,
			advertisedStartMs: advertisedStartMs,
			runners: [
				{
					runnerId: runnerId,
					number: 1, // This should be updated with actual runner data
					name: runnerName,
					decimalOdds: odds === 'SP' ? null : odds
				}
			]
		}

		// Check if betting is allowed
		// Checking if betting is allowed. Current time: Date.now() Race start time: rq.advertisedStartMs
		if (!this.isBettingAllowed(rq.advertisedStartMs)) {
			const error = new Error('Betting is closed for this race');
			// Betting not allowed: error.message
			throw error;
		}

		// Generate a unique bet ID
		const betId = `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
		// Generated bet ID: betId

		// Place a WIN bet
		this.placeSingleWin(rq, runnerId, stake, betId)
		// Successfully placed single win bet

		return betId
	}

	placeMulti(legs: Array<{ rq: RaceQuote; runnerId: string }>, stake: number, betId: string): MultiBet {
		if (legs.length < 2) throw new Error('MULTI requires at least 2 legs')
		if (legs.length > this.cfg.maxLegsMulti) throw new Error(`MULTI max legs ${this.cfg.maxLegsMulti}`)
		this.ensureStake(stake)

		// Check if betting is allowed for all legs
		for (const { rq } of legs) {
			if (!this.isBettingAllowed(rq.advertisedStartMs)) {
				throw new Error('Betting is closed for one or more races in this multi bet')
			}
		}

		const builtLegs: BetLeg[] = legs.map(({ rq, runnerId }) => {
			const r = rq.runners.find(x => x.runnerId === runnerId)
			if (!r) throw new Error(`Runner ${runnerId} not found in race ${rq.raceId}`)
			const winOdds = decimalOddsOrSP(r.decimalOdds, this.cfg)
			const placeOdds = derivePlaceOddsDecimal(winOdds, this.cfg, rq.categoryId)
			return {
				raceId: rq.raceId,
				selectionRunnerId: r.runnerId,
				selectionName: r.name,
				oddsDecimalAtPlacement: winOdds,
				placeOddsDecimal: placeOdds,
				categoryId: rq.categoryId,
				fieldSize: rq.fieldSize ?? rq.runners.length
			}
		})

		const potential = builtLegs.reduce((acc, leg) => acc * leg.oddsDecimalAtPlacement, 1) * stake
		const bet: MultiBet = {
			betId,
			placedAtMs: Date.now(),
			stake,
			type: 'MULTI',
			status: 'PENDING',
			legs: builtLegs,
			potentialReturn: Number(fmt(potential))
		}
		this.lockFunds(stake)
		this.storeBet(bet)
		for (const leg of builtLegs) this.indexBetForRace(leg.raceId, bet.betId)
		return bet
	}

	private placeSingle(rq: RaceQuote, runnerId: string, stake: number, betId: string, type: 'WIN' | 'PLACE' | 'EACH_WAY'): SingleBet {
		// placeSingle called with: { rq, runnerId, stake, betId, type }
		this.ensureStake(stake)
		
		// Check if betting is allowed
		if (!this.isBettingAllowed(rq.advertisedStartMs)) {
			throw new Error('Betting is closed for this race')
		}
		
		const r = rq.runners.find(x => x.runnerId === runnerId)
		if (!r) throw new Error(`Runner ${runnerId} not found in race ${rq.raceId}`)
		const winOdds = decimalOddsOrSP(r.decimalOdds, this.cfg)
		const placeOdds = derivePlaceOddsDecimal(winOdds, this.cfg, rq.categoryId)
		const fieldSize = rq.fieldSize ?? rq.runners.length
		const leg: BetLeg = {
			raceId: rq.raceId,
			selectionRunnerId: r.runnerId,
			selectionName: r.name,
			oddsDecimalAtPlacement: winOdds,
			placeOddsDecimal: placeOdds,
			categoryId: rq.categoryId,
			fieldSize
		}

		const potential = (() => {
			if (type === 'WIN') return stake * winOdds
			if (type === 'PLACE') return stake * placeOdds
			// EACH_WAY: half stake on WIN and half on PLACE
			const half = stake / 2
			return half * winOdds + half * placeOdds
		})()

		const bet: SingleBet = {
			betId,
			placedAtMs: Date.now(),
			stake,
			type,
			status: 'PENDING',
			leg,
			potentialReturn: Number(fmt(potential))
		}
		this.lockFunds(stake)
		this.storeBet(bet)
		this.indexBetForRace(rq.raceId, bet.betId)
		// placeSingle returning bet: bet
		return bet
	}

	/* ------------------------------- Cashout ------------------------------ */

	// Request partial cashout for a bet
	requestCashout(betId: string, cashoutValue?: number): boolean {
		const bet = this.bets.get(betId)
		if (!bet) return false
		if (bet.status !== 'PENDING') return false
		
		// If no cashout value provided, calculate it based on current odds
		let actualCashoutValue = cashoutValue
		if (actualCashoutValue === undefined) {
			// Calculate cashout value based on current odds and potential return
			// This is a simplified calculation - in a real implementation, this would be more complex
			const potential = bet.potentialReturn || 0
			// Apply a discount factor based on risk (typically 70-90% of potential return)
			const discountFactor = 0.85 // 85% of potential return
			actualCashoutValue = potential * discountFactor
			
			// Apply cashout fee
			const fee = actualCashoutValue * (this.cfg.cashoutFeePercent / 100)
			actualCashoutValue -= fee
		}
		
		// Ensure cashout value is reasonable
		if (actualCashoutValue <= 0 || actualCashoutValue > (bet.potentialReturn || 0)) {
			return false
		}
		
		// Process cashout
		this.unlockFunds(bet.stake)
		this.credit(actualCashoutValue)
		bet.status = 'CASHED_OUT'
		bet.cashoutValue = Number(fmt(actualCashoutValue))
		
		// Remove from pending bets for all races
		for (const raceId of this.raceToPendingBets.keys()) {
			const betIds = this.raceToPendingBets.get(raceId)
			if (betIds) {
				betIds.delete(betId)
			}
		}
		
		return true
	}

	/* ------------------------------- Cancels ------------------------------ */

	// Optional: allow cancel before advertised start
	tryCancel(betId: string, raceClockMs: number, advertisedStartMs: number): boolean {
		const bet = this.bets.get(betId)
		if (!bet) return false
		if (bet.status !== 'PENDING') return false
		if (raceClockMs >= advertisedStartMs) return false // market closed
		this.unlockFunds(bet.stake)
		bet.status = 'VOID'
		this.postSettle(bet, { payout: bet.stake, profitLoss: 0, result: 'VOID', breakdown: 'Cancelled pre-start' })
		return true
	}

	cancelBet(betId: string): boolean {
		const now = Date.now()
		// Use a future time to allow cancellation
		return this.tryCancel(betId, now, now + 3600000) // Allow cancellation for 1 hour
	}

	/* ----------------------------- Settlement ----------------------------- */

	// Call this when a simulated race finishes. It settles single bets for that race,
	// and advances/parlays MULTIs. Returns settlement records for UI.
	settleRace(result: RaceResult): SettlementRecord[] {
		const impacted = this.raceToPendingBets.get(result.raceId)
		if (!impacted || impacted.size === 0) return []
		const records: SettlementRecord[] = []
		
		// Batch processing for better performance
		const batch: Array<() => void> = []
		
		for (const betId of Array.from(impacted)) {
			const bet = this.bets.get(betId)
			if (!bet || bet.status !== 'PENDING') continue

			if (bet.type === 'MULTI') {
				batch.push(() => {
					const rec = this.progressMulti(bet as MultiBet, result)
					if (rec) records.push(rec)
				})
			} else if (['QUINELLA', 'TRIFECTA', 'FIRST_FOUR'].includes(bet.type)) {
				batch.push(() => {
					const rec = this.settleExotic(bet as ExoticBet, result)
					records.push(rec)
				})
			} else {
				batch.push(() => {
					const rec = this.settleSingle(bet as SingleBet, result)
					records.push(rec)
				})
			}
		}
		
		// Apply all settlements at once
		batch.forEach(settle => settle())
		
		// Clean index for this race after settlements
		this.raceToPendingBets.delete(result.raceId)
		return records
	}

	private settleSingle(bet: SingleBet, result: RaceResult): SettlementRecord {
		const leg = bet.leg
		const position = result.placings.indexOf(leg.selectionRunnerId) + 1 // 1-based; 0 => not found
		const placesAllowed = getPlacesAllowed(this.cfg, leg.categoryId, leg.fieldSize)
		let payout = 0
		let breakdown = ''
		let finalResult: 'WON' | 'LOST' | 'VOID' = 'LOST'

		// Check for dead heats (multiple runners in the same position)
		const runnersInPosition = result.placings.filter((runnerId, index) => index + 1 === position).length;
		const deadHeatDivisor = runnersInPosition > 1 ? runnersInPosition : 1;

		if (bet.type === 'WIN') {
			if (position === 1) {
				payout = (bet.stake * leg.oddsDecimalAtPlacement) / deadHeatDivisor;
				finalResult = 'WON'
				breakdown = `WIN @ ${fmt(leg.oddsDecimalAtPlacement)} (P1${runnersInPosition > 1 ? `, dead heat with ${runnersInPosition - 1} other${runnersInPosition - 1 > 1 ? 's' : ''}` : ''})`
			} else {
				payout = 0
				breakdown = `WIN lost (P${position || 'DNF'})`
			}
		} else if (bet.type === 'PLACE') {
			if (position >= 1 && position <= placesAllowed) {
				payout = (bet.stake * leg.placeOddsDecimal) / deadHeatDivisor;
				finalResult = 'WON'
				breakdown = `PLACE @ ${fmt(leg.placeOddsDecimal)} (P${position}/${placesAllowed}${runnersInPosition > 1 ? `, dead heat with ${runnersInPosition - 1} other${runnersInPosition - 1 > 1 ? 's' : ''}` : ''})`
			} else {
				payout = 0
				breakdown = `PLACE lost (P${position || 'DNF'}, pays ${placesAllowed})`
			}
		} else {
			const half = bet.stake / 2
			let winPart = 0
			let placePart = 0
			let winWon = false
			let placeWon = false
			if (position === 1) {
				winPart = (half * leg.oddsDecimalAtPlacement) / deadHeatDivisor;
				winWon = true
			}
			if (position >= 1 && position <= placesAllowed) {
				placePart = (half * leg.placeOddsDecimal) / deadHeatDivisor;
				placeWon = true
			}
			payout = winPart + placePart
			finalResult = winWon || placeWon ? (winWon && placeWon ? 'WON' : 'SETTLED_PARTIAL') as any : 'LOST'
			breakdown = `E/W: WIN@${fmt(leg.oddsDecimalAtPlacement)} ${winWon ? '✓' : '✗'} + PLACE@${fmt(leg.placeOddsDecimal)} ${placeWon ? '✓' : '✗'} (P${position || 'DNF'}, pays ${placesAllowed}${runnersInPosition > 1 ? `, dead heat with ${runnersInPosition - 1} other${runnersInPosition - 1 > 1 ? 's' : ''}` : ''})`
		}

		this.unlockFunds(bet.stake)
		this.credit(payout)
		bet.status = finalResult === 'VOID' ? 'VOID' : finalResult
		return this.postSettle(bet, { payout, profitLoss: payout - bet.stake, result: finalResult, breakdown })
	}

	// New method to settle exotic bets
	private settleExotic(bet: ExoticBet, result: RaceResult): SettlementRecord {
		const positions = result.placings
		let payout = 0
		let breakdown = ''
		
		// Enhanced exotic bet settlement logic
		let isWin = false;
		let winningCombinations = 0;
		
		// Handle different exotic bet types
		switch (bet.type) {
			case 'QUINELLA':
				// QUINELLA: Top 2 finishers in any order
				// Check if both selected runners finished in top 2 positions (any order)
				if (bet.selections.length === 2) {
					const firstPositionRunners = bet.selections[0];
					const secondPositionRunners = bet.selections[1];
					
					// Check if the actual first and second place runners are in our selections
					const actualFirst = positions[0];
					const actualSecond = positions[1];
					
					// Win if both runners are in the top 2 (in any order)
					isWin = (firstPositionRunners.includes(actualFirst) && secondPositionRunners.includes(actualSecond)) ||
							(firstPositionRunners.includes(actualSecond) && secondPositionRunners.includes(actualFirst));
					
					if (isWin) {
						winningCombinations = 1;
						// For QUINELLA, we need to calculate combinations
						// If both positions have multiple selections, we have more combinations
						const firstCombos = firstPositionRunners.length;
						const secondCombos = secondPositionRunners.length;
						winningCombinations = firstCombos * secondCombos;
					}
				}
				break;
				
			case 'TRIFECTA':
				// TRIFECTA: Top 3 finishers in exact order
				if (bet.selections.length === 3) {
					isWin = true;
					winningCombinations = 1;
					
					// Check each position
					for (let i = 0; i < 3; i++) {
						const positionSelections = bet.selections[i];
						const actualWinner = positions[i];
						
						if (!positionSelections.includes(actualWinner)) {
							isWin = false;
							break;
						}
						
						// Count combinations for this position
						winningCombinations *= positionSelections.length;
					}
				}
				break;
				
			case 'FIRST_FOUR':
				// FIRST_FOUR: Top 4 finishers in exact order
				if (bet.selections.length === 4) {
					isWin = true;
					winningCombinations = 1;
					
					// Check each position
					for (let i = 0; i < 4; i++) {
						const positionSelections = bet.selections[i];
						const actualWinner = positions[i];
						
						if (!positionSelections.includes(actualWinner)) {
							isWin = false;
							break;
						}
						
						// Count combinations for this position
						winningCombinations *= positionSelections.length;
					}
				}
				break;
				
			default:
				// Fallback to original logic for unknown bet types
				isWin = true;
				for (let i = 0; i < bet.selections.length; i++) {
					const positionSelections = bet.selections[i];
					const actualWinner = positions[i];
					
					if (!positionSelections.includes(actualWinner)) {
						isWin = false;
						break;
					}
				}
				winningCombinations = 1;
				break;
		}
		
		// Check for dead heats in each position
		let deadHeatDivisor = 1;
		for (let i = 0; i < Math.min(bet.selections.length, positions.length); i++) {
			const positionIndex = i + 1; // 1-based position
			const runnersInPosition = result.placings.filter((runnerId, index) => index + 1 === positionIndex).length;
			if (runnersInPosition > 1) {
				deadHeatDivisor *= runnersInPosition;
			}
		}
		
		if (isWin) {
			// Calculate payout based on the odds of the winning selections
			let totalOdds = 1
			for (let i = 0; i < bet.legs.length; i++) {
				totalOdds *= bet.legs[i].oddsDecimalAtPlacement
			}
			
			// Adjust payout based on winning combinations and dead heats
			payout = (bet.stake * totalOdds * winningCombinations) / deadHeatDivisor;
			breakdown = `${bet.type} won @ ${fmt(totalOdds)} (combinations: ${winningCombinations}${deadHeatDivisor > 1 ? `, dead heat divisor: ${deadHeatDivisor}` : ''})`
		} else {
			payout = 0
			breakdown = `${bet.type} lost`
		}
		
		this.unlockFunds(bet.stake)
		this.credit(payout)
		bet.status = isWin ? 'WON' : 'LOST'
		return this.postSettle(bet, { payout, profitLoss: payout - bet.stake, result: isWin ? 'WON' : 'LOST', breakdown })
	}

	private progressMulti(bet: MultiBet, result: RaceResult): SettlementRecord | null {
		// Identify which leg this result belongs to
		const idx = bet.legs.findIndex(l => l.raceId === result.raceId)
		if (idx === -1) return null

		// Compute whether selection won this leg; MULTI uses WIN outcomes
		const leg = bet.legs[idx]
		const won = result.placings[0] === leg.selectionRunnerId

		// Check for dead heat in first position
		const runnersInFirstPosition = result.placings.filter((runnerId, index) => index === 0).length;
		const deadHeatDivisor = runnersInFirstPosition > 1 ? runnersInFirstPosition : 1;

		// Track progressive multiplier
		if (won) {
			const multiplierBefore = bet.progressiveReturn ? bet.progressiveReturn / bet.stake : 1
			const nextMultiplier = (multiplierBefore * leg.oddsDecimalAtPlacement) / deadHeatDivisor;
			bet.progressiveReturn = bet.stake * nextMultiplier
		} else {
			// Lose entire multi
			this.unlockFunds(bet.stake)
			bet.status = 'LOST'
			return this.postSettle(bet, {
				payout: 0,
				profitLoss: -bet.stake,
				result: 'LOST',
				breakdown: `Leg ${idx + 1}/${bet.legs.length} lost: ${leg.selectionName} WIN@${fmt(leg.oddsDecimalAtPlacement)}${deadHeatDivisor > 1 ? ` (dead heat with ${deadHeatDivisor - 1} other${deadHeatDivisor - 1 > 1 ? 's' : ''})` : ''}`
			})
		}

		// If this was the last leg, pay out
		const remaining = bet.legs.slice(idx + 1)
		if (remaining.length === 0) {
			const payout = (bet.progressiveReturn ?? 0) / deadHeatDivisor;
			this.unlockFunds(bet.stake)
			this.credit(payout)
			bet.status = 'WON'
			return this.postSettle(bet, {
				payout,
				profitLoss: payout - bet.stake,
				result: 'WON',
				breakdown: `MULTI won. Legs: ${bet.legs.length}, Return: ${fmt(payout)}${deadHeatDivisor > 1 ? ` (dead heat divisor: ${deadHeatDivisor})` : ''}`
			})
		}

		// Still pending: keep indexed for the next legs
		return null
	}

	/* ------------------------------ Accounting ---------------------------- */

	private ensureStake(stake: number) {
		if (stake < this.cfg.minStake) throw new Error(`Min stake ${this.cfg.minStake}`)
		if (stake > this.cfg.maxStake) throw new Error(`Max stake ${this.cfg.maxStake}`)
		if (stake > this.balance) throw new Error('Insufficient funds')
	}

	// Check if betting is allowed for a race based on start time
	private isBettingAllowed(advertisedStartMs: number): boolean {
		const now = Date.now();
		// Market closes when race starts
		const result = now < advertisedStartMs;
		// isBettingAllowed check: { now, advertisedStartMs, result }
		return result;
	}

	private lockFunds(stake: number) {
		this.balance -= stake
		this.locked += stake
		this.turnover += stake
	}

	private unlockFunds(stake: number) {
		this.locked -= stake
		this.balance += stake
	}

	private credit(amount: number) {
		this.balance += amount
		this.settledPnl += amount
	}

	private storeBet(b: Bet) {
		this.bets.set(b.betId, b)
	}

	private indexBetForRace(raceId: string, betId: string) {
		if (!this.raceToPendingBets.has(raceId)) this.raceToPendingBets.set(raceId, new Set())
		this.raceToPendingBets.get(raceId)!.add(betId)
	}

	private postSettle(bet: Bet, info: { payout: number; profitLoss: number; result: 'WON' | 'LOST' | 'VOID' | 'CASHED_OUT'; breakdown: string }): SettlementRecord {
		const rec: SettlementRecord = {
			betId: bet.betId,
			type: bet.type,
			stake: bet.stake,
			result: info.result,
			payout: Number(fmt(info.payout)),
			profitLoss: Number(fmt(info.profitLoss)),
			breakdown: info.breakdown,
			settledAtMs: Date.now()
		}
		return rec
	}
}

/* -------------------------------- Wiring UX ------------------------------- */
/*
Example usage (with your existing simulated race engine):

import { createRaceSimulation } from '../sim/simulatedRace'
import { BettingEngine } from './bettingSimulator'

// 1) Build quotes from public API snapshot (WIN odds)
const rq: RaceQuote = {
  raceId: 'SIM_WARRAGUL_R12',
  meetingName: 'Warragul',
  raceNumber: 12,
  categoryId: '9daef0d7-bf3c-4f50-921d-8e818c60fe61',
  advertisedStartMs: Date.now() + 30000,
  runners: [
	{ runnerId: 'r1', number: 1, name: 'Got Immunity', decimalOdds: 2.4 },
	{ runnerId: 'r2', number: 2, name: 'She\'s Our Art', decimalOdds: 3.4 },
	{ runnerId: 'r3', number: 3, name: 'Disco Gizmo', decimalOdds: 6.0 },
	{ runnerId: 'r4', number: 4, name: 'Rumour Not Fact', decimalOdds: 11.0 },
	{ runnerId: 'r5', number: 5, name: 'Daintree Granite', decimalOdds: 13.0 }
  ],
  fieldSize: 8
}

const engine = new BettingEngine(1000)

// 2) Player places bets before start
engine.placeSingleWin(rq, 'r1', 20, 'B001')         // WIN 20 @ 2.40
engine.placeSingleEachWay(rq, 'r3', 10, 'B002')     // E/W total stake 10 (5 win + 5 place)
engine.placeMulti([{ rq, runnerId: 'r1' }, { rq, runnerId: 'r2' }], 5, 'B003') // silly same-race multi for demo

// 3) Run the simulated race
const sim = createRaceSimulation({
  id: rq.raceId,
  meetingName: rq.meetingName,
  raceNumber: rq.raceNumber,
  categoryId: rq.categoryId,
  runners: rq.runners.map(r => ({ id: r.runnerId, number: r.number, name: r.name, decimalOdds: r.decimalOdds ?? undefined }))
}, 12345, 200)

sim.onFinish((res) => {
  // 4) Settle bets when sim finishes
  const records = engine.settleRace({ raceId: res.raceId, placings: res.placings, finishTimesMs: res.finishTimesMs })
  // console.table(records)
  // Bankroll: engine.getBankroll()
})

sim.start()

// UI notes:
// - Hook engine.listBets() to your slip panel.
// - Show engine.getBankroll() top-right.
// - Disable place/cancel once Date.now() >= advertisedStartMs.
// - Add a "Simulated" badge and never present this as real wagering.
*/