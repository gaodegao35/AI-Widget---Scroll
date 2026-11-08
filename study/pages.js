// Participant-facing wording for the moderated session.
// The tasks themselves are NOT shown on screen: the researcher reads them aloud from the session
// script. The screens only give context and move the participant from one page to the next.
window.STUDY_PAGES = {

  welcome: {
    title: 'Welcome',
    lede: 'Thanks for helping with this study. Today you will look at two long web pages. Your researcher will read each task to you out loud, so you don\'t need to read or remember anything on this screen.',
    pages: [
      { label: 'Page 1 · A conversation with an AI chat assistant',
        text: 'Imagine this is your own chat history. You are a student in an interaction design course, and your final project is to redesign the center touchscreen dashboard of a Tesla Model 3. Over several weeks you asked an AI assistant for help with everything: planning, interviewing drivers, screen layout, colors, code, testing, and your final presentation. The conversation includes sketches, charts, code, and tables.' },
      { label: 'Page 2 · A long article',
        text: 'A long magazine-style article about how a mid-sized city called Millbrook tried to cool down its hottest neighborhoods after a deadly heat wave: measuring the heat, planting trees, painting roofs and streets, adding shade, and what did and didn\'t work. It includes maps, charts, data, and tables.' }
    ],
    note: 'Everything on these pages is made up for this study. It is the scrolling tools that are being tested, not you. Please think out loud as you go, and don\'t type any personal information into a search box.'
  },

  chat: {
    eyebrow: 'Page 1 of 2',
    title: 'The conversation',
    text: 'Imagine this is your own chat history: you are a student redesigning the Tesla Model 3 dashboard for a course project, and you have been asking an AI assistant for help over several weeks.',
    open: 'Open the conversation'
  },

  doc: {
    eyebrow: 'Page 2 of 2',
    title: 'The article',
    text: 'A long article about how the city of Millbrook tried to cool its hottest neighborhoods after a record heat wave.',
    open: 'Open the article'
  },

  tool: {
    ai: 'On this page, the scrollbar has the AI scrolling tool.',
    regular: 'On this page, the scrollbar is a regular scrollbar.'
  },

  end: {
    title: 'That\'s all the pages',
    text: 'Thank you! Your researcher will now ask you a few questions about what you just did.',
    note: 'Nothing you did or typed on this website was saved. Refreshing the page clears everything.'
  }
};
