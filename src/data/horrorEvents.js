export const HORROR_EVENTS = {
  living_room: {
    triggers: [
      { id: 'lr_shadow', x: 300, width: 60, once: true, event: { type: 'shadow' } },
      { id: 'lr_whisper', x: 700, width: 60, once: true, event: { type: 'whisper' } },
      { id: 'lr_berto_intro', x: 500, width: 80, once: true, event: { type: 'dialogue', key: 'berto_intro' } },
    ],
    ambient: [{ type: 'flicker', interval: [20000, 35000] }],
  },
  hallway: {
    triggers: [
      { id: 'hall_flicker', x: 350, width: 80, once: true, event: { type: 'flicker', duration: 2000 } },
      { id: 'hall_ghost0', x: 650, width: 60, once: true, event: { type: 'flash_ghost', stage: 0, x: 800, y: 350, duration: 600 } },
      { id: 'hall_whisper', x: 900, width: 60, once: true, event: { type: 'whisper' } },
    ],
    ambient: [{ type: 'shadow', interval: [15000, 25000] }],
  },
  kitchen: {
    triggers: [
      { id: 'kit_ghost1', x: 400, width: 60, once: true, event: { type: 'flash_ghost', stage: 1, x: 600, y: 300, duration: 800 } },
      { id: 'kit_flicker', x: 600, width: 60, once: true, event: { type: 'flicker', duration: 3000 } },
      { id: 'kit_berto', x: 800, width: 80, once: true, event: { type: 'dialogue', key: 'berto_kitchen' } },
    ],
    ambient: [{ type: 'whisper', interval: [12000, 20000] }],
  },
  bedroom: {
    triggers: [
      { id: 'bed_flicker', x: 300, width: 60, once: true, event: { type: 'flicker', duration: 1500 } },
      { id: 'bed_jumpscare', x: 900, width: 60, once: true, event: { type: 'flash_ghost', stage: 2, x: 1000, y: 200, duration: 1000 } },
      { id: 'bed_slam', x: 850, width: 80, once: true, event: { type: 'sound', key: 'door_creak' } },
      { id: 'bed_deadly', x: 950, width: 30, once: true, event: { type: 'jumpscare', stage: 3, requiresDark: true } },
    ],
    ambient: [{ type: 'shadow', interval: [10000, 18000] }],
  },
  basement: {
    triggers: [
      { id: 'base_dark', x: 200, width: 400, once: true, event: { type: 'turnOff' } },
      { id: 'base_ghost2', x: 700, width: 60, once: true, event: { type: 'flash_ghost', stage: 2, x: 900, y: 250, duration: 1200 } },
      { id: 'base_reveal', x: 900, width: 60, once: true, event: { type: 'sound', key: 'reveal_stinger' } },
    ],
    ambient: [{ type: 'whisper', interval: [8000, 14000] }],
  },
  living_room_dawn: {
    triggers: [
      { id: 'final_ghost', x: 600, width: 60, once: true, event: { type: 'flash_ghost', stage: 3, x: 700, y: 100, duration: 2000 } },
      { id: 'final_dialogue', x: 700, width: 60, once: true, event: { type: 'dialogue', key: 'final_reveal' } },
    ],
    ambient: [],
  },
};
