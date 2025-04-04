/**
 * Interface for participant data
 */
export interface Participant {
  name: string;
  selected: boolean;
}

/**
 * Type for tracking which team received the extra player
 */
export type ExtraPlayerTeam = 'red' | 'blue' | null;

/**
 * Storage service for persisting team names across sessions using localStorage
 */
export class StorageService {
  private readonly participantsKey: string = 'teamDistributor_participants';
  private readonly extraPlayerTeamKey: string = 'teamDistributor_extraPlayerTeam';

  /**
   * Save participants to localStorage
   * @param participants List of participants with selection status
   */
  public saveParticipants(participants: Participant[]): void {
    localStorage.setItem(this.participantsKey, JSON.stringify(participants));
  }

  /**
   * Get saved participants from localStorage
   * @returns Array of saved participants or empty array if none found
   */
  public getParticipants(): Participant[] {
    const savedParticipants = localStorage.getItem(this.participantsKey);
    return savedParticipants ? JSON.parse(savedParticipants) : [];
  }

  /**
   * Clear saved participants from localStorage
   */
  public clearParticipants(): void {
    localStorage.removeItem(this.participantsKey);
  }

  /**
   * Save which team received the extra player in the last distribution
   * @param team The team that received the extra player ('red', 'blue', or null)
   */
  public saveExtraPlayerTeam(team: ExtraPlayerTeam): void {
    localStorage.setItem(this.extraPlayerTeamKey, JSON.stringify(team));
  }

  /**
   * Get which team received the extra player in the last distribution
   * @returns The team that received the extra player, or null if no previous distribution
   */
  public getExtraPlayerTeam(): ExtraPlayerTeam {
    const savedTeam = localStorage.getItem(this.extraPlayerTeamKey);
    return savedTeam ? JSON.parse(savedTeam) : null;
  }
}