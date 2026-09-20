/** Public F1 safety milestones. Language is operational, not graphic. */

export type SafetyEvent = {
  year: string;
  title: string;
  place: string;
  summary: string;
  change: string;
};

export const BIANCHI_2014 = {
  date: "5 October 2014",
  place: "Japanese Grand Prix, Suzuka",
  driver: "Jules Bianchi",
  died: "17 July 2015",
  report: "https://www.fia.com/news/accident-panel",
};

export const SAFETY_EVENTS: SafetyEvent[] = [
  {
    year: "1960s–70s",
    title: "Drivers force the medical era",
    place: "Jackie Stewart and the GPDA",
    summary:
      "After a run of fatal accidents, Stewart and colleagues pushed for barriers, runoff, and a proper medical response instead of treating injury as part of the show.",
    change: "Guardrails, better circuits, and on-site medical cover became expected, not optional.",
  },
  {
    year: "1994",
    title: "Imola rewrites the rulebook",
    place: "San Marino Grand Prix",
    summary:
      "Roland Ratzenberger and Ayrton Senna died on consecutive days. Formula 1’s survival-cell, barrier, and cockpit standards were rebuilt in the years that followed.",
    change: "Circuit redesigns, raised cockpit sides, crash structures, and the path to the HANS device (mandatory in 2003).",
  },
  {
    year: "2009",
    title: "Head protection becomes urgent",
    place: "Hungary and Formula 2",
    summary:
      "Felipe Massa was struck by debris at the Hungarian Grand Prix. Henry Surtees was killed by a loose wheel in Formula 2. Open cockpits were no longer treated as untouchable.",
    change: "Cockpit-side tests got tougher; research began that later produced the halo.",
  },
  {
    year: "2014",
    title: "Wet weather, a recovery vehicle, and Suzuka",
    place: "Japanese Grand Prix",
    summary:
      "Jules Bianchi lost control in the wet under double yellows and struck a crane recovering Adrian Sutil’s car. He died from his injuries the following July — the last Formula 1 grand prix accident to claim a driver’s life.",
    change:
      "The FIA accident panel’s main operational fix was an enforceable speed limit in yellow-flag zones: the Virtual Safety Car, introduced in 2015. It also pushed wet-tyre testing, drainage, and a daylight start-time guideline.",
  },
  {
    year: "2018",
    title: "Halo becomes mandatory",
    place: "All FIA Formula 1 cars",
    summary:
      "The titanium halo was unpopular on looks. It came from a longer cockpit-protection programme, not as a retrofit for the 2014 crane impact — the FIA said that specific collision was beyond what a halo could absorb.",
    change: "Head protection against debris, other cars, and barriers. First clear save: Charles Leclerc, Spa 2018.",
  },
  {
    year: "2020",
    title: "Grosjean walks out of the fire",
    place: "Bahrain Grand Prix",
    summary:
      "Romain Grosjean’s Haas split the barrier and caught fire. The halo and survival cell kept a path out of the cockpit. He later said that without the halo he would not have been there to talk.",
    change: "Halo accepted as essential. Barrier and fuel-system reviews continued.",
  },
  {
    year: "2022",
    title: "Halo at Silverstone",
    place: "British Grand Prix",
    summary:
      "Zhou Guanyu’s Alfa Romeo flipped at the start. The roll hoop failed; the halo kept his head off the ground as the car slid inverted into the gravel and fence. He walked away.",
    change: "Roll-hoop tests were strengthened. The lesson sits on this circuit: hardware is what saves people, not a weather chart.",
  },
];
