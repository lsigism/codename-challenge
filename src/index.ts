import { StorageService, Participant, ExtraPlayerTeam } from './storage';
import { TeamDistributor, TeamMember } from './teamDistributor';
import './styles.css';

// Initialize services
const storageService = new StorageService();
const teamDistributor = new TeamDistributor();

// DOM Elements
const nameInput = document.getElementById('nameInput') as HTMLInputElement;
const addNameButton = document.getElementById('addNameButton') as HTMLButtonElement;
const namesList = document.getElementById('namesList') as HTMLDivElement;
const distributeButton = document.getElementById('distributeButton') as HTMLButtonElement;
const clearButton = document.getElementById('clearButton') as HTMLButtonElement;
const redSpymasterElement = document.getElementById('redSpymaster') as HTMLDivElement;
const redOperativesElement = document.getElementById('redOperatives') as HTMLDivElement;
const blueSpymasterElement = document.getElementById('blueSpymaster') as HTMLDivElement;
const blueOperativesElement = document.getElementById('blueOperatives') as HTMLDivElement;
const validationMessage = document.getElementById('validationMessage') as HTMLDivElement;
const notificationBanner = document.getElementById('notificationBanner') as HTMLDivElement;
const notificationMessage = document.getElementById('notificationMessage') as HTMLSpanElement;
const dismissNotification = document.getElementById('dismissNotification') as HTMLButtonElement;

// Participants array
let participants: Participant[] = [];

// Track which team got the extra player in the last distribution
let lastExtraPlayerTeam: ExtraPlayerTeam = null;

// Timer for auto-dismissing notifications
let notificationTimer: number | null = null;

// Initialize the app
function init(): void {
  // Load saved participants from localStorage
  loadSavedParticipants();
  
  // Load which team received the extra player last time
  lastExtraPlayerTeam = storageService.getExtraPlayerTeam();
  
  // Add event listeners
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleAddName();
    }
  });
  addNameButton.addEventListener('click', handleAddName);
  distributeButton.addEventListener('click', handleDistributeTeams);
  clearButton.addEventListener('click', handleClearTeams);
  
  // Add event listener for notification dismiss button
  dismissNotification.addEventListener('click', hideNotification);
}

// Load participants from localStorage
function loadSavedParticipants(): void {
  participants = storageService.getParticipants();
  renderParticipantsList();
}

// Render the participants list
function renderParticipantsList(): void {
  namesList.innerHTML = '';
  
  participants.forEach((participant, index) => {
    const nameItem = document.createElement('div');
    nameItem.className = `name-item ${participant.selected ? 'selected' : 'not-selected'}`;
    
    // Add visual indicator element (instead of checkbox)
    const selectionIndicator = document.createElement('span');
    selectionIndicator.className = 'selection-indicator';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = participant.name;
    nameSpan.className = 'player-name';
    
    const removeButton = document.createElement('button');
    removeButton.className = 'remove-name';
    removeButton.textContent = '×';
    removeButton.title = 'Remove';
    
    // Add event listener to the entire name item for toggling selection
    nameItem.addEventListener('click', (event) => {
      // Only toggle if not clicking the remove button
      if (!(event.target as HTMLElement).classList.contains('remove-name')) {
        toggleParticipantSelection(index);
      }
    });
    
    // Add separate event listener for the remove button
    removeButton.addEventListener('click', (event) => {
      removeParticipant(index);
      // Prevent the click from also triggering the nameItem click
      event.stopPropagation();
    });
    
    nameItem.appendChild(selectionIndicator);
    nameItem.appendChild(nameSpan);
    nameItem.appendChild(removeButton);
    
    namesList.appendChild(nameItem);
  });
  
  // Save to localStorage whenever we update the UI
  const saveSuccessful = storageService.saveParticipants(participants);
  
  // Show error notification if save fails
  if (!saveSuccessful) {
    showNotification(
      'Failed to save your participants. Your data may not persist when you reload the page.',
      'error'
    );
  }
}

// Check if name already exists (case-insensitive)
function nameExists(name: string): boolean {
  const lowerCaseName = name.toLowerCase();
  return participants.some(participant => 
    participant.name.toLowerCase() === lowerCaseName
  );
}

// Show notification in the floating banner
function showNotification(message: string, type: 'success' | 'error' | 'informative' = 'informative'): void {
  // Clear any existing timer
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
  
  // Set the message and handle newlines
  notificationMessage.innerHTML = message.replace(/\n/g, '<br>');
  
  // Set the appropriate class for styling
  notificationBanner.className = 'notification-banner';
  notificationBanner.classList.add(type);
  
  // Show the banner
  notificationBanner.classList.remove('hidden');
  
  // Set timer to auto-dismiss after 3 seconds
  notificationTimer = window.setTimeout(hideNotification, 3000);
}

// Hide the notification banner
function hideNotification(): void {
  notificationBanner.classList.add('hidden');
  
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
}

// Handle adding a new name
function handleAddName(): void {
  const name = nameInput.value.trim();
  
  if (name) {
    // Check for duplicate name (case-insensitive)
    if (nameExists(name)) {
      showNotification(`Player "${name}" already exists in the list.`, 'error');
      nameInput.focus();
      return;
    }
    
    // Add new participant (selected by default)
    participants.push({
      name,
      selected: true
    });
    
    // Clear the input
    nameInput.value = '';
    
    // Focus the input for the next name
    nameInput.focus();
    
    // Show success notification
    showNotification(`Player "${name}" has been added to the list.`, 'success');
    
    // Render the updated list
    renderParticipantsList();
  }
}

// Toggle participant selection
function toggleParticipantSelection(index: number): void {
  if (index >= 0 && index < participants.length) {
    participants[index].selected = !participants[index].selected;
    renderParticipantsList();
  }
}

// Remove a participant
function removeParticipant(index: number): void {
  if (index >= 0 && index < participants.length) {
    const playerName = participants[index].name;
    participants.splice(index, 1);
    renderParticipantsList();
    
    // Update: changed from error to success for player removal
    showNotification(`Player "${playerName}" has been removed from the list.`, 'success');
  }
}

// Get selected participants
function getSelectedParticipants(): string[] {
  return participants
    .filter(participant => participant.selected)
    .map(participant => participant.name);
}

// Handle distribution of teams
function handleDistributeTeams(): void {
  const selectedNames = getSelectedParticipants();
  
  // Update minimum required players to 4 with multi-line message
  if (selectedNames.length < 4) {
    // Clear any previously distributed teams when there are insufficient players
    clearTeamsDisplay();
    
    showNotification(
      'Please select at least 4 players to distribute teams.\n' +
      'Each team needs 1 spymaster and at least 1 operative.',
      'informative'
    );
    return;
  }
  
  // Distribute teams, passing the lastExtraPlayerTeam to handle alternation
  const distribution = teamDistributor.distributeTeams(selectedNames, lastExtraPlayerTeam);
  
  // Update and save which team got the extra player
  lastExtraPlayerTeam = distribution.extraPlayerTeam;
  const saveSuccessful = storageService.saveExtraPlayerTeam(lastExtraPlayerTeam);
  
  // Display teams
  displayTeam(distribution.redTeam, redSpymasterElement, redOperativesElement);
  displayTeam(distribution.blueTeam, blueSpymasterElement, blueOperativesElement);
  
  // Display info about uneven teams if applicable
  if (distribution.extraPlayerTeam) {
    const teamWithExtra = distribution.extraPlayerTeam === 'red' ? 'Red' : 'Blue';
    showNotification(`Odd number of players: ${teamWithExtra} team has an extra player.`, 'informative');
  } else {
    // Show success message when teams are distributed
    showNotification('Teams have been successfully distributed!', 'success');
  }
  
  // Show error notification if save fails
  if (!saveSuccessful) {
    setTimeout(() => {
      showNotification(
        'Failed to save team distribution information. Your next distribution might not alternate correctly.',
        'error'
      );
    }, 3500); // Delay to show after the success message
  }
}

// Clear team displays without affecting the participant list
function clearTeamsDisplay(): void {
  // Clear UI
  redSpymasterElement.innerHTML = '';
  redOperativesElement.innerHTML = '';
  blueSpymasterElement.innerHTML = '';
  blueOperativesElement.innerHTML = '';
}

// Display a team in the DOM
function displayTeam(
  team: TeamMember[], 
  spymasterElement: HTMLDivElement, 
  operativesElement: HTMLDivElement
): void {
  // Clear previous members
  spymasterElement.innerHTML = '';
  operativesElement.innerHTML = '';
  
  // Add members to appropriate section based on role
  team.forEach(member => {
    const memberElement = document.createElement('div');
    memberElement.className = 'member-item';
    
    // Add role emoji before the name
    if (member.role === 'spymaster') {
      memberElement.textContent = `🕵️ ${member.name}`; // Spymaster emoji
      spymasterElement.appendChild(memberElement);
    } else {
      memberElement.textContent = `🤝 ${member.name}`; // Operative emoji
      operativesElement.appendChild(memberElement);
    }
  });
}

// Handle clearing teams
function handleClearTeams(): void {
  // Clear UI
  clearTeamsDisplay();
  
  // Hide any active notification
  hideNotification();
  
  // Optionally clear the participants list
  if (confirm('Clear all names?')) {
    participants = [];
    renderParticipantsList();
    const clearSuccessful = storageService.clearParticipants();
    
    // Reset the extra player tracking
    lastExtraPlayerTeam = null;
    const saveExtraSuccessful = storageService.saveExtraPlayerTeam(null);
    
    // Show error notification if either operation fails
    if (!clearSuccessful || !saveExtraSuccessful) {
      showNotification(
        'Failed to clear your data. Some information might persist when you reload the page.',
        'error'
      );
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);