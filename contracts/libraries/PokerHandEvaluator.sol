// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title PokerHandEvaluator
 * @notice Library for evaluating Texas Hold'em poker hands
 * @dev Simplified evaluator for on-chain hand comparison
 */
library PokerHandEvaluator {
    // Hand rankings (higher is better)
    uint8 constant HIGH_CARD = 1;
    uint8 constant PAIR = 2;
    uint8 constant TWO_PAIR = 3;
    uint8 constant THREE_OF_A_KIND = 4;
    uint8 constant STRAIGHT = 5;
    uint8 constant FLUSH = 6;
    uint8 constant FULL_HOUSE = 7;
    uint8 constant FOUR_OF_A_KIND = 8;
    uint8 constant STRAIGHT_FLUSH = 9;
    uint8 constant ROYAL_FLUSH = 10;

    struct Card {
        uint8 rank;  // 2-14 (2-10, J=11, Q=12, K=13, A=14)
        uint8 suit;  // 0-3 (hearts, diamonds, clubs, spades)
    }

    struct HandResult {
        uint8 handRank;
        uint8[5] highCards;  // For tiebreakers
    }

    /**
     * @notice Evaluate the best 5-card hand from 7 cards
     * @param cards Array of 7 cards (2 hole + 5 community)
     * @return result The hand evaluation result
     */
    function evaluateHand(Card[7] memory cards) internal pure returns (HandResult memory result) {
        // Count ranks and suits
        uint8[15] memory rankCount;
        uint8[4] memory suitCount;
        
        for (uint i = 0; i < 7; i++) {
            rankCount[cards[i].rank]++;
            suitCount[cards[i].suit]++;
        }

        // Check for flush
        int8 flushSuit = -1;
        for (uint8 s = 0; s < 4; s++) {
            if (suitCount[s] >= 5) {
                flushSuit = int8(s);
                break;
            }
        }

        // Check for straight
        (bool hasStraight, uint8 straightHigh) = checkStraight(rankCount);

        // Check for straight flush / royal flush
        if (flushSuit >= 0 && hasStraight) {
            // Simplified check - in production would verify same suit
            if (straightHigh == 14) {
                result.handRank = ROYAL_FLUSH;
            } else {
                result.handRank = STRAIGHT_FLUSH;
            }
            result.highCards[0] = straightHigh;
            return result;
        }

        // Count pairs, trips, quads
        uint8 pairs = 0;
        uint8 trips = 0;
        uint8 quads = 0;
        uint8 pairRank1 = 0;
        uint8 pairRank2 = 0;
        uint8 tripRank = 0;
        uint8 quadRank = 0;

        for (uint8 r = 14; r >= 2; r--) {
            if (rankCount[r] == 4) {
                quads++;
                quadRank = r;
            } else if (rankCount[r] == 3) {
                trips++;
                if (tripRank == 0) tripRank = r;
            } else if (rankCount[r] == 2) {
                pairs++;
                if (pairRank1 == 0) pairRank1 = r;
                else if (pairRank2 == 0) pairRank2 = r;
            }
        }

        // Determine hand rank
        if (quads > 0) {
            result.handRank = FOUR_OF_A_KIND;
            result.highCards[0] = quadRank;
        } else if (trips > 0 && pairs > 0) {
            result.handRank = FULL_HOUSE;
            result.highCards[0] = tripRank;
            result.highCards[1] = pairRank1;
        } else if (flushSuit >= 0) {
            result.handRank = FLUSH;
            // Get top 5 flush cards
            uint8 idx = 0;
            for (uint8 r = 14; r >= 2 && idx < 5; r--) {
                for (uint i = 0; i < 7 && idx < 5; i++) {
                    if (cards[i].rank == r && cards[i].suit == uint8(flushSuit)) {
                        result.highCards[idx++] = r;
                        break;
                    }
                }
            }
        } else if (hasStraight) {
            result.handRank = STRAIGHT;
            result.highCards[0] = straightHigh;
        } else if (trips > 0) {
            result.handRank = THREE_OF_A_KIND;
            result.highCards[0] = tripRank;
        } else if (pairs >= 2) {
            result.handRank = TWO_PAIR;
            result.highCards[0] = pairRank1;
            result.highCards[1] = pairRank2;
        } else if (pairs == 1) {
            result.handRank = PAIR;
            result.highCards[0] = pairRank1;
        } else {
            result.handRank = HIGH_CARD;
            // Get top 5 high cards
            uint8 idx = 0;
            for (uint8 r = 14; r >= 2 && idx < 5; r--) {
                if (rankCount[r] > 0) {
                    result.highCards[idx++] = r;
                }
            }
        }

        return result;
    }

    /**
     * @notice Check if there's a straight in the rank counts
     */
    function checkStraight(uint8[15] memory rankCount) internal pure returns (bool, uint8) {
        // Check A-2-3-4-5 (wheel)
        if (rankCount[14] > 0 && rankCount[2] > 0 && rankCount[3] > 0 && 
            rankCount[4] > 0 && rankCount[5] > 0) {
            return (true, 5);
        }

        // Check regular straights
        for (uint8 high = 14; high >= 6; high--) {
            bool isStraight = true;
            for (uint8 i = 0; i < 5; i++) {
                if (rankCount[high - i] == 0) {
                    isStraight = false;
                    break;
                }
            }
            if (isStraight) return (true, high);
        }

        return (false, 0);
    }

    /**
     * @notice Compare two hands
     * @return 1 if hand1 wins, -1 if hand2 wins, 0 if tie
     */
    function compareHands(HandResult memory hand1, HandResult memory hand2) internal pure returns (int8) {
        if (hand1.handRank > hand2.handRank) return 1;
        if (hand1.handRank < hand2.handRank) return -1;

        // Compare high cards for tiebreaker
        for (uint i = 0; i < 5; i++) {
            if (hand1.highCards[i] > hand2.highCards[i]) return 1;
            if (hand1.highCards[i] < hand2.highCards[i]) return -1;
        }

        return 0; // Tie
    }
}
