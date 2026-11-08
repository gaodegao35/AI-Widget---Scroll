// Page 2: the long document.
// A fictional long-form feature article written for this study. Millbrook, its neighborhoods,
// its residents, and every number in it are invented. No real people.
//
// Each section is one "part" on the scrollbar. A section may carry one `image` (inline SVG),
// `code`, or `table`, which is shown after its paragraphs.
window.STUDY_CONTENT = window.STUDY_CONTENT || {};

window.STUDY_CONTENT.doc = {
  title: 'Cooling Millbrook: How One City Took On Its Summer Heat',
  subtitle: 'A long read · about 20 minutes · fictional article written for this study',
  sections: [

    { heading: 'The hottest week on record', paras: [
      'On the morning of July 14, 2021, the thermometer outside Millbrook City Hall read 91°F at eight o\'clock. By three in the afternoon it read 106°F, the highest temperature ever recorded in the city. It was the sixth day of a heat wave that would last eleven days, every one of them above 98°F.',
      'The city of 182,000 people was not ready. The two public cooling centers filled by noon and turned people away. The regional hospital recorded 214 emergency visits for heat illness over the eleven days, more than in the previous three summers combined. Three deaths were later attributed to the heat. All three people lived alone, and all three lived in the same part of the city: the east side.',
      'This article follows what Millbrook did next. Over the following four years the city measured its heat block by block, planted thousands of trees, painted roofs and streets, put shade over parking lots and bus stops, and tried several ideas that did not work. It is a story about one mid-sized city, but the problems it faced are shared by almost every city that is getting hotter.' ] },

    { heading: 'A city built to hold heat', paras: [
      'Cities are hotter than the countryside around them, a pattern scientists call the urban heat island. The reasons are physical and fairly simple. Dark surfaces such as asphalt and tar roofs absorb most of the sunlight that hits them and turn it into heat. Concrete and brick store that heat during the day and release it slowly at night. Buildings block the wind. Cars, air conditioners, and factories add heat of their own.',
      'Trees and other plants work in the opposite direction. They shade the ground, and they release water vapor through their leaves, which cools the air around them in the same way that sweat cools skin. A street with a full tree canopy can be several degrees cooler than a bare street a few blocks away.',
      'Millbrook had more of the first kind of surface and less of the second than most of its neighbors. Much of the east side was built quickly in the 1950s and 1960s around a rail yard and two large factories. Wide streets, big parking lots, and flat dark roofs were cheap and practical. Trees were not part of the plan.' ] },

    { heading: 'Why the nights matter most', paras: [
      'When people talk about heat, they usually talk about the afternoon peak. Public health researchers pay closer attention to the nights. The human body recovers from heat stress while it sleeps, but only if the air cools down enough. When night temperatures stay high, the stress builds from one day to the next.',
      'During the 2021 heat wave, the official weather station at the airport recorded nighttime lows in the mid-70s. That station sits in an open field on the edge of the city. In the east side neighborhood of Eastgate, a resident who kept a thermometer on her porch recorded temperatures above 85°F at midnight on seven nights in a row.',
      '"The airport number was the one on the news," said Dr. Renée Okafor, who led the city\'s health department at the time. "But nobody lives at the airport. We realized we had no idea how hot it actually got where people sleep."' ] },

    { heading: 'Counting the heat: the sensor network', paras: [
      'The first thing the city did was measure. In the spring of 2022, Millbrook installed 140 small temperature and humidity sensors on streetlight poles, roughly one in every square half-mile, with extra sensors in the neighborhoods that had the most heat-related emergency visits.',
      'Each sensor records the air temperature and humidity every ten minutes and sends the readings to a public data portal. The hardware cost about $180 per sensor. The larger cost was the staff time needed to keep them working: in the first year, about one in eight sensors needed repair or replacement, usually because of water damage or vandalism.',
      'The data is deliberately simple. Below is a sample of what the portal publishes, showing two sensors at the same moment on a hot evening in August 2022.' ],
      code: { lang: 'csv — sample from the public sensor portal', body: `sensor_id,neighborhood,timestamp,air_temp_f,humidity_pct,heat_index_f
MB-017,Linden Park,2022-08-09T21:00,84.2,48,85.6
MB-018,Linden Park,2022-08-09T21:10,83.7,49,85.0
MB-091,Eastgate,2022-08-09T21:00,93.1,44,98.4
MB-092,Eastgate,2022-08-09T21:10,92.8,45,98.2
MB-104,Rail Yard,2022-08-09T21:00,94.0,41,98.9
MB-131,Riverside,2022-08-09T21:00,86.5,55,90.3` } },

    { heading: 'The first heat map', paras: [
      'By the end of the first summer, the city had enough data to draw a heat map. It confirmed what east side residents had been saying for years, and it surprised almost everyone else with how large the differences were.',
      'At nine o\'clock on a typical hot evening, the hottest blocks in Eastgate and around the old rail yard were 9°F warmer than the leafy streets of Linden Park, less than three miles away. The river and the large park on the west side acted as natural coolers. The two factory sites and the shopping center on Route 9 acted as heat sources.' ],
      image: { alt: 'Grid heat map of Millbrook with cooler blue cells in the west near Linden Park and the river and hot red cells in the east around Eastgate and the rail yard', caption: 'Figure 1. Evening air temperature across Millbrook, average of hot days in summer 2022. Each square is about half a mile across.',
        svg: `<svg viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="600" height="340" fill="#fff"/>
<g stroke="#fff" stroke-width="2">
<rect x="40" y="30" width="60" height="50" fill="#4f8fd6"/><rect x="100" y="30" width="60" height="50" fill="#6aa3dc"/><rect x="160" y="30" width="60" height="50" fill="#a8c9e6"/><rect x="220" y="30" width="60" height="50" fill="#f3d9a4"/><rect x="280" y="30" width="60" height="50" fill="#f2b278"/><rect x="340" y="30" width="60" height="50" fill="#ee8f5a"/><rect x="400" y="30" width="60" height="50" fill="#e66b43"/>
<rect x="40" y="80" width="60" height="50" fill="#3d7fcd"/><rect x="100" y="80" width="60" height="50" fill="#4f8fd6"/><rect x="160" y="80" width="60" height="50" fill="#a8c9e6"/><rect x="220" y="80" width="60" height="50" fill="#f3d9a4"/><rect x="280" y="80" width="60" height="50" fill="#ee8f5a"/><rect x="340" y="80" width="60" height="50" fill="#e0543a"/><rect x="400" y="80" width="60" height="50" fill="#d23b2e"/>
<rect x="40" y="130" width="60" height="50" fill="#3d7fcd"/><rect x="100" y="130" width="60" height="50" fill="#6aa3dc"/><rect x="160" y="130" width="60" height="50" fill="#d5e2ea"/><rect x="220" y="130" width="60" height="50" fill="#f2b278"/><rect x="280" y="130" width="60" height="50" fill="#e66b43"/><rect x="340" y="130" width="60" height="50" fill="#c72b25"/><rect x="400" y="130" width="60" height="50" fill="#c72b25"/>
<rect x="40" y="180" width="60" height="50" fill="#5a99da"/><rect x="100" y="180" width="60" height="50" fill="#8ab7e2"/><rect x="160" y="180" width="60" height="50" fill="#f3d9a4"/><rect x="220" y="180" width="60" height="50" fill="#f2b278"/><rect x="280" y="180" width="60" height="50" fill="#ee8f5a"/><rect x="340" y="180" width="60" height="50" fill="#e0543a"/><rect x="400" y="180" width="60" height="50" fill="#e66b43"/>
<rect x="40" y="230" width="60" height="50" fill="#6aa3dc"/><rect x="100" y="230" width="60" height="50" fill="#a8c9e6"/><rect x="160" y="230" width="60" height="50" fill="#f3d9a4"/><rect x="220" y="230" width="60" height="50" fill="#f3d9a4"/><rect x="280" y="230" width="60" height="50" fill="#f2b278"/><rect x="340" y="230" width="60" height="50" fill="#ee8f5a"/><rect x="400" y="230" width="60" height="50" fill="#f2b278"/>
</g>
<text x="70" y="160" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">Linden</text><text x="70" y="173" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">Park</text>
<text x="370" y="160" text-anchor="middle" font-size="11" fill="#fff" font-weight="700">Eastgate</text>
<text x="430" y="110" text-anchor="middle" font-size="10" fill="#fff" font-weight="700">Rail yard</text>
<text x="130" y="262" text-anchor="middle" font-size="11" fill="#1f3f66" font-weight="700">Riverside</text>
<text x="250" y="210" text-anchor="middle" font-size="10" fill="#7a4a12">Downtown</text>
<text x="490" y="44" font-size="12" fill="#333" font-weight="700">Evening air temp</text>
<rect x="490" y="56" width="18" height="18" fill="#c72b25"/><text x="514" y="70" font-size="11" fill="#333">93°F and up</text>
<rect x="490" y="80" width="18" height="18" fill="#ee8f5a"/><text x="514" y="94" font-size="11" fill="#333">90–92°F</text>
<rect x="490" y="104" width="18" height="18" fill="#f3d9a4"/><text x="514" y="118" font-size="11" fill="#333">87–89°F</text>
<rect x="490" y="128" width="18" height="18" fill="#6aa3dc"/><text x="514" y="142" font-size="11" fill="#333">84–86°F</text>
<path d="M30 300 C 120 286, 200 318, 300 300 S 460 290, 470 304" stroke="#5b9bd5" stroke-width="7" fill="none"/>
<text x="40" y="326" font-size="11" fill="#2d6aa3">Mill River</text>
<text x="465" y="326" text-anchor="end" font-size="10" fill="#888">N ↑</text>
</svg>` } },

    { heading: 'Who lives in the hottest blocks', paras: [
      'The heat map lined up closely with other maps the city already had: maps of tree cover, of income, and of age. The hottest neighborhoods had the fewest trees, the lowest household incomes, and, in Eastgate, the largest share of older residents living alone — the group most at risk during a heat wave.',
      'The table below, from the city\'s 2022 heat report, compares four neighborhoods. The pattern is not unusual. Studies of many American cities have found that lower-income neighborhoods are often hotter than wealthier ones, partly because of decades of decisions about where to build highways, factories, and parks.' ],
      table: { headers: ['Neighborhood', 'Tree canopy', 'Peak afternoon surface temp', 'Evening air temp', 'Residents 65+ living alone'],
        rows: [
          ['Linden Park', '41%', '109°F', '84°F', '6%'],
          ['Riverside', '33%', '118°F', '86°F', '9%'],
          ['Downtown', '14%', '131°F', '89°F', '7%'],
          ['Eastgate', '8%', '141°F', '93°F', '17%']
        ] } },

    { heading: 'What the ground is made of', paras: [
      'Air temperature tells only part of the story. On a sunny afternoon, the temperature of the surfaces around you — the street, the sidewalk, the wall of the building next to you — can matter as much as the air, because those surfaces radiate heat onto your skin.',
      'In the summer of 2022, city staff and volunteers from the local community college measured surface temperatures with handheld infrared thermometers at 3 p.m. on clear days. The differences between materials were dramatic.' ],
      table: { headers: ['Surface', 'Typical temperature at 3 p.m. (air 95°F)'],
        rows: [
          ['Fresh black asphalt', '152°F'],
          ['Older gray asphalt', '138°F'],
          ['Dark flat roof', '160°F'],
          ['Concrete sidewalk', '124°F'],
          ['Grass in full sun', '104°F'],
          ['Ground under a mature tree', '91°F'],
          ['White reflective roof', '108°F']
        ] } },

    { heading: 'Deciding where to start: the priority score', paras: [
      'With limited money, the city had to decide which blocks to cool first. Rather than leave the choice to the loudest voices at public meetings, the planning department built a simple scoring formula and published it, so that anyone could check why their block was or was not on the list.',
      'The score combines four things for every city block: how hot it gets, how far its tree cover falls short of the city\'s goal, how vulnerable its residents are, and how many people walk or wait for buses there. The weights were set after two rounds of public comment. An early draft gave heat alone half the weight; residents argued successfully that the people affected should count for more.' ],
      code: { lang: 'the city\'s published block priority formula', body: `# Each input is scaled from 0 (best in the city) to 1 (worst in the city).

heat        = scale(evening_air_temp)            # from the sensor network
canopy_gap  = scale(30% - tree_canopy_pct)       # how far below the 30% goal
vulnerable  = scale(share_65_plus_alone
                    + share_no_air_conditioning
                    + share_below_poverty_line)
foot_traffic = scale(daily_bus_boardings + pedestrian_count)

priority = 0.35 * heat
         + 0.25 * canopy_gap
         + 0.30 * vulnerable
         + 0.10 * foot_traffic

# Blocks are funded from the highest score down.
# Ties go to the block with more residents.` } },

    { heading: 'Strategy one: trees', paras: [
      'Trees were the centerpiece of the plan from the beginning, and the most popular part of it with residents. In early 2022 the city council approved a program called 10,000 Trees by 2030, with the goal of raising Eastgate\'s canopy from 8 percent to 20 percent and the citywide canopy from 24 percent to 30 percent.',
      'Trees have one big advantage and one big disadvantage. The advantage is that they cool the air and the ground at the same time, and they bring other benefits: cleaner air, less flooding, and streets that people simply like more. The disadvantage is time. A young street tree provides little shade for its first five to ten years. Every tree planted in 2022 is an investment in the summers of the 2030s.',
      'By the end of 2025, the program had planted 6,400 trees, about two thirds of them on the east side. Planting crews worked mostly in spring and autumn, when young trees are least stressed by heat.' ] },

    { heading: 'Choosing the right trees', paras: [
      'Not every tree survives on a hot city street. The forestry team chose species that tolerate drought, compacted soil, and road salt, and that grow broad crowns for shade. It also limited any single species to no more than one tenth of new plantings, so that one pest or disease could not wipe out a whole neighborhood\'s canopy, as Dutch elm disease did to many American cities in the twentieth century.',
      'After three years, survival rates varied widely between species. The table shows the five most planted species.' ],
      table: { headers: ['Species', 'Trees planted', 'Survival after 3 years', 'Mature shade', 'Notes'],
        rows: [
          ['Swamp white oak', '820', '91%', 'Large', 'Slow to start, very tough'],
          ['London planetree', '760', '88%', 'Large', 'Handles pollution well'],
          ['Honey locust (thornless)', '710', '84%', 'Medium', 'Light shade, fast growth'],
          ['Red maple', '640', '69%', 'Medium', 'Struggled in the driest summer'],
          ['Kentucky coffeetree', '590', '86%', 'Large', 'Few pests, late to leaf out']
        ] } },

    { heading: 'Why young trees die', paras: [
      'The biggest threat to a newly planted street tree is not disease or vandalism. It is thirst. A young tree needs about fifteen to twenty gallons of water a week during its first two summers, and city crews could not water thousands of trees on their own.',
      'The solution was a volunteer program called Tree Buddies. Residents could adopt a tree outside their home and receive a free watering bag that slowly releases water into the soil over several hours. By 2025, about 2,300 trees had a buddy. Those trees had a three-year survival rate of 89 percent, compared with 71 percent for trees without one.',
      'Across the whole program, the three-year survival rate was 81 percent. Foresters say that is good for city street trees, where losses of a quarter or more are common. Still, every lost tree is a lost decade of shade, and the city now replaces failed trees within one season.' ] },

    { heading: 'Strategy two: cool roofs', paras: [
      'Roofs cover about a fifth of the land in Millbrook, and most of them are dark. Coating a flat dark roof with a white or light-gray reflective layer is one of the fastest and cheapest ways to reduce heat, because it works on the first sunny day after it is applied.',
      'Between 2022 and 2025, the city coated the roofs of 312 buildings, starting with schools, libraries, public housing, and senior centers. Building owners on the east side could also apply for a free coating if they agreed to keep it maintained for ten years.',
      'Measured on hot afternoons, coated roofs were up to 50°F cooler at the surface than they had been before. Inside, the effect was smaller but noticeable: on the top floors of the coated public housing buildings, indoor temperatures fell by an average of 4°F during heat waves, and residents without air conditioning reported sleeping better. The main limitation is that cool roofs help the people inside the building far more than the people on the street below.' ] },

    { heading: 'Strategy three: cool pavement', paras: [
      'The most visible experiment was on the streets themselves. In 2023 the city coated 4.2 miles of residential streets in Eastgate with a light-gray reflective sealant, the same idea as a cool roof applied to asphalt.',
      'The coating worked as intended on the surface. Measured at 3 p.m., coated streets were 10 to 12°F cooler than nearby uncoated streets, and the difference lasted into the evening, when the pavement normally releases the heat it stored during the day. Figure 2 shows a typical day.',
      'The effect on air temperature was much smaller — less than 1°F at head height on most days — and it faded as the coating wore down under traffic. After two years, the coolest coated streets had lost about a third of their advantage.' ],
      image: { alt: 'Line chart of street surface temperature over a hot day; the coated street peaks around 140 degrees and the uncoated street around 152 degrees, with the gap continuing into the evening', caption: 'Figure 2. Street surface temperature on a hot day in August 2023: uncoated asphalt (red) vs. coated pilot street (gray).',
        svg: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="600" height="300" fill="#fff"/>
<line x1="60" y1="250" x2="570" y2="250" stroke="#aaa"/><line x1="60" y1="20" x2="60" y2="250" stroke="#aaa"/>
<line x1="60" y1="190" x2="570" y2="190" stroke="#eee"/><line x1="60" y1="130" x2="570" y2="130" stroke="#eee"/><line x1="60" y1="70" x2="570" y2="70" stroke="#eee"/>
<text x="52" y="254" text-anchor="end" font-size="10" fill="#777">80°F</text><text x="52" y="194" text-anchor="end" font-size="10" fill="#777">100°F</text><text x="52" y="134" text-anchor="end" font-size="10" fill="#777">120°F</text><text x="52" y="74" text-anchor="end" font-size="10" fill="#777">140°F</text><text x="52" y="34" text-anchor="end" font-size="10" fill="#777">°F</text>
<polyline fill="none" stroke="#d23b2e" stroke-width="3" points="60,214 124,190 188,124 252,70 316,34 380,46 444,106 508,160 570,190"/>
<polyline fill="none" stroke="#8c939c" stroke-width="3" points="60,220 124,202 188,148 252,103 316,70 380,82 444,136 508,184 570,208"/>
<text x="60" y="270" text-anchor="middle" font-size="10" fill="#777">6 am</text><text x="188" y="270" text-anchor="middle" font-size="10" fill="#777">10 am</text><text x="316" y="270" text-anchor="middle" font-size="10" fill="#777">2 pm</text><text x="444" y="270" text-anchor="middle" font-size="10" fill="#777">6 pm</text><text x="570" y="270" text-anchor="middle" font-size="10" fill="#777">10 pm</text>
<text x="330" y="28" font-size="11" fill="#b2302a">uncoated 152°F</text><text x="196" y="176" font-size="11" fill="#5f666e">coated 140°F</text>
<rect x="380" y="282" width="12" height="4" fill="#d23b2e"/><text x="398" y="288" font-size="10" fill="#333">uncoated asphalt</text>
<rect x="490" y="282" width="12" height="4" fill="#8c939c"/><text x="508" y="288" font-size="10" fill="#333">coated street</text>
</svg>` } },

    { heading: 'The glare problem', paras: [
      'Cool pavement had a side effect that the city had read about but underestimated. A light-colored street reflects sunlight upward, and some of that reflected sunlight lands on the people walking on it. On sunny afternoons, pedestrians on coated streets were exposed to more total heat than on dark streets, even though the pavement itself was cooler.',
      'Residents noticed. In a city survey of people living on the pilot streets, 38 percent said the street felt "brighter or glarier," and several older residents said they had to wear sunglasses to walk to the bus stop. Some drivers complained about glare at sunset.',
      'The city did not expand the pilot. Its 2025 report concluded that cool pavement makes sense in places where people drive or park but rarely walk, such as the far corners of parking lots, and that on streets where people walk, the money is better spent on shade. Some heat researchers outside the city have argued that the glare concerns were overstated and that the pilot ended too soon to judge it fairly.' ] },

    { heading: 'Strategy four: shading the parking lots', paras: [
      'Millbrook has a lot of parking. The city owns 23 surface parking lots, and on a summer afternoon a large asphalt lot is one of the hottest places in any city. In 2023, the city began covering its lots with solar canopies: tall steel frames with solar panels on top, which shade the cars and the pavement below while generating electricity.',
      'By 2025, canopies covered nine city lots, including the large lots at the Eastgate library and the transit center. Together they produce about 3.1 megawatts of electricity at peak, enough to cover most of the electricity used by city buildings on a sunny day. Surface temperatures under the canopies were 30 to 40°F lower than in the open parts of the same lots.',
      'The canopies were the most expensive single item in the program, but they are also the only part that pays money back. The electricity savings are expected to repay the city\'s share of the cost in about fourteen years.' ] },

    { heading: 'Shade at the bus stop', paras: [
      'One of the most useful lessons from the sensor data came from a simple question: where do people actually spend time outside on hot days? The answer, for many east side residents, was the bus stop. Fewer households in Eastgate own a car, and the average wait for a bus during the day was about eleven minutes.',
      'In 2022, only a third of Millbrook\'s bus stops had any kind of shelter, and many shelters were glass boxes that trapped heat. The city replaced or added 120 shelters with solid, light-colored roofs, open sides for airflow, and, at the busiest stops, a small tree planted beside them.',
      'Riders noticed this change faster than almost any other. In a 2024 survey, 71 percent of east side bus riders said waiting for the bus in summer had become "easier" or "much easier." The shelters cost about $14,000 each, a small amount compared with most of the program.' ] },

    { heading: 'Cooling centers and splash pads', paras: [
      'Trees and roofs take years to make a difference. To protect people during the heat waves that would come in the meantime, the city also changed how it ran cooling centers. Instead of two large centers, it designated eleven: all public libraries, two community centers, and a church hall in Eastgate whose congregation offered the space.',
      'The libraries now stay open until 10 p.m. on days when the forecast is above 95°F. The city also opened four splash pads in parks on the east side, which became extremely popular with families.',
      'The hardest part turned out to be getting the word out. In a 2023 survey, only 40 percent of east side residents knew where their nearest cooling center was. The city responded with door-to-door visits before the summer, a phone call system for older residents who signed up, and signs at every bus stop. By 2025, awareness had risen to 68 percent.' ] },

    { heading: 'The misting stations that didn\'t work', paras: [
      'Not every idea succeeded. In the summer of 2022, the city installed twelve misting stations in plazas and at busy bus stops. The stations spray a fine mist of water that evaporates and cools the air, a technique widely used in hot, dry cities.',
      'Millbrook is not a dry city. On humid summer days, the mist did not evaporate quickly; it simply made people and benches wet. The stations also needed daily maintenance to prevent clogged nozzles, and regular water testing to make sure bacteria could not grow in the pipes. Several were damaged within weeks.',
      'After one summer the city removed all twelve. The total cost, including removal, was about $210,000. The city\'s report was unusually frank about the failure, noting that the decision had been made quickly, under public pressure after the 2021 heat wave, and without checking whether the technique suited Millbrook\'s climate. The money would have bought about fifteen shaded bus shelters.' ] },

    { heading: 'What it cost', paras: [
      'The full program cost about $46 million over five years, from 2021 to 2025. The table breaks down the main items and gives a rough measure of value: how much each approach cost for every block or building where it lowered the peak temperature people experienced by at least 2°F.',
      'These comparisons are rough, and city staff warn against reading too much into them. Trees, in particular, look expensive today because their benefits arrive years later and will grow for decades.' ],
      table: { headers: ['Item', 'Total cost', 'Unit cost', 'Notes'],
        rows: [
          ['Tree planting and 3 years of care', '$11.2 million', 'about $1,750 per tree', 'Benefits grow for 40+ years'],
          ['Cool roofs (312 buildings)', '$6.8 million', 'about $1.80 per square foot', 'Fastest results indoors'],
          ['Cool pavement pilot (4.2 miles)', '$2.1 million', 'about $0.60 per square foot', 'Not expanded'],
          ['Solar parking canopies (9 lots)', '$17.9 million', 'about $5.8 million per megawatt', 'Repays itself in about 14 years'],
          ['Bus shelters (120)', '$1.7 million', 'about $14,000 each', 'Highest rider satisfaction'],
          ['Cooling centers and outreach', '$3.4 million', '—', 'Includes late library hours'],
          ['Sensor network and data portal', '$1.2 million', 'about $180 per sensor + staff', 'Used to guide everything else'],
          ['Misting stations (removed)', '$0.2 million', '—', 'Removed after one summer'],
          ['Planning and administration', '$1.5 million', '—', '']
        ] } },

    { heading: 'Who paid for it', paras: [
      'No city of Millbrook\'s size can find $46 million in its regular budget. The money came from four sources. A federal climate resilience grant covered the largest share. The city borrowed most of the rest through a bond approved by voters in November 2021, four months after the heat wave, by a margin of 64 to 36 percent. The local electric utility paid for part of the solar canopies in exchange for the electricity they produce, and two local foundations funded the Tree Buddies program and most of the outreach work.',
      'The federal grant runs out at the end of 2026. Several council members have warned that keeping the program going after that will mean difficult choices, especially for the cost of caring for young trees.' ],
      image: { alt: 'Horizontal stacked bar showing the 46 million dollar program funded 40 percent by a federal grant, 35 percent by a city bond, 15 percent by the utility partnership, and 10 percent by local foundations', caption: 'Figure 3. Sources of the $46 million program budget, 2021–2025.',
        svg: `<svg viewBox="0 0 600 170" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="600" height="170" fill="#fff"/>
<text x="30" y="30" font-size="13" font-weight="700" fill="#333">$46 million, by source</text>
<rect x="30" y="48" width="216" height="46" fill="#2f6db5"/><text x="138" y="76" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">40%</text>
<rect x="246" y="48" width="189" height="46" fill="#5f97d6"/><text x="340" y="76" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">35%</text>
<rect x="435" y="48" width="81" height="46" fill="#e6a23c"/><text x="475" y="76" text-anchor="middle" font-size="14" fill="#fff" font-weight="700">15%</text>
<rect x="516" y="48" width="54" height="46" fill="#3fa36b"/><text x="543" y="76" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">10%</text>
<rect x="30" y="118" width="12" height="12" fill="#2f6db5"/><text x="48" y="128" font-size="11" fill="#333">Federal grant · $18.4M</text>
<rect x="260" y="118" width="12" height="12" fill="#5f97d6"/><text x="278" y="128" font-size="11" fill="#333">City bond · $16.1M</text>
<rect x="30" y="142" width="12" height="12" fill="#e6a23c"/><text x="48" y="152" font-size="11" fill="#333">Utility partnership · $6.9M</text>
<rect x="260" y="142" width="12" height="12" fill="#3fa36b"/><text x="278" y="152" font-size="11" fill="#333">Foundations · $4.6M</text>
</svg>` } },

    { heading: 'What residents say', paras: [
      'Numbers tell part of the story. The people living in the hottest blocks tell the rest. Over the four years, the city held more than forty community meetings, and reporters for this article spoke with residents in each of the four neighborhoods in the comparison table.',
      'Gloria Esposito, 78, has lived on the same Eastgate street since 1971. "When they planted the trees, I thought, I won\'t live to see them big," she said. "But the bus stop roof, that I use every week. And the library being open late, I go there in the evening now when the apartment gets too hot."',
      'Others were more skeptical. Tomás Reyes, who runs a small auto repair shop near the rail yard, said the program felt like it was designed for homeowners. "My guys work outside all day. A tree in five years doesn\'t help them this August," he said. The city has since started a small grant program for shade structures at outdoor workplaces, though it has funded only a handful so far.',
      'In Linden Park, the reaction was mostly indifference. Several residents said they had not noticed any changes, which is roughly what the plan intended: almost none of the money was spent there.' ] },

    { heading: 'The gentrification question', paras: [
      'Greener, cooler streets make a neighborhood more pleasant to live in. They can also make it more expensive. Researchers in several cities have documented a pattern sometimes called "green gentrification," in which new parks and trees attract wealthier buyers, raise rents, and push out the long-time residents the improvements were meant to help.',
      'Some Eastgate residents raised this concern at the very first public meetings. In response, the city paired the heat program with a set of housing measures on the east side: a property tax freeze for long-time homeowners over 65, funding for a nonprofit to buy and keep apartment buildings affordable, and a rule that coated public housing would stay public.',
      'It is too early to know whether these measures are enough. Median rents in Eastgate rose 19 percent between 2021 and 2025, faster than the citywide rise of 14 percent. City economists say it is impossible to separate the effect of the heat program from a broader housing shortage across the region. Housing advocates say the gap is a warning sign that deserves close attention.' ] },

    { heading: 'Did it work? Health outcomes', paras: [
      'The goal of the whole program was to protect health, and the most direct measure is the number of people who needed emergency care for heat illness. That number has fallen every year since 2021.',
      'The comparison is not simple, because no two summers are alike. 2021 had the worst heat wave on record. The summers since have been hot, but none had a heat wave as long. To make a fairer comparison, city epidemiologists also counted emergency visits per hot day — a day with a high of 95°F or more. By that measure, visits fell from about 12 per hot day in 2021 to about 6 per hot day in 2025.' ],
      image: { alt: 'Bar chart of heat-related emergency visits by year: 214 in 2021, 176 in 2022, 158 in 2023, 149 in 2024, and 131 in 2025', caption: 'Figure 4. Heat-related emergency department visits in Millbrook, by summer.',
        svg: `<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg" font-family="sans-serif">
<rect width="600" height="280" fill="#fff"/>
<line x1="60" y1="230" x2="560" y2="230" stroke="#aaa"/><line x1="60" y1="20" x2="60" y2="230" stroke="#aaa"/>
<line x1="60" y1="130" x2="560" y2="130" stroke="#eee"/><line x1="60" y1="30" x2="560" y2="30" stroke="#eee"/>
<text x="52" y="234" text-anchor="end" font-size="10" fill="#777">0</text><text x="52" y="134" text-anchor="end" font-size="10" fill="#777">100</text><text x="52" y="34" text-anchor="end" font-size="10" fill="#777">200</text>
<rect x="90" y="16" width="60" height="214" fill="#c9473a"/><text x="120" y="12" text-anchor="middle" font-size="11" fill="#333">214</text><text x="120" y="248" text-anchor="middle" font-size="11" fill="#333">2021</text>
<rect x="190" y="54" width="60" height="176" fill="#d9786b"/><text x="220" y="49" text-anchor="middle" font-size="11" fill="#333">176</text><text x="220" y="248" text-anchor="middle" font-size="11" fill="#333">2022</text>
<rect x="290" y="72" width="60" height="158" fill="#e09a8f"/><text x="320" y="67" text-anchor="middle" font-size="11" fill="#333">158</text><text x="320" y="248" text-anchor="middle" font-size="11" fill="#333">2023</text>
<rect x="390" y="81" width="60" height="149" fill="#e6aea5"/><text x="420" y="76" text-anchor="middle" font-size="11" fill="#333">149</text><text x="420" y="248" text-anchor="middle" font-size="11" fill="#333">2024</text>
<rect x="490" y="99" width="60" height="131" fill="#ecc1ba"/><text x="520" y="94" text-anchor="middle" font-size="11" fill="#333">131</text><text x="520" y="248" text-anchor="middle" font-size="11" fill="#333">2025</text>
<text x="310" y="272" text-anchor="middle" font-size="10" fill="#777">summer (June to September)</text>
</svg>` } },

    { heading: 'Why the health numbers are hard to read', paras: [
      'Even the per-hot-day measure cannot prove that the program caused the decline. Several other things changed at the same time. More households bought air conditioners after 2021. The regional hospital started a text message warning service. And public awareness of heat risk rose sharply after the deaths in 2021, which may have changed how people behaved during later heat waves.',
      'Dr. Okafor, who has since moved to a university research post, is careful about the claim. "I think the cooling centers and the outreach clearly saved people in the short term, because we can see who used them," she said. "The trees and the roofs, honestly, we will only know in ten years."',
      'An independent evaluation by researchers at the state university is expected in 2027. It will compare Millbrook with three similar cities that did not run heat programs, which is the kind of comparison needed to separate the program\'s effect from everything else.' ] },

    { heading: 'Program timeline', paras: [
      'The program moved quickly by the usual standards of city government, largely because the 2021 heat wave created strong public support. The main milestones are listed below.' ],
      table: { headers: ['Date', 'Milestone'],
        rows: [
          ['July 2021', 'Eleven-day heat wave; 214 emergency visits and three deaths'],
          ['November 2021', 'Voters approve the heat resilience bond, 64% to 36%'],
          ['February 2022', 'Council adopts 10,000 Trees by 2030'],
          ['April 2022', '140 street sensors installed; public data portal opens'],
          ['Summer 2022', 'First heat map; misting stations installed (removed that autumn)'],
          ['January 2023', 'Block priority formula published after public comment'],
          ['Summer 2023', 'Cool pavement pilot on 4.2 miles of Eastgate streets'],
          ['2023–2025', 'Solar canopies built on nine city parking lots'],
          ['2024', '120 new bus shelters completed'],
          ['December 2025', '6,400 trees planted; 312 roofs coated; five-year report published'],
          ['End of 2026', 'Federal grant funding ends']
        ] } },

    { heading: 'Lessons for other cities', paras: [
      'City officials, researchers, and residents interviewed for this article pointed to the same handful of lessons.',
      'First, measure before spending. The sensor network cost less than 3 percent of the program but shaped every decision that followed, and it showed that the official weather station badly understated the heat where people live.',
      'Second, put the formula in public. Publishing the priority score turned arguments about fairness into arguments about specific weights, which were easier to settle.',
      'Third, combine fast and slow measures. Trees are the long-term answer, but they do nothing for the next five summers. Cooling centers, shelters, and cool roofs protect people in the meantime.',
      'Fourth, test locally before scaling. The misting stations and, to a lesser degree, the cool pavement pilot showed that a technique that works in one climate or one city may fail in another.',
      'Fifth, plan for the people as well as the temperature. The housing measures were not originally part of the heat program, and several residents said they were the reason they trusted it at all.' ] },

    { heading: 'What comes next', paras: [
      'The city\'s plan for 2026 to 2030 is more modest than the first five years, mainly because the federal money is ending. The priorities are to keep the young trees alive, plant the remaining 3,600 trees of the 10,000 goal, extend cool roofs to private apartment buildings through a loan program, and add shade to the 40 busiest bus stops that still lack it.',
      'The city is also preparing for the possibility of a heat wave worse than 2021. Climate projections for the region suggest that summers like 2021 could become several times more common by the 2040s. The emergency plan now includes backup power for the eleven cooling centers and a list of residents who depend on electrically powered medical equipment.',
      'In Eastgate, the swamp white oaks planted in the spring of 2022 are now taller than the bus shelters beside them. They are still years away from shading the street. But on a hot afternoon this past August, a small patch of shade under one of them held a bench, two people waiting for the number 14 bus, and a dog asleep on the cool ground.' ] },

    { heading: 'About this article', paras: [
      'This article is fictional. Millbrook, its neighborhoods, the people quoted, and all figures, tables, and data in it were invented for a research study about reading and navigating long pages. Any resemblance to a real city or person is coincidental.',
      'The general ideas it describes — urban heat islands, the cooling effect of trees, reflective roofs and pavement, and the challenges of measuring health outcomes — reflect real topics in urban planning and public health, but the specific numbers should not be used as a source.' ] }
  ]
};
