export const DIALOGUE = {
  berto_intro: [
    { speaker: 'berto', portrait: 'berto_talking', text: 'Hoy! That cat — it is bad luck! Get rid of it before it brings more trouble!' },
    { speaker: 'player', text: '...' },
    { speaker: 'berto', portrait: 'berto_worried', text: 'I am warning you. That black cat... it only shows up when something bad is already here.' },
  ],
  berto_kitchen: [
    { speaker: 'berto', portrait: 'berto_worried', text: 'You see? The lights, the shadows — the cat brought them here!' },
    { speaker: 'player', text: 'But it keeps standing between me and the dark corners...' },
  ],
  basement_truth: [
    { speaker: 'player', text: '[You find an old photo. A handwritten note on the back reads:]' },
    { speaker: 'player', text: "'The cat found us during the flood of 1988. It stayed by the door for three nights. The hauntings stopped when it came inside.'" },
    { speaker: 'player', text: "The cat didn't lead them here... it came BECAUSE of them." },
  ],
  bedroom_photo_read: [
    { speaker: 'player', text: '[The back of the photo reads:]' },
    { speaker: 'player', text: '"The cat found us in 1988. The spirits left when it came inside."' },
  ],
  final_reveal: [
    { speaker: 'player', text: "It was never the cat's fault. The spirits were already here." },
    { speaker: 'player', text: 'The cat tried to warn me all along...' },
    { speaker: 'cat', portrait: 'cat_calm', text: '*The cat sits beside you as morning light fills the room. It purrs softly.*' },
  ],
};
