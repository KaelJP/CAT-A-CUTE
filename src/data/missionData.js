export const MISSIONS = {
  living_room: {
    id: 'find_key_living',
    title: 'INVESTIGATE',
    completeMessage: 'You found the key. Head to the door.',
    steps: [
      { key: 'found_key', description: 'Find the front door key', done: false },
      { key: 'use_door', description: 'Use the key on the exit door', done: false },
    ],
    onComplete: null,
  },

  hallway: {
    id: 'hallway_investigate',
    title: 'SEARCH THE HALLWAY',
    completeMessage: 'Something is very wrong here...',
    steps: [
      { key: 'hallway_key', description: 'Find the kitchen key', done: false },
      { key: 'read_note', description: 'Examine the photo on the wall', done: false },
      { key: 'open_kitchen', description: 'Unlock the kitchen door', done: false },
    ],
    onComplete: null,
  },

  kitchen: {
    id: 'kitchen_fuse',
    title: 'RESTORE POWER',
    completeMessage: 'Power restored. The lights flicker on.',
    steps: [
      { key: 'switch_a', description: 'Flip the first switch', done: false },
      { key: 'switch_c', description: 'Flip the second switch', done: false },
      { key: 'switch_b', description: 'Flip the third switch', done: false },
    ],
    onComplete: null,
  },

  bedroom: {
    id: 'bedroom_clue',
    title: 'SEARCH THE BEDROOM',
    completeMessage: 'You found the old photo. The cat was here before...',
    steps: [
      { key: 'open_closet', description: 'Open the closet', done: false },
      { key: 'find_photo', description: 'Pick up the old photo inside', done: false },
      { key: 'read_photo', description: 'Examine the photo (press E)', done: false },
    ],
    onComplete: null,
  },

  basement: {
    id: 'basement_truth',
    title: 'FIND THE TRUTH',
    completeMessage: 'The cat was protecting you all along.',
    steps: [
      { key: 'find_note', description: 'Find the old note in the basement', done: false },
      { key: 'read_note', description: 'Read it (press E)', done: false },
      { key: 'reach_exit', description: 'Escape to the living room', done: false },
    ],
    onComplete: null,
  },

  living_room_dawn: {
    id: 'survive_dawn',
    title: 'SURVIVE UNTIL DAWN',
    completeMessage: 'You survived. The cat saved you.',
    steps: [
      { key: 'see_ghost', description: 'The ghost appears — face it', done: false },
      { key: 'cat_defends', description: 'Trust the cat to protect you', done: false },
      { key: 'dawn_breaks', description: 'Wait for the sun to rise', done: false },
    ],
    onComplete: null,
  },
};
