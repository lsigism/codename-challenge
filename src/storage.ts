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
  private readonly storagePrefix: string = 'v1_';
  private readonly participantsKey: string = `${this.storagePrefix}teamDistributor_participants`;
  private readonly extraPlayerTeamKey: string = `${this.storagePrefix}teamDistributor_extraPlayerTeam`;

  /**
   * Save participants to localStorage
   * @param participants List of participants with selection status
   * @returns Boolean indicating if the operation was successful
   */
  public saveParticipants(participants: Participant[]): boolean {
    try {
      localStorage.setItem(this.participantsKey, JSON.stringify(participants));
      return true;
    } catch (error) {
      console.error('Error saving participants:', error);
      return false;
    }
  }

  /**
   * Get saved participants from localStorage
   * @returns Array of saved participants or empty array if none found
   */
  public getParticipants(): Participant[] {
    try {
      const savedParticipants = localStorage.getItem(this.participantsKey);
      return savedParticipants ? JSON.parse(savedParticipants) : [];
    } catch (error) {
      console.error('Error retrieving participants:', error);
      return [];
    }
  }

  /**
   * Clear saved participants from localStorage
   * @returns Boolean indicating if the operation was successful
   */
  public clearParticipants(): boolean {
    try {
      localStorage.removeItem(this.participantsKey);
      return true;
    } catch (error) {
      console.error('Error clearing participants:', error);
      return false;
    }
  }

  /**
   * Save which team received the extra player in the last distribution
   * @param team The team that received the extra player ('red', 'blue', or null)
   * @returns Boolean indicating if the operation was successful
   */
  public saveExtraPlayerTeam(team: ExtraPlayerTeam): boolean {
    try {
      localStorage.setItem(this.extraPlayerTeamKey, JSON.stringify(team));
      return true;
    } catch (error) {
      console.error('Error saving extra player team information:', error);
      return false;
    }
  }

  /**
   * Get which team received the extra player in the last distribution
   * @returns The team that received the extra player, or null if no previous distribution
   */
  public getExtraPlayerTeam(): ExtraPlayerTeam {
    try {
      const savedTeam = localStorage.getItem(this.extraPlayerTeamKey);
      return savedTeam ? JSON.parse(savedTeam) : null;
    } catch (error) {
      console.error('Error retrieving extra player team information:', error);
      return null;
    }
  }
}