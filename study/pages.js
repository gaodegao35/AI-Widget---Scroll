// Participant-facing wording for the moderated session.
// The tasks themselves are NOT shown on screen: the researcher reads them aloud from the session
// script. The site is one introduction page, then the two long pages, then an end screen.
window.STUDY_PAGES = {

  welcome: {
    eyebrow: 'Intelligent Scrolling study',
    title: 'Welcome — here\'s what we\'ll do today',
    lede: 'Thanks for helping with this study. Please read this page; your researcher will go through it with you.',
    blocks: [
      { heading: 'About this study',
        paras: [
          'We are testing a new kind of scrollbar that uses AI to help people find their way around long pages, such as a long chat with an AI assistant or a long article. It is the scrollbar that is being tested, not you. If something is confusing or slow, that is useful for us to see.' ] },
      { heading: 'What you will do',
        paras: [
          'You will look at two long pages, one after the other. Your researcher will read you some short tasks out loud, such as finding a certain part of the page. Please think out loud as you work: say what you are looking for and what you expect to happen.',
          'There is no time pressure and no right or wrong way to do the tasks. Use the page however feels natural to you.' ] },
      { heading: 'Page 1 · Your chat with an AI assistant',
        paras: [
          'Imagine this is your own chat history. You are a student in an interaction design course, and your final project is to redesign the center touchscreen dashboard of a Tesla Model 3. You have six weeks, and the goal is to reduce how long drivers look away from the road.',
          'Over several weeks you asked an AI assistant for help with every step: planning, interviewing Tesla owners, screen layout, colors and fonts, code for parts of the prototype, a usability test, and your final presentation. The chat includes sketches, charts, code, and tables.' ] },
      { heading: 'Page 2 · A long article',
        paras: [
          'A magazine-style article about how a mid-sized city called Millbrook tried to cool down its hottest neighborhoods after a record heat wave: measuring the heat, planting trees, painting roofs and streets, adding shade, and what did and didn\'t work. It includes maps, charts, data, and tables.' ] }
    ],
    note: 'Everything on these pages is made up for this study. Please don\'t type any personal information into the search box. Nothing you do on this website is saved.',
    start: 'Start — open page 1'
  },

  chat: { eyebrow: 'Page 1 of 2', title: 'Your chat with an AI assistant' },
  doc:  { eyebrow: 'Page 2 of 2', title: 'The article' },

  end: {
    title: 'That\'s all the pages',
    text: 'Thank you! Your researcher will now ask you a few questions about what you just did.',
    note: 'Nothing you did or typed on this website was saved. Refreshing the page clears everything.'
  }
};
