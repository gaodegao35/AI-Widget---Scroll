// Page 1: the simulated chat conversation.
// Fictional, written for the study. The participant is asked to imagine this is their own chat
// history: a student designing a concept dashboard for a Tesla Model 3 as a course project.
// No real people. The assistant carries no product name or branding.
//
// Format: messages alternate user / assistant. Each user+assistant pair is one "part" on the
// scrollbar. Inside `text`, a blank line starts a new paragraph, lines starting "- " become a
// bulleted list, lines starting "1. " a numbered list, and **double asterisks** make bold.
// An assistant message may also carry one `image` (inline SVG), `code`, or `table`, and `after`
// (more paragraphs below that block).
window.STUDY_CONTENT = window.STUDY_CONTENT || {};

window.STUDY_CONTENT.chat = {
  title: 'Tesla dashboard redesign — course project',
  sidebar: ['Statistics HW 4 help', 'Cover letter edits', 'Pittsburgh weekend ideas', 'Figma auto layout', 'Pasta for six people'],
  messages: [

    /* ---------- 1. kickoff ---------- */
    { role: 'user', text: `I just got the brief for my final project in Interaction Design Studio. We have to redesign the center touchscreen dashboard of a Tesla Model 3. It's a solo project and it's due in six weeks. I honestly don't know where to start.` },
    { role: 'assistant', text: `That's a great brief — the Model 3 is a famous case because it has no instrument cluster behind the steering wheel, so **everything** the driver needs lives on one center screen. That constraint gives your project a clear design problem.

Before you open Figma, pin down three things from the brief:

1. **The deliverables.** Is it a clickable prototype, a presentation, a process book, or all three?
2. **The screen.** What size and resolution are you designing for?
3. **The evaluation.** Will your professor grade the final visuals, or your process and evidence?

Paste the brief here if you like, and I'll help you turn it into a plan.` },

    /* ---------- 2. the brief and a timeline ---------- */
    { role: 'user', text: `Here's the brief: "Design a concept for the center display of a Tesla Model 3 that reduces the time drivers spend looking away from the road. Design for a 15-inch landscape touchscreen, 1920 × 1200 pixels. Deliverables: a clickable prototype, a process book, and a 5-minute final presentation. You must test your design with at least five people." Can you make me a schedule?` },
    { role: 'assistant', text: `Nice — the brief already gives you a measurable goal: **less time looking away from the road.** Every decision you make can be tested against that one sentence.

Here's a six-week plan that leaves a full week for testing and a buffer before the presentation. The research week matters most; students often skip it and then can't explain their design choices in the final critique.`,
      table: { headers: ['Week', 'Focus', 'What you should have by Friday'],
        rows: [
          ['1', 'Research', '5–6 driver interviews, notes on the current screen, glance-time guidelines'],
          ['2', 'Define', 'Findings summary, 2 personas, a ranked list of problems'],
          ['3', 'Structure', 'Screen zones, information architecture, low-fi wireframes'],
          ['4', 'Visual design', 'Color palette, type scale, components, hi-fi main screen'],
          ['5', 'Prototype + test', 'Clickable prototype, usability test with 5 people'],
          ['6', 'Iterate + present', 'Revised screens, process book, 5-minute presentation']
        ] },
      after: `If you fall behind, cut visual polish in week 4, not testing in week 5. A tested, slightly rough design will score better than a beautiful one with no evidence.` },

    /* ---------- 3. research approach ---------- */
    { role: 'user', text: `OK, week 1 is research. I don't own a Tesla. How do I research a car I don't have?` },
    { role: 'assistant', text: `You don't need to own one — you need access to people who do, plus a way to observe the screen in use.

A few options, from most to least valuable:

- **Ride-alongs.** Ask an owner to drive a normal errand while you sit in the passenger seat and note every time they touch the screen. Ten minutes of observation beats an hour of interviews.
- **Interviews.** Talk to 5–6 owners for 20 minutes each. Ask about specific recent moments, not general opinions.
- **Owner forums and videos.** Search for complaint threads about the screen. Look for patterns, not single loud posts.
- **A test drive.** Most showrooms will let you sit in the car and use the screen while parked.

Ask around your department first — someone almost always knows a Model 3 owner. If you can do even two ride-alongs, mention them prominently in your process book.` },

    /* ---------- 4. interview questions ---------- */
    { role: 'user', text: `My friend's dad and two of his coworkers have one, and I found three more people through a campus group. Can you write me interview questions?` },
    { role: 'assistant', text: `Here's a 20-minute guide. Start broad, then ask about specific moments — people remember stories much better than they remember opinions.

**Warm-up (3 min)**
- How long have you had the car, and what do you mostly use it for?
- What did you drive before?

**Recent moments (10 min)**
- Think about your last drive. What did you touch on the screen?
- Tell me about a time the screen frustrated you while you were driving.
- Is there anything you've stopped doing while driving because it's too hard on the screen?
- What do you do before you start driving so you don't have to touch the screen later?

**Specific features (5 min)**
- How do you change the temperature? The wipers? The music?
- Where do you look to see your speed?

**Wrap-up (2 min)**
- If you could move one thing on the screen, what would it be?

One rule: when they say "it's fine," ask "can you show me the last time you did that?" Polite answers hide the best findings.` },

    /* ---------- 5. findings ---------- */
    { role: 'user', text: `Done! I interviewed six owners. My notes are messy but the big things were: climate controls take too many taps, the wipers are buried in a menu, people glance at the speed a lot because it's off to the side, the map is too busy, and a couple of people hate that the glovebox opens from the screen. Can you help me organize this?` },
    { role: 'assistant', text: `Great work — six interviews in week one puts you ahead of schedule. Let's turn the notes into a findings table. Counting how many of the six people mentioned each problem gives you evidence you can show in the critique.`,
      table: { headers: ['Finding', 'Mentioned by', 'Example quote (paraphrased)', 'Severity'],
        rows: [
          ['Changing fan speed or temperature takes too many taps', '5 of 6', '"I just leave it on auto because changing it is a whole thing."', 'High'],
          ['Wiper settings are hidden inside a menu', '4 of 6', '"In a sudden downpour I end up poking around."', 'High'],
          ['Speed is far from the driver\'s line of sight', '4 of 6', '"I look over to check my speed way more than in my old car."', 'Medium'],
          ['Map shows too much detail while driving', '3 of 6', '"It\'s pretty, but I can never find the next turn fast."', 'Medium'],
          ['Glovebox opens from the screen', '2 of 6', '"Opening a box should not need a menu."', 'Low'],
          ['Music controls are fine', '5 of 6', '"I mostly use the steering wheel buttons anyway."', '—']
        ] },
      after: `The strongest finding is climate: 5 of 6 is nearly everyone, and it's a task drivers do while moving. Wipers are second and arguably more safety-critical, because they're needed suddenly in bad weather.

Notice the last row too. Keeping something that already works is a valid design decision, and saying so shows judgment.` },

    /* ---------- 6. personas ---------- */
    { role: 'user', text: `My professor wants personas. I always feel like personas are kind of made up. Should I still do them?` },
    { role: 'assistant', text: `Do them, but build them only from what your six interviews actually showed. A persona is honest when every detail on it traces back to something you heard.

Two personas fit your data well:

**Dana, the daily commuter.** Drives the same 35-minute route every weekday. Knows the screen well but hates changing climate settings in traffic. Uses the map only when there's an accident on her route. Her goal: get through the commute without thinking about the screen at all.

**Marcus, the weekend road-tripper.** Drives long, unfamiliar routes and depends on the map and charging stops. Gets anxious when the range drops and he can't quickly see where the next charger is. His goal: always know where the next turn and the next charger are.

Dana pushes you toward fast, shallow controls. Marcus pushes you toward a clearer map and range display. Most of your design decisions will be trade-offs between these two people, which is exactly what personas are for.` },

    /* ---------- 7. glance-time guidelines ---------- */
    { role: 'user', text: `The brief says reduce the time drivers look away from the road. Is there an actual number I should aim for?` },
    { role: 'assistant', text: `Yes. Driver-distraction guidelines published by US road-safety regulators give two widely used targets for any task done on an in-car screen while driving:

- **No single glance away from the road longer than 2 seconds.**
- **No more than 12 seconds of total eyes-off-road time to finish a task.**

These are simple enough to test in a student project. For each task — say, "turn up the fan" — you can time each glance on video and add them up.

For your project, I'd set a stricter target for your top two problems: changing the temperature and turning on the wipers should each take **one glance and under 2 seconds** in total. That gives you a clear success criterion to report in your final presentation.` },

    /* ---------- 8. screen zones ---------- */
    { role: 'user', text: `Moving on to week 3. How should I divide the screen? Right now everything feels like it's just floating around.` },
    { role: 'assistant', text: `Start by splitting the screen into zones by **who looks at it and how often**. The driver sits on the left side of the screen (in left-hand-drive markets), so the left third is the most valuable space you have.

Here's a zone map to start from. The driver zone holds what is glanced at constantly; the map zone holds what is glanced at sometimes; the dock at the bottom holds controls you reach for by touch.`,
      image: { alt: 'Zone map of the 1920 by 1200 screen: driver zone on the left, map zone on the right, a dock along the bottom', caption: 'Screen zone map for the 1920 × 1200 display. The driver zone takes the left 640 px.',
        svg: `<svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="640" height="400" fill="#f4f5f7"/>
<rect x="20" y="20" width="600" height="360" rx="14" fill="#16181d"/>
<rect x="32" y="32" width="190" height="276" rx="8" fill="#2a3a5c" stroke="#5b8def" stroke-width="2"/>
<text x="127" y="150" text-anchor="middle" fill="#dfe8ff" font-size="16" font-weight="700">DRIVER ZONE</text>
<text x="127" y="172" text-anchor="middle" fill="#a9bde6" font-size="12">speed · gear · alerts</text>
<text x="127" y="190" text-anchor="middle" fill="#a9bde6" font-size="12">range · cars around you</text>
<text x="127" y="292" text-anchor="middle" fill="#8ea7d8" font-size="11">glanced at constantly</text>
<rect x="232" y="32" width="376" height="276" rx="8" fill="#22322a" stroke="#2e9e5b" stroke-width="2"/>
<text x="420" y="150" text-anchor="middle" fill="#dcf5e6" font-size="16" font-weight="700">MAP ZONE</text>
<text x="420" y="172" text-anchor="middle" fill="#a5d9bb" font-size="12">navigation · next turn · chargers</text>
<text x="420" y="292" text-anchor="middle" fill="#8cc6a5" font-size="11">glanced at sometimes</text>
<rect x="32" y="318" width="576" height="50" rx="8" fill="#3d3322" stroke="#d9a406" stroke-width="2"/>
<text x="320" y="340" text-anchor="middle" fill="#ffe9b0" font-size="15" font-weight="700">DOCK</text>
<text x="320" y="358" text-anchor="middle" fill="#e8cf8c" font-size="11">climate · wipers · media — reached by touch</text>
</svg>` },
      after: `A useful rule: anything a driver needs **while the car is moving** must live in the driver zone or the dock. Settings, the glovebox, and the owner's manual can live behind a menu, because people use them while parked.` },

    /* ---------- 9. speedometer placement ---------- */
    { role: 'user', text: `Four of my six people complained about checking their speed. Should I move the speed somewhere else? Like a head-up display?` },
    { role: 'assistant', text: `A head-up display would help, but it changes the hardware, and your brief is about the screen. I'd keep that idea for a "future work" slide and solve it on the screen itself.

Three things you can change on screen:

1. **Put speed in the top-left corner of the driver zone**, the point on the screen closest to the driver's line of sight.
2. **Make it much larger.** Speed should be the biggest number on the screen — readable in a fraction of a second.
3. **Put the speed limit right next to it.** People glance at their speed mainly to compare it with the limit. Showing both side by side turns two glances into one.

That third idea is the kind of insight that impresses in a critique, because it comes straight from your interviews: people aren't checking their speed for its own sake, they're checking whether they're speeding.` },

    /* ---------- 10. wireframe ---------- */
    { role: 'user', text: `I sketched a wireframe of the main driving view based on the zones. Can you describe what a good one would look like so I can compare?` },
    { role: 'assistant', text: `Here's a low-fidelity version you can compare against. Keep it gray at this stage — color will distract feedback away from layout.`,
      image: { alt: 'Gray wireframe of the main driving screen with speed and speed limit at top left, a car view below, a large map on the right with a next-turn card, and a dock with climate and wiper buttons', caption: 'Low-fi wireframe of the main driving view. Speed and limit sit together at top left; the next turn is a card on the map.',
        svg: `<svg viewBox="0 0 640 400" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="640" height="400" fill="#fafafa"/>
<rect x="20" y="20" width="600" height="360" rx="12" fill="#e6e6e6" stroke="#999"/>
<rect x="34" y="34" width="72" height="54" rx="6" fill="#fff" stroke="#888"/><text x="70" y="70" text-anchor="middle" font-size="26" font-weight="700" fill="#333">64</text>
<circle cx="136" cy="61" r="24" fill="#fff" stroke="#c33" stroke-width="4"/><text x="136" y="67" text-anchor="middle" font-size="16" font-weight="700" fill="#333">65</text>
<rect x="34" y="100" width="180" height="22" rx="4" fill="#d0d0d0"/><text x="44" y="115" font-size="11" fill="#555">D · range 241 mi</text>
<rect x="34" y="134" width="180" height="170" rx="6" fill="#d9d9d9"/><text x="124" y="224" text-anchor="middle" font-size="12" fill="#666">car + surroundings</text>
<rect x="228" y="34" width="378" height="270" rx="6" fill="#cfcfcf"/>
<path d="M260 280 C 320 220, 380 250, 420 180 S 520 90, 590 70" stroke="#999" stroke-width="10" fill="none"/>
<rect x="244" y="48" width="170" height="58" rx="6" fill="#fff" stroke="#888"/><text x="258" y="72" font-size="13" font-weight="700" fill="#333">→ 0.4 mi</text><text x="258" y="92" font-size="11" fill="#666">Turn right on Forbes Ave</text>
<rect x="34" y="316" width="572" height="52" rx="6" fill="#d4d4d4"/>
<rect x="46" y="324" width="90" height="36" rx="5" fill="#fff" stroke="#888"/><text x="91" y="347" text-anchor="middle" font-size="12" fill="#333">− 70° +</text>
<rect x="146" y="324" width="70" height="36" rx="5" fill="#fff" stroke="#888"/><text x="181" y="347" text-anchor="middle" font-size="12" fill="#333">fan</text>
<rect x="226" y="324" width="70" height="36" rx="5" fill="#fff" stroke="#888"/><text x="261" y="347" text-anchor="middle" font-size="12" fill="#333">wipers</text>
<rect x="306" y="324" width="70" height="36" rx="5" fill="#fff" stroke="#888"/><text x="341" y="347" text-anchor="middle" font-size="12" fill="#333">defrost</text>
<rect x="470" y="324" width="124" height="36" rx="5" fill="#fff" stroke="#888"/><text x="532" y="347" text-anchor="middle" font-size="12" fill="#333">media ▸</text>
</svg>` },
      after: `Two things to check in your own sketch. First, is the **wiper button in the dock** rather than a menu? That's your second-biggest finding, so it should be visible in this very first screen. Second, does the next-turn card show only **one** instruction? Marcus needs the next turn, not the next five.` },

    /* ---------- 11. touch target sizes ---------- */
    { role: 'user', text: `How big should the buttons be? My classmate said 44 pixels like on iPhone.` },
    { role: 'assistant', text: `Phone guidelines don't transfer well to cars. On a phone you're holding the device still and looking straight at it. In a moving car, your arm is extended, the road vibrates, and you're aiming with a quick glance — so targets need to be **much** larger.

Your screen is about 147 pixels per inch, which is roughly 5.8 pixels per millimeter. Here's what that means in practice:`,
      table: { headers: ['Control type', 'Minimum size', 'In pixels on this screen', 'Examples'],
        rows: [
          ['Used while driving, frequent', '20 mm', '≈ 116 px', 'temperature, fan, wipers, defrost'],
          ['Used while driving, rare', '15 mm', '≈ 87 px', 'seat heat, media skip, map zoom'],
          ['Used while parked only', '10 mm', '≈ 58 px', 'settings toggles, keyboard keys'],
          ['Gap between targets', '3 mm', '≈ 17 px', 'everything in the dock']
        ] },
      after: `So 44 px would be only about 7.5 mm here — far too small for anything a driver touches while moving. For the dock, I'd use 116 px tall buttons with at least 17 px between them. The gap matters as much as the size: hitting the button **next** to the one you wanted is a common in-car error.` },

    /* ---------- 12. color palette ---------- */
    { role: 'user', text: `Week 4 — visual design! I want a dark theme because it looks cool and is less distracting at night. Can you suggest a color palette?` },
    { role: 'assistant', text: `Dark is a good default for a car — a bright screen at night is a real safety problem, not just an aesthetic one. The trick is to keep color **meaningful**: if everything is colorful, the warnings stop standing out.

Here's a palette built around that idea. Neutrals carry almost everything; the four accent colors are reserved for specific meanings.`,
      image: { alt: 'Color palette swatches: Night background 0E1013, Surface 1A1D22, Raised 252A31, Text F2F4F7, Muted text 9AA3AF, Electric blue 3E8BFF, Charge green 2FD27C, Caution amber FFB020, Alert red FF4D4F', caption: 'Dashboard palette, dark theme. Accent colors are reserved: blue = interactive, green = charging, amber = caution, red = critical.',
        svg: `<svg viewBox="0 0 640 300" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="640" height="300" fill="#ffffff"/>
<text x="24" y="30" font-size="13" font-weight="700" fill="#333">Neutrals</text>
<rect x="24" y="42" width="110" height="70" rx="8" fill="#0E1013"/><text x="24" y="128" font-size="11" fill="#333">Night bg</text><text x="24" y="143" font-size="11" fill="#777">#0E1013</text>
<rect x="146" y="42" width="110" height="70" rx="8" fill="#1A1D22"/><text x="146" y="128" font-size="11" fill="#333">Surface</text><text x="146" y="143" font-size="11" fill="#777">#1A1D22</text>
<rect x="268" y="42" width="110" height="70" rx="8" fill="#252A31"/><text x="268" y="128" font-size="11" fill="#333">Raised</text><text x="268" y="143" font-size="11" fill="#777">#252A31</text>
<rect x="390" y="42" width="110" height="70" rx="8" fill="#F2F4F7" stroke="#ccc"/><text x="390" y="128" font-size="11" fill="#333">Text</text><text x="390" y="143" font-size="11" fill="#777">#F2F4F7</text>
<rect x="512" y="42" width="104" height="70" rx="8" fill="#9AA3AF"/><text x="512" y="128" font-size="11" fill="#333">Muted text</text><text x="512" y="143" font-size="11" fill="#777">#9AA3AF</text>
<text x="24" y="182" font-size="13" font-weight="700" fill="#333">Accents — one meaning each</text>
<rect x="24" y="194" width="140" height="58" rx="8" fill="#3E8BFF"/><text x="24" y="268" font-size="11" fill="#333">Electric blue · interactive</text><text x="24" y="283" font-size="11" fill="#777">#3E8BFF</text>
<rect x="178" y="194" width="140" height="58" rx="8" fill="#2FD27C"/><text x="178" y="268" font-size="11" fill="#333">Charge green · charging</text><text x="178" y="283" font-size="11" fill="#777">#2FD27C</text>
<rect x="332" y="194" width="140" height="58" rx="8" fill="#FFB020"/><text x="332" y="268" font-size="11" fill="#333">Caution amber · warnings</text><text x="332" y="283" font-size="11" fill="#777">#FFB020</text>
<rect x="486" y="194" width="130" height="58" rx="8" fill="#FF4D4F"/><text x="486" y="268" font-size="11" fill="#333">Alert red · critical</text><text x="486" y="283" font-size="11" fill="#777">#FF4D4F</text>
</svg>` },
      after: `One rule to write in your process book: **red appears only for critical alerts.** Not for a "stop" button, not for a heated seat at full power. If drivers learn that red always means "look now," your alerts will work in a single glance.

For daytime, you'll want a light variant later, but test the dark one first — it's the harder case.` },

    /* ---------- 13. typography ---------- */
    { role: 'user', text: `What font sizes should I use? Everything I make looks tiny when I actually stand back from my laptop.` },
    { role: 'assistant', text: `That instinct — standing back from the laptop — is exactly right. The driver's eyes are about 70–80 cm from the center screen, roughly double your usual laptop distance, so sizes need to roughly double too.

A type scale that works at that distance:`,
      table: { headers: ['Use', 'Size', 'Weight', 'Example'],
        rows: [
          ['Speed', '96 px', 'Bold', '64'],
          ['Next-turn distance', '40 px', 'Bold', '0.4 mi'],
          ['Primary labels', '28 px', 'Semibold', 'Temperature, Wipers'],
          ['Secondary labels', '22 px', 'Regular', 'Turn right on Forbes Ave'],
          ['Smallest allowed text', '20 px', 'Regular', 'Range estimate note'],
          ['Parked-only screens', '18 px', 'Regular', 'Settings descriptions']
        ] },
      after: `Two quick tips. Use a font with **tabular numbers**, so the speed doesn't jiggle sideways as digits change from 59 to 61. And avoid thin weights entirely on the dark theme — thin light-on-dark text blurs at a glance.` },

    /* ---------- 14. design tokens ---------- */
    { role: 'user', text: `My professor said we'd get extra credit for building part of the prototype in code. Can you turn the colors and font sizes into CSS so I can reuse them?` },
    { role: 'assistant', text: `Sure. Put these at the top of your stylesheet as CSS custom properties ("design tokens"). Then every component uses the token names instead of raw values, so changing a color later is a one-line edit.`,
      code: { lang: 'css', body: `:root {
  /* neutrals */
  --color-bg:        #0E1013;
  --color-surface:   #1A1D22;
  --color-raised:    #252A31;
  --color-text:      #F2F4F7;
  --color-text-muted:#9AA3AF;

  /* accents: one meaning each */
  --color-interactive: #3E8BFF;  /* blue  = you can touch this   */
  --color-charging:    #2FD27C;  /* green = charging / healthy   */
  --color-caution:     #FFB020;  /* amber = warning              */
  --color-critical:    #FF4D4F;  /* red   = critical alerts ONLY */

  /* type scale */
  --text-speed:     96px;
  --text-turn:      40px;
  --text-primary:   28px;
  --text-secondary: 22px;
  --text-min:       20px;

  /* touch targets (147 ppi screen) */
  --target-frequent: 116px;  /* 20 mm */
  --target-rare:      87px;  /* 15 mm */
  --target-gap:       17px;  /*  3 mm */

  --radius: 14px;
}

.dock-button {
  min-width:  var(--target-frequent);
  min-height: var(--target-frequent);
  margin-right: var(--target-gap);
  background: var(--color-raised);
  color: var(--color-text);
  font-size: var(--text-primary);
  border-radius: var(--radius);
}` },
      after: `If your prototype ends up in React, these variables still work — you just reference them in your CSS modules or styled components.` },

    /* ---------- 15. range display ---------- */
    { role: 'user', text: `Next problem: the battery. Should I show range in miles or as a percentage? My interviewees were split.` },
    { role: 'assistant', text: `They're split because they're answering different questions. Miles answers "can I get there?" Percent answers "how full is the battery?" Your personas map onto this nicely: Marcus on a road trip thinks in miles; Dana on her commute mostly thinks "do I need to charge tonight?"

My suggestion:

- **Show miles as the main number** while driving, because it's directly actionable.
- **Show percent as a small secondary label** and as the fill level of the battery icon.
- **Change color at thresholds**, not gradually: normal above 20%, amber from 20% down to 10%, red below 10%.
- **When navigation is active, show arrival charge** ("arrive with 34%") instead of current range. That's the number Marcus actually cares about.

The thresholds are worth testing. Some drivers find 20% too early for a warning, so ask about it in your usability test.` },

    /* ---------- 16. battery gauge component ---------- */
    { role: 'user', text: `Love that. Can you write the battery gauge as a React component? I'm going to try the coded prototype.` },
    { role: 'assistant', text: `Here's a small, self-contained component. It uses the tokens from the CSS above and the thresholds we just agreed on: amber at 20%, red at 10%.`,
      code: { lang: 'jsx — BatteryGauge.jsx', body: `import React from 'react';

const LOW = 20;       // percent: switch to caution amber
const CRITICAL = 10;  // percent: switch to alert red

function levelColor(percent, isCharging) {
  if (isCharging) return 'var(--color-charging)';
  if (percent < CRITICAL) return 'var(--color-critical)';
  if (percent <= LOW) return 'var(--color-caution)';
  return 'var(--color-text)';
}

export default function BatteryGauge({ percent, rangeMiles, arrivalPercent, isCharging }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = levelColor(clamped, isCharging);

  return (
    <div className="battery" aria-label={'Battery ' + clamped + ' percent'}>
      <div className="battery-icon">
        <div className="battery-fill"
             style={{ width: clamped + '%', background: color }} />
      </div>

      {/* main number: miles, because it answers "can I get there?" */}
      <span className="battery-range" style={{ color }}>
        {rangeMiles} mi
      </span>

      {/* secondary: percent, or arrival charge when navigating */}
      <span className="battery-sub">
        {arrivalPercent != null
          ? 'arrive with ' + arrivalPercent + '%'
          : clamped + '%'}
      </span>
    </div>
  );
}` },
      after: `Use it like \`<BatteryGauge percent={18} rangeMiles={52} />\` to see the amber state, or pass \`isCharging\` to see green. Testing each state in isolation like this is also a nice process-book figure.` },

    /* ---------- 17. charging screen ---------- */
    { role: 'user', text: `What should the screen look like while the car is charging? Nobody is driving then, so I guess the rules are different?` },
    { role: 'assistant', text: `Exactly — while charging, the driver is parked and has time, so this is the one screen where you can show more detail. But they still want the answer to one question at a glance from outside the car: **"how long until I can leave?"**

Here's a layout that puts that answer first:`,
      image: { alt: 'Charging screen sketch with a large green ring at 64 percent, the text 28 minutes to 80 percent, charging speed 142 kilowatts, and buttons to stop charging and set a limit', caption: 'Charging screen concept. The time to the charge limit is the largest element; details sit below.',
        svg: `<svg viewBox="0 0 640 360" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="640" height="360" rx="14" fill="#0E1013"/>
<circle cx="190" cy="170" r="104" fill="none" stroke="#252A31" stroke-width="20"/>
<circle cx="190" cy="170" r="104" fill="none" stroke="#2FD27C" stroke-width="20" stroke-dasharray="418 653" transform="rotate(-90 190 170)" stroke-linecap="round"/>
<text x="190" y="168" text-anchor="middle" fill="#F2F4F7" font-size="46" font-weight="700">64%</text>
<text x="190" y="196" text-anchor="middle" fill="#9AA3AF" font-size="14">charging</text>
<text x="340" y="110" fill="#F2F4F7" font-size="36" font-weight="700">28 min</text>
<text x="340" y="136" fill="#9AA3AF" font-size="15">until 80% (your limit)</text>
<text x="340" y="182" fill="#2FD27C" font-size="20" font-weight="700">142 kW</text>
<text x="340" y="204" fill="#9AA3AF" font-size="13">+186 mi/hour of range</text>
<rect x="340" y="236" width="128" height="48" rx="10" fill="#252A31"/><text x="404" y="266" text-anchor="middle" fill="#F2F4F7" font-size="14">Stop charging</text>
<rect x="480" y="236" width="128" height="48" rx="10" fill="#252A31" stroke="#3E8BFF"/><text x="544" y="266" text-anchor="middle" fill="#3E8BFF" font-size="14">Set limit</text>
<text x="24" y="336" fill="#9AA3AF" font-size="12">Supercharger · Bay 4 · $0.42/kWh</text>
</svg>` },
      after: `The ring is green because green means charging in your palette — this is where that rule pays off. Note that "Stop charging" is **not** red: it's an ordinary action, not a critical alert.` },

    /* ---------- 18. navigation ---------- */
    { role: 'user', text: `Three people said the map is too busy. What should I take out?` },
    { role: 'assistant', text: `While the car is moving, the map has one job: help the driver make the **next** decision. Anything that doesn't help with that can be hidden until the car stops.

What to keep while moving:
- Your route line, thick and high-contrast.
- The next turn, as a card with distance and street name.
- Upcoming chargers along the route (for Marcus).
- Traffic color only on your route, not on every street.

What to hide while moving:
- Points of interest like restaurants and shops.
- Street names on roads you aren't using.
- 3D buildings and terrain.
- The full list of turns.

You can phrase this in your presentation as a **"driving mode" vs "parked mode"** for the map. It's a simple idea that directly answers the "map is too busy" finding, and it's easy to demonstrate in a prototype: one toggle, two screens.` },

    /* ---------- 19. alert priority levels ---------- */
    { role: 'user', text: `How should alerts work? Like low battery, a door open, a car in my blind spot. Right now I just have a red banner for everything.` },
    { role: 'assistant', text: `A single red banner for everything trains drivers to ignore the banner. You need **priority levels**, where each level looks and sounds different, so the driver knows how urgent something is before reading a single word.

Three levels is enough for a student project:`,
      table: { headers: ['Level', 'Examples', 'Color', 'Sound', 'Behavior'],
        rows: [
          ['P1 — Critical', 'collision warning, car in blind spot during lane change, brake fault', 'Alert red', 'urgent chime', 'Interrupts everything; shown in the driver zone; stays until resolved'],
          ['P2 — Warning', 'battery below 10%, door open while moving, tire pressure low', 'Caution amber', 'single soft tone', 'Banner in the driver zone; stays until the driver dismisses it'],
          ['P3 — Info', 'software update ready, charging complete, new message', 'Neutral surface', 'none', 'Small toast; disappears by itself after 6 seconds; never shown while turning']
        ] },
      after: `Notice that P3 alerts are **never shown during a turn**. Delaying non-urgent information until the driver's workload is low is a real technique from automotive research, and it's an easy rule to demonstrate in your prototype.` },

    /* ---------- 20. alert queue logic ---------- */
    { role: 'user', text: `What happens if two alerts come at once? Can you help me with the logic?` },
    { role: 'assistant', text: `Good question — this is where a lot of real systems get messy. The simplest rule that holds up: **show one alert at a time, and a higher priority always replaces a lower one.** Lower alerts wait in a queue and come back later.

Here's that logic in plain JavaScript, so it works in any prototype:`,
      code: { lang: 'javascript — alertQueue.js', body: `// Lower number = more urgent. P1 critical, P2 warning, P3 info.
const queue = [];
let current = null;

function push(alert) {           // alert = { id, level, text }
  if (!current) return show(alert);

  if (alert.level < current.level) {   // more urgent: take over now
    queue.unshift(current);
    return show(alert);
  }
  queue.push(alert);
  queue.sort((a, b) => a.level - b.level);
}

function show(alert) {
  current = alert;
  render(alert);
  if (alert.level === 3) {        // info toasts dismiss themselves
    setTimeout(() => dismiss(alert.id), 6000);
  }
}

function dismiss(id) {
  if (!current || current.id !== id) return;
  current = null;
  const next = queue.shift();
  if (next) show(next); else clearBanner();
}

// "Never show P3 while turning": call this from your turn signal.
function canShowInfo(vehicle) {
  return !vehicle.turnSignalOn && Math.abs(vehicle.steeringAngle) < 15;
}` },
      after: `Replace \`render\` and \`clearBanner\` with whatever draws your banner. In a Figma or ProtoPie prototype you won't run this code, but writing the rules down this clearly is still worth a page in your process book.` },

    /* ---------- 21. climate controls ---------- */
    { role: 'user', text: `OK, climate. This is my biggest finding. My idea is to put temperature and fan always visible in the dock. Is that enough?` },
    { role: 'assistant', text: `It's a strong start, but "always visible" isn't the same as "one glance." Let's check the full task. To make the car warmer, a driver currently has to: look at the screen, find the climate icon, tap it, find the temperature, tap the arrow several times, and look back. That's many glances.

To get it down to **one glance**, try:

- **Big plus and minus buttons right on the dock** (116 px each) — no menu at all.
- **Swipe on the temperature** to change it by several degrees at once, so the driver doesn't need to tap repeatedly.
- **A small "pulse" animation and a sound tick** on each change, so the driver can confirm without looking again.
- **Fan speed as a single button** that cycles low → medium → high, instead of a slider that needs precise aim.

Then test it: give people the task "make it warmer by 3 degrees" and count glances on video. If you can show a before-and-after count, that's your headline result.` },

    /* ---------- 22. physical buttons debate ---------- */
    { role: 'user', text: `A classmate said the real answer is just to bring back physical knobs. Is she right? Would that ruin my project?` },
    { role: 'assistant', text: `She has a point, and you should take it seriously rather than avoid it — your critics will raise it too. Research on in-car controls generally finds that physical controls can be used with fewer and shorter glances, because drivers can find them by feel. Some car makers have brought buttons back for exactly this reason.

But it doesn't ruin your project. Your brief is specifically the **screen**, so you can address it in two honest ways:

1. **Acknowledge it in your presentation.** "Physical knobs would likely be even better; within a screen-only brief, here's how close we can get."
2. **Borrow what makes knobs good.** Knobs work because of fixed positions, big targets, and feedback you can feel. You're already doing the first two. For the third, sound ticks and haptic pulses on the screen are a reasonable stand-in.

Showing that you know the limits of your solution almost always scores better than pretending it has none.` },

    /* ---------- 23. voice commands ---------- */
    { role: 'user', text: `Should I add voice control? It feels like it could solve everything.` },
    { role: 'assistant', text: `Voice helps for some tasks and is slow for others. It's great for anything with a lot of information to enter — "navigate to the nearest charger" is much easier spoken than typed. It's poor for quick adjustments: "set fan to two" takes longer to say than one tap on a well-placed button.

So I'd treat voice as a **backup path for complex tasks**, not your main solution. If you want to show it, define a small set of commands. Here's a simple format you could put in your process book or connect to a prototype:`,
      code: { lang: 'json — voice-commands.json', body: `{
  "commands": [
    { "intent": "set_temperature",  "examples": ["make it warmer", "set temperature to 70"],     "slots": ["degrees"] },
    { "intent": "wipers",           "examples": ["turn on the wipers", "wipers faster"],          "slots": ["speed"] },
    { "intent": "navigate_charger", "examples": ["find a charger", "nearest supercharger"],       "slots": [] },
    { "intent": "navigate_place",   "examples": ["take me home", "navigate to Forbes Avenue"],    "slots": ["destination"] },
    { "intent": "call_contact",     "examples": ["call Mom", "call Priya"],                        "slots": ["contact"] }
  ],
  "confirm_before_acting": ["call_contact"],
  "never_by_voice": ["open_glovebox_while_moving"]
}` },
      after: `The two lists at the bottom are the interesting design decisions: which commands need a confirmation, and which actions should never be possible by voice. Explaining those choices shows you've thought about errors, not just the happy path.` },

    /* ---------- 24. prototyping tools ---------- */
    { role: 'user', text: `Week 5 is close. What tool should I prototype in? I know Figma well, but I've heard ProtoPie is better for this. And I said I'd try code.` },
    { role: 'assistant', text: `Each tool is good at a different part of your project. Here's a comparison for your specific needs:`,
      table: { headers: ['', 'Figma', 'ProtoPie', 'Coded (React)'],
        rows: [
          ['Learning time for you', 'none — you know it', 'a few days', 'a week or more'],
          ['Swipe and drag on temperature', 'limited', 'yes, smooth', 'yes, full control'],
          ['Sounds and timed alerts', 'no', 'yes', 'yes'],
          ['Runs on a real touchscreen', 'via mirror app', 'yes', 'yes, in a browser'],
          ['Good for the visual screens', 'excellent', 'okay', 'slow to polish'],
          ['Extra credit for code', 'no', 'no', 'yes']
        ] },
      after: `My recommendation: **design all screens in Figma, then build only the two key interactions** — temperature and wipers — in code or ProtoPie. Those are the two tasks you'll measure in the usability test, so they're the only ones that need to feel real. Don't try to make the whole dashboard interactive; nobody has time for that in one week.` },

    /* ---------- 25. usability test plan ---------- */
    { role: 'user', text: `I'm going with Figma plus a coded version of the climate and wiper controls. Now I need a test plan. The brief says at least five people.` },
    { role: 'assistant', text: `Here's a plan you can run in a week. The key is to simulate driving so people can't just stare at the screen.

**Setup**
- Play a first-person driving video on a large monitor in front of the participant.
- Put your prototype on a tablet or touchscreen to their right, at roughly the car's screen position.
- Record their face with a webcam so you can count glances later.

**Tasks** (same order for everyone)
1. Make it 3 degrees warmer.
2. It starts raining — turn on the wipers.
3. Turn the fan up to high.
4. Find the nearest charger on your route.
5. Tell me your current speed and the speed limit.
6. Dismiss the "software update" message.

**What to measure**
- Number of glances and total eyes-off-road time per task (from the video).
- Task completion time.
- Errors, such as tapping the wrong button.

Run each task on the **current** Model 3 design (using screenshots) and then on **yours**, alternating which one people see first. That gives you a before-and-after comparison, which is far more convincing than a single set of numbers.` },

    /* ---------- 26. results chart ---------- */
    { role: 'user', text: `I tested with six people! Average times: warmer by 3 degrees went from 7.8 to 3.1 seconds, wipers from 9.4 to 2.6, fan to high from 5.9 to 2.4, finding a charger from 14.2 to 9.8, reading the speed and limit from 2.1 to 1.2, dismissing the update from 3.0 to 2.7. Can you make a chart?` },
    { role: 'assistant', text: `Those are strong results — every task improved, and the two biggest gains are exactly your two biggest interview findings. Here's a chart you can drop into your slides:`,
      image: { alt: 'Grouped bar chart of average task time in seconds, current design versus new design, for six tasks; wipers drop from 9.4 to 2.6 seconds and temperature from 7.8 to 3.1', caption: 'Usability test, 6 participants: average task time in seconds, current design (gray) vs. your design (blue).',
        svg: `<svg viewBox="0 0 640 330" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="640" height="330" fill="#fff"/>
<line x1="60" y1="270" x2="620" y2="270" stroke="#bbb"/>
<line x1="60" y1="20" x2="60" y2="270" stroke="#bbb"/>
<text x="52" y="274" text-anchor="end" font-size="10" fill="#777">0</text>
<text x="52" y="186" text-anchor="end" font-size="10" fill="#777">5</text><line x1="60" y1="182" x2="620" y2="182" stroke="#eee"/>
<text x="52" y="98" text-anchor="end" font-size="10" fill="#777">10</text><line x1="60" y1="94" x2="620" y2="94" stroke="#eee"/>
<text x="52" y="30" text-anchor="end" font-size="10" fill="#777">s</text>
<rect x="76" y="133" width="30" height="137" fill="#b7bcc4"/><rect x="108" y="216" width="30" height="54" fill="#3E8BFF"/>
<text x="107" y="290" text-anchor="middle" font-size="11" fill="#333">warmer</text><text x="91" y="128" text-anchor="middle" font-size="10" fill="#555">7.8</text><text x="123" y="211" text-anchor="middle" font-size="10" fill="#1d5bbf">3.1</text>
<rect x="168" y="105" width="30" height="165" fill="#b7bcc4"/><rect x="200" y="224" width="30" height="46" fill="#3E8BFF"/>
<text x="199" y="290" text-anchor="middle" font-size="11" fill="#333">wipers</text><text x="183" y="100" text-anchor="middle" font-size="10" fill="#555">9.4</text><text x="215" y="219" text-anchor="middle" font-size="10" fill="#1d5bbf">2.6</text>
<rect x="260" y="166" width="30" height="104" fill="#b7bcc4"/><rect x="292" y="228" width="30" height="42" fill="#3E8BFF"/>
<text x="291" y="290" text-anchor="middle" font-size="11" fill="#333">fan high</text><text x="275" y="161" text-anchor="middle" font-size="10" fill="#555">5.9</text><text x="307" y="223" text-anchor="middle" font-size="10" fill="#1d5bbf">2.4</text>
<rect x="352" y="20" width="30" height="250" fill="#b7bcc4"/><rect x="384" y="98" width="30" height="172" fill="#3E8BFF"/>
<text x="383" y="290" text-anchor="middle" font-size="11" fill="#333">charger</text><text x="367" y="16" text-anchor="middle" font-size="10" fill="#555">14.2</text><text x="399" y="93" text-anchor="middle" font-size="10" fill="#1d5bbf">9.8</text>
<rect x="444" y="233" width="30" height="37" fill="#b7bcc4"/><rect x="476" y="249" width="30" height="21" fill="#3E8BFF"/>
<text x="475" y="290" text-anchor="middle" font-size="11" fill="#333">speed + limit</text><text x="459" y="228" text-anchor="middle" font-size="10" fill="#555">2.1</text><text x="491" y="244" text-anchor="middle" font-size="10" fill="#1d5bbf">1.2</text>
<rect x="536" y="217" width="30" height="53" fill="#b7bcc4"/><rect x="568" y="222" width="30" height="48" fill="#3E8BFF"/>
<text x="567" y="290" text-anchor="middle" font-size="11" fill="#333">dismiss update</text><text x="551" y="212" text-anchor="middle" font-size="10" fill="#555">3.0</text><text x="583" y="217" text-anchor="middle" font-size="10" fill="#1d5bbf">2.7</text>
<rect x="420" y="306" width="12" height="12" fill="#b7bcc4"/><text x="438" y="316" font-size="11" fill="#333">current design</text>
<rect x="530" y="306" width="12" height="12" fill="#3E8BFF"/><text x="548" y="316" font-size="11" fill="#333">your design</text>
</svg>` },
      after: `Two honest caveats to include on the slide. First, six people is a small sample, so describe these as promising results rather than proof. Second, "finding a charger" is still 9.8 seconds — close to the 12-second total limit — so it's the obvious next thing to improve. Pointing out your own weakest result usually earns respect in a critique.` },

    /* ---------- 27. iteration ---------- */
    { role: 'user', text: `People also said a few things during the test: two of them didn't notice the temperature had changed, one person hit "defrost" instead of "wipers", and everyone liked the speed limit next to the speed. What should I change for week 6?` },
    { role: 'assistant', text: `Each comment points to a specific fix:

- **"Didn't notice the temperature changed"** → your feedback is too subtle. Make the number briefly grow and glow when it changes, and add the sound tick you planned. Then re-test with just those two tasks if you have time.
- **Hit defrost instead of wipers** → the two buttons are probably next to each other and look alike. Move them apart, give them very different icons, and check that the gap is at least 17 px.
- **Everyone liked speed limit next to speed** → keep it, and make it the first thing you show in the presentation. Positive findings are evidence too.

Don't redesign anything that tested well. Week 6 is for small, targeted fixes you can explain with "we saw X, so we changed Y." That before-and-after story is the backbone of a good process book.` },

    /* ---------- 28. accessibility ---------- */
    { role: 'user', text: `Someone asked in critique whether my design works for colorblind drivers. I didn't think about that at all.` },
    { role: 'assistant', text: `Good catch by your classmate — and it's fixable in a day. Two checks:

**1. Never use color alone.** Your alert levels already differ in sound and behavior, which helps. Also give each level a distinct icon shape: a triangle for warnings and an octagon for critical alerts, for example. Then a driver who can't tell amber from red still knows the level.

**2. Check contrast.** Text and icons need enough contrast against the background to read at a glance. Here are your palette colors on the dark surface:`,
      table: { headers: ['Color on Surface #1A1D22', 'Contrast ratio', 'OK for text?'],
        rows: [
          ['Text #F2F4F7', '15.3 : 1', 'Yes'],
          ['Muted text #9AA3AF', '6.6 : 1', 'Yes'],
          ['Electric blue #3E8BFF', '5.1 : 1', 'Yes'],
          ['Charge green #2FD27C', '8.6 : 1', 'Yes'],
          ['Caution amber #FFB020', '9.2 : 1', 'Yes'],
          ['Alert red #FF4D4F', '5.2 : 1', 'Yes, but keep it large and bold']
        ] },
      after: `All of your colors pass the common 4.5 : 1 minimum for text. Red and blue are the closest to that line, so keep red and blue text large and bold. Run a colorblindness simulator on your final screens (Figma has plugins for this) and put one before-and-after screenshot in your process book.` },

    /* ---------- 29. presentation outline ---------- */
    { role: 'user', text: `Presentation is in 3 days. Five minutes is so short. How should I structure it?` },
    { role: 'assistant', text: `Five minutes is about six slides if you move quickly. Build it as a story — problem, evidence, design, proof:

1. **The problem (30 s).** One sentence and one photo: "In a Model 3, every control is on the screen, and drivers have to look away from the road to use it."
2. **What I heard (45 s).** Your findings table, highlighting climate (5 of 6) and wipers (4 of 6).
3. **The goal (20 s).** "One glance, under two seconds, for the most common tasks."
4. **The design (1 min 45 s).** Zone map, then the main screen. Demo the temperature swipe and the wiper button live if you can.
5. **The proof (1 min).** Your before-and-after chart. Say the wiper number out loud: from 9.4 to 2.6 seconds.
6. **What's next (40 s).** Finding a charger is still slow; physical controls and a head-up display as future work.

Practice it out loud twice with a timer. Almost everyone runs long the first time — usually on the design slide.` },

    /* ---------- 30. wrap-up ---------- */
    { role: 'user', text: `I think I'm ready. Can you give me a quick summary of the whole project so I can use it as the intro to my process book?` },
    { role: 'assistant', text: `Here's a draft you can adapt:

"This project redesigns the center display of the Tesla Model 3 to reduce the time drivers spend looking away from the road. Interviews with six owners showed that the most frustrating tasks were changing the climate settings and finding the wiper controls, and that drivers often glanced at the screen to compare their speed with the speed limit.

The redesign divides the screen into a driver zone, a map zone, and a dock of always-visible controls. It uses large touch targets, a dark palette in which each accent color has one meaning, and three alert priority levels. The speed limit sits directly beside the speed, and the map simplifies itself while the car is moving.

In a usability test with six participants, every measured task became faster. Turning on the wipers fell from 9.4 to 2.6 seconds on average, and making the cabin warmer fell from 7.8 to 3.1 seconds. Finding a charger remains the slowest task and is the main focus for future work."

Good luck with the presentation — you've built a project with real evidence behind it.` }
  ]
};
