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

// Notification handling variables
let notificationAnimationFrame: number | null = null;
let notificationProgress: HTMLElement | null = null;
let notificationStartTime: number = 0;
let notificationDuration: number = 0;
let notificationPaused: boolean = false;
let notificationElapsedTime: number = 0; // New variable to track elapsed time when paused
let notificationLastTimestamp: number = 0; // Tracks the last animation frame timestamp

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
  // Clear any existing timer and animation
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
  
  if (notificationAnimationFrame) {
    cancelAnimationFrame(notificationAnimationFrame);
    notificationAnimationFrame = null;
  }
  
  // Set the message and handle newlines
  notificationMessage.innerHTML = message.replace(/\n/g, '<br>');
  
  // Set the appropriate class for styling
  notificationBanner.className = 'notification-banner';
  notificationBanner.classList.add(type);
  
  // Set duration based on message type and length
  notificationDuration = getDurationForNotification(message, type);
  
  // Create or reset progress bar
  let progressBar = notificationBanner.querySelector('.notification-progress') as HTMLElement;
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'notification-progress';
    notificationBanner.appendChild(progressBar);
  }
  
  // Reset animation state
  notificationProgress = progressBar;
  notificationElapsedTime = 0;
  notificationPaused = false;
  
  // Set initial state
  notificationProgress.style.transform = 'scaleX(1)';
  
  // Show the banner - use a small delay to ensure CSS transitions work properly
  setTimeout(() => {
    notificationBanner.classList.remove('hidden');
  }, 10);
  
  // Start timer for auto-dismiss
  notificationStartTime = Date.now();
  notificationLastTimestamp = notificationStartTime;
  
  // Set timer for auto-dismiss
  notificationTimer = window.setTimeout(hideNotification, notificationDuration);
  
  // Start the progress bar animation
  animateProgressBar();
  
  // Add hover events to pause timer
  notificationBanner.addEventListener('mouseenter', pauseNotificationTimer);
  notificationBanner.addEventListener('mouseleave', resumeNotificationTimer);
}

// Get appropriate duration based on message type and length
function getDurationForNotification(message: string, type: 'success' | 'error' | 'informative'): number {
  // Base duration for different types
  let baseDuration = 0;
  
  switch (type) {
    case 'error':
      baseDuration = 5000; // Errors need more time to read
      break;
    case 'success':
      baseDuration = 2500; // Success messages can be shorter
      break;
    case 'informative':
      baseDuration = 4000; // Informative messages are medium length
      break;
    default:
      baseDuration = 3000;
  }
  
  // Add extra time for longer messages (roughly 15ms per character)
  const extraTime = Math.min(3000, message.length * 15);
  
  return baseDuration + extraTime;
}

// Start or restart the notification timer
function startNotificationTimer(): void {
  const remainingTime = notificationDuration - (notificationPaused ? 0 : (Date.now() - notificationStartTime));
  
  if (remainingTime <= 0) {
    hideNotification();
    return;
  }
  
  notificationTimer = window.setTimeout(hideNotification, remainingTime);
  
  // Animate progress bar
  updateProgressBarAnimation(remainingTime);
}

// Update progress bar animation
function updateProgressBarAnimation(remainingTime: number): void {
  if (!notificationProgress) return;
  
  // Calculate how much of the animation has already played
  const percentComplete = 1 - (remainingTime / notificationDuration);
  
  // Reset animation with the remaining time
  notificationProgress.style.animation = 'none';
  notificationProgress.offsetHeight; // Trigger reflow
  notificationProgress.style.transform = `scaleX(${1 - percentComplete})`;
  notificationProgress.style.animation = `progress-shrink ${remainingTime}ms linear forwards`;
}

// Pause notification timer on hover
function pauseNotificationTimer(): void {
  // Only pause if we're not already paused
  if (notificationPaused) return;
  
  // Mark as paused
  notificationPaused = true;
  
  // Clear the auto-dismiss timer
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
  
  // Stop the animation frame
  if (notificationAnimationFrame) {
    cancelAnimationFrame(notificationAnimationFrame);
    notificationAnimationFrame = null;
  }
  
  // Calculate and store elapsed time so far
  notificationElapsedTime = Date.now() - notificationStartTime;
  
  // Store current progress bar state - no need to modify its appearance
  // This ensures the bar appears frozen exactly where it is
}

// Resume notification timer when no longer hovering
function resumeNotificationTimer(): void {
  if (notificationPaused) {
    notificationPaused = false;
    
    // Set the timeout for the remaining duration
    const remainingTime = notificationDuration - notificationElapsedTime;
    if (remainingTime <= 0) {
      hideNotification();
      return;
    }
    
    // Set a new timeout for the remaining time
    notificationTimer = window.setTimeout(hideNotification, remainingTime);
    
    // Resume animation
    notificationLastTimestamp = performance.now();
    animateProgressBar();
  }
}

// Get remaining time based on progress bar width
function getRemainingTime(): number {
  if (!notificationProgress) return 0;
  
  const computedStyle = window.getComputedStyle(notificationProgress);
  const transformMatrix = new DOMMatrix(computedStyle.transform);
  const scaleX = transformMatrix.m11; // Get the scaleX value
  
  return notificationDuration * scaleX;
}

// Hide the notification banner
function hideNotification(): void {
  notificationBanner.classList.add('hidden');
  
  if (notificationTimer) {
    clearTimeout(notificationTimer);
    notificationTimer = null;
  }
  
  if (notificationAnimationFrame) {
    cancelAnimationFrame(notificationAnimationFrame);
    notificationAnimationFrame = null;
  }
  
  // Remove event listeners
  notificationBanner.removeEventListener('mouseenter', pauseNotificationTimer);
  notificationBanner.removeEventListener('mouseleave', resumeNotificationTimer);
}

// Animate the progress bar using requestAnimationFrame for smooth animation
function animateProgressBar(): void {
  // Don't start animation if already paused
  if (notificationPaused || !notificationProgress) return;
  
  // Cancel any existing animation frame
  if (notificationAnimationFrame) {
    cancelAnimationFrame(notificationAnimationFrame);
    notificationAnimationFrame = null;
  }
  
  const animate = (timestamp: number) => {
    // Immediately exit animation loop if paused
    if (notificationPaused || !notificationProgress) {
      return;
    }
    
    // Calculate elapsed time since notification started
    // When resuming from pause, use the stored elapsedTime as the baseline
    const currentTime = Date.now();
    const elapsed = currentTime - notificationStartTime;
    const progress = Math.max(0, 1 - (elapsed / notificationDuration));
    
    // Update the progress bar
    notificationProgress.style.transform = `scaleX(${progress})`;
    
    // Continue animation if not complete
    if (progress > 0) {
      // Continue animation only if not paused
      notificationAnimationFrame = requestAnimationFrame(animate);
    } else if (progress <= 0) {
      // Ensure we reach exactly zero at the end
      notificationProgress.style.transform = 'scaleX(0)';
    }
  };
  
  // Start the animation loop
  notificationAnimationFrame = requestAnimationFrame(animate);
}

// Handle adding a new name
function handleAddName(): void {
  const name = nameInput.value.trim();
  
  // Check if name is empty after trimming
  if (!name) {
    showNotification('Please enter a valid player name (cannot be empty or just spaces).', 'error');
    nameInput.focus();
    return;
  }
  
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