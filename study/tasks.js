// Task sheet and study wording.
//
// RESEARCHER NOTE: the `answer` fields are for the researcher only and are never rendered in the
// participant-facing UI. The PI should review every target and question before the first session.
// Targets were drafted to sit in the required thirds of each page; `locator` is the phrase a
// researcher can search for to confirm placement.
window.STUDY_TASKS = {

  // ---- Phase 1: exploratory. Wording is fixed by the protocol. ----
  phase1: {
    conversation: [
      { id: 'C1', minutes: 3, text: 'This page shows a long conversation between a person and an AI chatbot. Without reading every message, figure out what topics the conversation covers. Tell me when you feel you have a good overview.' },
      { id: 'C2', minutes: 3, text: 'Pick one topic from the conversation that interests you. Go to where it is discussed and tell me what the chatbot said about it.' },
      { id: 'C3', minutes: 4, text: 'Think of one question you would want this conversation to answer. Tell me your question, then find where it is answered, or decide that it is not.' },
      { id: 'C4', minutes: 2, text: 'Now go back to the part you chose in Task C2.' }
    ],
    document: [
      { id: 'D1', minutes: 3, text: 'This page shows a long document. Without reading every line, figure out what it covers and what its main parts are. Tell me when you feel you have a good overview.' },
      { id: 'D2', minutes: 4, text: 'Think of one question you would want this document to answer. Tell me your question, then find the part that answers it, or decide that the document does not answer it.' },
      { id: 'D3', minutes: 4, text: 'Find two parts of the document that discuss related ideas, and tell me how they are connected.' },
      { id: 'D4', minutes: 2, text: 'Now go back to the part you found in Task D2.' }
    ]
  },

  // ---- Phase 2: timed. Templates are filled from the sheet below. ----
  phase2Templates: {
    t1: 'Find the part where [TARGET1] is discussed.',
    t2: 'Find the part where [TARGET2] is discussed.',
    t3: '[QUESTION] Please tell me the answer.',
    t4: 'Now go back to the part you found in Task 1.'
  },

  sheet: {
    'A.conversation': {
      target1: 'the insurance requirement for lending power tools',
      target1Locator: 'written confirmation from the insurer',
      target2: 'the policy for tools returned late',
      target2Locator: 'one dollar per day per item',
      question: 'How many tools can one member borrow at the same time?',
      answer: 'Three tools at a time (stated early in the conversation, in the exchange about how many tools to start with).'
    },
    'A.document': {
      target1: 'the result of the sediment survey',
      target1Locator: 'Sediment survey results',
      target2: 'the volunteer training schedule',
      target2Locator: 'Volunteer training schedule',
      question: 'In which year was the most recent flood?',
      answer: '2019 (section: Background and the flood record).'
    },
    'B.conversation': {
      target1: 'the choice of site for the transmitter antenna',
      target1Locator: 'water tower is the technically correct location',
      target2: 'the training required before presenting a show',
      target2Locator: 'four-session introductory course',
      question: 'How many hours a week is the studio open to members?',
      answer: 'Forty hours a week (stated early, in the exchange about how many hours to fill).'
    },
    'B.document': {
      target1: 'the price of a stall',
      target1Locator: 'Stall pricing and vendor turnover',
      target2: 'the plan for waste and recycling',
      target2Locator: 'Waste and recycling plan',
      question: 'In which year did the market first run?',
      answer: '2014 (section: Background and the founding years).'
    }
  },

  // ---- Fixed wording from the protocol ----
  text: {
    checklist: 'Before we start recording, please: close any other browser tabs, turn off notifications, share only this browser window in Zoom, and change your Zoom display name to your session code. Your camera is optional; if it is on, it will appear in the recording.',
    introPhase1: 'I will give you some tasks to complete on this website. As you work, please tell me what you are looking for, what you expect, and what you are thinking. This website is an experimental prototype, so the AI may be slow or give wrong results, and that is useful for us to see. Please use only the content on the website and do not type any personal information into the search box. You can stop or take a break at any time.',
    introPhase2: 'Today you will use two versions of this website to find information in some made-up pages: one version with an AI tool and one with a regular scrollbar. Some tasks are timed, but it is the tools that are being tested, not you. During the timed tasks, you don\'t need to think aloud. When you find the part I ask for, put your cursor on it and say \'found it.\' When I ask a question, just say your answer. Each task has up to 2 minutes; if time runs out, we will simply move on, and that is useful information too. Please do not type any personal information into the search box. You can take a break or stop at any time.',
    practiceIS: 'This version has colored labeled markers next to the scrollbar that summarize parts of the page. You can hover over a marker to see a preview, type keywords or a sentence into the search box, and use the back button to return to where you were before.',
    practiceCS: 'This version has a regular scrollbar. You can also use your browser\'s find feature, Ctrl+F or Cmd+F.',
    breakText: 'Take a short break if you\'d like. Click Continue when you\'re ready.',
    feedbackIntro: 'We will now talk about your experience. There are no right or wrong answers, and critical feedback is just as helpful as positive feedback. Please tell me what worked and what did not. You can skip any question.',
    interviewIntro: 'We will now talk about your experience. There are no right or wrong answers, and critical feedback is just as helpful as positive feedback. You can skip any question.',
    thanks: 'Thank you for participating!'
  },

  feedbackQuestions: [
    'What is your overall impression of this tool? Did it feel different on the conversation page and on the document page?',
    'I did not show you how the tool works before the tasks. What did you figure out on your own, and was anything confusing or unclear?',
    'What did the colored labeled markers mean to you, and how did you decide which one to use?',
    'Think of a time today when you needed to find something specific. How did that go?',
    'Think of a time today when you wanted to go back to something you had already read. How did that go?',
    'How accurate or trustworthy did the AI-generated labels, previews, and search results seem? Did any waiting affect you?',
    'Which feature, if any, was most useful, and which, if any, got in your way? Consider the colored labeled markers, hover preview, search box, and back button.',
    'When, if ever, would you choose this tool over regular scrolling? What would you change or add? You can also share any other feedback here.'
  ],

  interviewQuestions: [
    'Which version did you prefer overall, and why?',
    'Which version made it easier to find specific information? What made the difference?',
    'Which version made it easier to go back to something you had already read?',
    'Did the AI labels, previews, or search results ever mislead you or slow you down? Can you tell me about it?',
    'When, if ever, would you choose the AI tool over a regular scrollbar? Is there anything you would change?'
  ],

  susStatements: [
    'I think that I would like to use this system frequently.',
    'I found the system unnecessarily complex.',
    'I thought the system was easy to use.',
    'I think that I would need the support of a technical person to be able to use this system.',
    'I found the various functions in this system were well integrated.',
    'I thought there was too much inconsistency in this system.',
    'I would imagine that most people would learn to use this system very quickly.',
    'I found the system very cumbersome to use.',
    'I felt very confident using the system.',
    'I needed to learn a lot of things before I could get going with this system.'
  ]
};
