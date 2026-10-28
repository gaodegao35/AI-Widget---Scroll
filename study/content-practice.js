// Practice page. Short, fictional, unrelated to Sets A and B. Used for the two-minute orientation
// in each condition; no tasks are timed on it.
window.STUDY_CONTENT = window.STUDY_CONTENT || {};

window.STUDY_CONTENT.PRACTICE = {
  conversation: {
    title: 'Choosing a houseplant for a dark room',
    messages: [
      { role: 'user', text: 'I have a room with one small north-facing window and I keep killing everything I put in it. What actually survives there?' },
      { role: 'assistant', text: 'Plants that evolved on a forest floor, where the light is dim and steady. The reliable group is small: cast iron plant, snake plant, pothos, ZZ plant, and most ferns if the room is humid.\n\nThe thing that kills plants in dark rooms is usually not the darkness. It is watering them on the schedule you would use in a bright room. Low light means slow growth, slow growth means slow water use, and a pot that stays wet for a week rots the roots.' },
      { role: 'user', text: 'So I should water less often?' },
      { role: 'assistant', text: 'Less often, but just as thoroughly when you do. Soak the pot until water runs from the bottom, then leave it alone until the top few centimetres are dry — in a dark room that might be two or three weeks in winter.\n\nSmall sips every few days keep the surface damp and the roots thirsty, which is the worst of both arrangements.' },
      { role: 'user', text: 'What about those grow lights? Are they worth it?' },
      { role: 'assistant', text: 'For a room like yours, a single small lamp changes what you can grow more than any other intervention. You do not need a professional fixture; an ordinary LED bulb of reasonable output, on a timer for ten hours a day, is enough to move a room from "three plants survive" to "most plants are fine".\n\nPut it close — thirty to forty centimetres above the leaves. Light falls off sharply with distance, and a lamp on the ceiling is mostly decorative.' },
      { role: 'user', text: 'Does the pot matter?' },
      { role: 'assistant', text: 'In a dark room, yes, more than usual. Choose a pot barely larger than the root ball, with a drainage hole. A big pot holds a reservoir of wet soil that the plant cannot drink fast enough in low light.\n\nTerracotta helps for the same reason: it breathes, so the soil dries from the sides as well as the top.' },
      { role: 'user', text: 'Last one — my ferns always go brown at the tips. Why?' },
      { role: 'assistant', text: 'Almost always dry air rather than dry soil. Ferns want humidity around sixty per cent, and a heated room in winter sits nearer thirty.\n\nGrouping plants together helps a little, a tray of damp pebbles helps a little more, and a small humidifier solves it outright. Misting looks helpful and does almost nothing, because the effect lasts about ten minutes.' }
    ]
  }
};
