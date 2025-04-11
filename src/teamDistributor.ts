/**
 * Interfaces for team distribution
 */
export interface TeamMember {
  name: string;
  role: 'spymaster' | 'operative';
}

export interface TeamDistribution {
  redTeam: TeamMember[];
  blueTeam: TeamMember[];
  extraPlayerTeam: 'red' | 'blue' | null;
}

/**
 * Service for distributing team members into teams
 */
export class TeamDistributor {
  /**
   * Shuffles an array using the Fisher-Yates algorithm
   * @param array Array to shuffle
   * @returns Shuffled array
   */
  private shuffle<T>(array: T[]): T[] {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  /**
   * Distribute names evenly into two teams, assigning one spymaster per team
   * For odd numbers of players, handles alternating which team gets the extra player
   * @param names Array of names to distribute
   * @param lastExtraPlayerTeam Which team got the extra player last time (null for first distribution)
   * @returns Distribution of teams with roles assigned and which team got the extra player
   */
  public distributeTeams(names: string[], lastExtraPlayerTeam: 'red' | 'blue' | null = null): TeamDistribution {
    if (!names.length) {
      return { redTeam: [], blueTeam: [], extraPlayerTeam: null };
    }

    // Shuffle the array of names
    const shuffledNames = this.shuffle(names);
    
    // Check if we have an odd number of players
    const isOdd = shuffledNames.length % 2 !== 0;
    let extraPlayerTeam: 'red' | 'blue' | null = null;
    
    // Determine which team gets the extra player for odd numbers
    if (isOdd) {
      if (lastExtraPlayerTeam === null) {
        // First distribution with odd number - randomly decide
        extraPlayerTeam = Math.random() < 0.5 ? 'red' : 'blue';
      } else {
        // For subsequent distributions, alternate the team
        extraPlayerTeam = lastExtraPlayerTeam === 'red' ? 'blue' : 'red';
      }
    }
    
    // Calculate how to split the teams
    let redTeamSize: number;
    let blueTeamSize: number;
    
    if (!isOdd) {
      // Even split for even numbers
      redTeamSize = shuffledNames.length / 2;
      blueTeamSize = shuffledNames.length / 2;
    } else if (extraPlayerTeam === 'red') {
      // Red team gets the extra player
      redTeamSize = Math.ceil(shuffledNames.length / 2);
      blueTeamSize = Math.floor(shuffledNames.length / 2);
    } else {
      // Blue team gets the extra player
      redTeamSize = Math.floor(shuffledNames.length / 2);
      blueTeamSize = Math.ceil(shuffledNames.length / 2);
    }
    
    // Split into two teams based on calculated sizes
    const redTeamNames = shuffledNames.slice(0, redTeamSize);
    const blueTeamNames = shuffledNames.slice(redTeamSize);
    
    // Assign roles to each team with random spymaster selection
    const redTeam = this.assignRolesRandomly(redTeamNames);
    const blueTeam = this.assignRolesRandomly(blueTeamNames);
    
    return { redTeam, blueTeam, extraPlayerTeam };
  }

  /**
   * Assign roles to team members with random spymaster selection
   * @param names Array of names for a team
   * @returns Array of team members with roles assigned
   */
  private assignRolesRandomly(names: string[]): TeamMember[] {
    if (!names.length) {
      return [];
    }

    // Make a copy of the names array to avoid modifying the original
    const teamNames = [...names];
    
    // Randomly select the index for the spymaster
    const spymasterIndex = Math.floor(Math.random() * teamNames.length);
    
    // Map the names to team members with assigned roles
    return teamNames.map((name, index) => ({
      name,
      role: index === spymasterIndex ? 'spymaster' : 'operative'
    }));
  }
}