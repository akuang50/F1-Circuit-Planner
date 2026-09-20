import type { TrackPoint } from "@/lib/trackGeometry";

export type ClimateFamily =
  | "maritime"
  | "alpine"
  | "continental"
  | "mediterranean"
  | "desert"
  | "tropical"
  | "subtropical"
  | "high-altitude";

export type WetTendency = "rare" | "occasional" | "frequent" | "seasonal-storms";

export type CircuitGuide = {
  id: string;
  direction: "clockwise" | "anticlockwise";
  lengthKm: number;
  altitudeM: number;
  climateFamily: ClimateFamily;
  wetTendency: WetTendency;
  stormMonths: number[];
  typicalSlicks: [number, number];
  energy: "low" | "medium" | "high";
  surface: "abrasive" | "smooth-street" | "mixed" | "green";
  points: TrackPoint[];
  terrainCopy: string;
  weatherCopy: string;
  tireCopy: string;
};

const GUIDES: CircuitGuide[] = [
  {
    id: "albert-park",
    direction: "clockwise",
    lengthKm: 5.28,
    altitudeM: 12,
    climateFamily: "subtropical",
    wetTendency: "occasional",
    stormMonths: [3, 4, 10],
    typicalSlicks: [3, 5],
    energy: "medium",
    surface: "smooth-street",
    points: [
      { x: 180, y: 228, elev: 12, name: "Start/finish" },
      { x: 250, y: 236, elev: 11 },
      { x: 330, y: 228, elev: 10, name: "T1" },
      { x: 400, y: 200, elev: 10 },
      { x: 445, y: 150, elev: 11, name: "Lakeside" },
      { x: 430, y: 95, elev: 13 },
      { x: 360, y: 58, elev: 14 },
      { x: 270, y: 48, elev: 14 },
      { x: 185, y: 62, elev: 13, name: "T11" },
      { x: 115, y: 105, elev: 12 },
      { x: 85, y: 160, elev: 11, name: "Lakeside dip" },
      { x: 110, y: 205, elev: 12 },
    ],
    terrainCopy:
      "Parkland around a lake, almost no climb. The racing line sits a few metres above the water; drainage is decent but painted lines and the lake-side kerbs go greasy first.",
    weatherCopy:
      "Melbourne in March is early autumn: cool air, a passing front more often than a monsoon. NOAA rain flags at this station are patchy — treat a 100% rain month as a data quirk, not a forecast.",
    tireCopy:
      "Smooth park asphalt wants the softer dry set (typically C3–C5). A shower turns the painted run-off into a crossover problem; intermediates cover the usual Melbourne sprinkle, full wets only if the lake-side dips stand water.",
  },
  {
    id: "shanghai",
    direction: "clockwise",
    lengthKm: 5.45,
    altitudeM: 5,
    climateFamily: "subtropical",
    wetTendency: "occasional",
    stormMonths: [3, 4, 5, 6],
    typicalSlicks: [2, 4],
    energy: "medium",
    surface: "abrasive",
    points: [
      { x: 210, y: 242, elev: 5, name: "Start/finish" },
      { x: 150, y: 200, elev: 5, name: "T1 snail" },
      { x: 125, y: 145, elev: 6 },
      { x: 165, y: 110, elev: 6 },
      { x: 215, y: 125, elev: 5 },
      { x: 225, y: 175, elev: 5 },
      { x: 195, y: 188, elev: 5 },
      { x: 255, y: 150, elev: 6 },
      { x: 310, y: 85, elev: 7, name: "Hairpin" },
      { x: 400, y: 70, elev: 6 },
      { x: 460, y: 130, elev: 5 },
      { x: 445, y: 210, elev: 5, name: "Back straight" },
      { x: 330, y: 250, elev: 5 },
    ],
    terrainCopy:
      "Reclaimed flat land. The snail (T1–T4) is a tightening left with almost no elevation; the 1.2 km back straight is the only place wind really shows.",
    weatherCopy:
      "March is cool and damp in the Yangtze delta. ISD precipitation is often missing here; visibility and gusts are the more honest NOAA fields. Spring drizzle plus a long straight is a rear-tyre temperature problem.",
    tireCopy:
      "Abrasive surface and a heavy T1–T4 load usually point to C2–C4. If the air stays cool, C3 is the workhorse. Intermediates for drizzle on the snail — the back straight dries first and tempts a crossover too early.",
  },
  {
    id: "suzuka",
    direction: "clockwise",
    lengthKm: 5.81,
    altitudeM: 45,
    climateFamily: "maritime",
    wetTendency: "frequent",
    stormMonths: [3, 4, 9, 10],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 305, y: 172, elev: 45, name: "Start/finish" },
      { x: 375, y: 158, elev: 48, name: "First corner" },
      { x: 430, y: 118, elev: 50, name: "S-curves" },
      { x: 445, y: 68, elev: 42 },
      { x: 385, y: 48, elev: 34, name: "Degner" },
      { x: 315, y: 78, elev: 30 },
      { x: 245, y: 98, elev: 28, name: "Hairpin" },
      { x: 165, y: 72, elev: 32 },
      { x: 95, y: 95, elev: 38, name: "Spoon" },
      { x: 68, y: 148, elev: 42 },
      { x: 92, y: 198, elev: 46, name: "130R" },
      { x: 175, y: 228, elev: 44 },
      { x: 245, y: 205, elev: 43, name: "Casio" },
      { x: 275, y: 182, elev: 44 },
    ],
    terrainCopy:
      "Figure-8 over a hill. Degner drops you downhill; Spoon and 130R sit higher. Rain does not fall evenly: the crossover under the bridge and the trees at Degner stay wet after the start-finish has dried.",
    weatherCopy:
      "March (and the old October slot) sits in a wet maritime pattern. NOAA rain here can read extremely high because of how ISD codes precipitation — use it as “often damp”, not as a percentage of race distance. 2014 is why this app exists: recovery vehicles and spray do not mix.",
    tireCopy:
      "High-energy corners want the harder dry set (C1–C3) when it is actually dry. The moment the S-curves film over, intermediates are the car. Full wets if Degner or Casio is standing water — that is a rivers-across-the-road problem, not a compound-choice puzzle.",
  },
  {
    id: "bahrain",
    direction: "clockwise",
    lengthKm: 5.41,
    altitudeM: 7,
    climateFamily: "desert",
    wetTendency: "rare",
    stormMonths: [],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 100, y: 232, elev: 7, name: "Start/finish" },
      { x: 210, y: 226, elev: 8 },
      { x: 295, y: 195, elev: 10, name: "T1" },
      { x: 335, y: 140, elev: 12 },
      { x: 300, y: 85, elev: 14, name: "Desert rise" },
      { x: 210, y: 58, elev: 13, name: "Outer loop" },
      { x: 120, y: 72, elev: 11 },
      { x: 70, y: 125, elev: 9 },
      { x: 78, y: 185, elev: 8, name: "T10" },
    ],
    terrainCopy:
      "Sand-blown plateau with a few metres of rise into the outer loop. Wind, not hills, is the terrain: gusts move sand onto the racing line and strip temperature from the front axle.",
    weatherCopy:
      "March nights are cool; the day is already hot by Gulf standards. NOAA rain is usually missing or near zero — that is real. Heat and gust probability are the fields that matter. Later calendar slots (when Bahrain has been a night race) still cook the track after sunset.",
    tireCopy:
      "Abrasive, high-energy, almost never wet: C1–C3, often with C1 as the race tyre. Sand on the surface acts like marbles. Rain tyres stay in the truck unless a freak shamal actually wets the desert.",
  },
  {
    id: "jeddah",
    direction: "clockwise",
    lengthKm: 6.17,
    altitudeM: 12,
    climateFamily: "desert",
    wetTendency: "rare",
    stormMonths: [11, 12],
    typicalSlicks: [2, 4],
    energy: "medium",
    surface: "smooth-street",
    points: [
      { x: 70, y: 240, elev: 12, name: "Start/finish" },
      { x: 140, y: 232, elev: 12 },
      { x: 230, y: 210, elev: 11 },
      { x: 320, y: 170, elev: 11 },
      { x: 400, y: 120, elev: 12 },
      { x: 455, y: 75, elev: 13, name: "Corniche" },
      { x: 420, y: 48, elev: 12 },
      { x: 340, y: 55, elev: 11 },
      { x: 250, y: 90, elev: 11 },
      { x: 170, y: 140, elev: 12 },
      { x: 110, y: 185, elev: 12 },
      { x: 75, y: 215, elev: 12 },
    ],
    terrainCopy:
      "A long, fast street ribbon along the Red Sea wall. Elevation change is tiny; walls are the terrain. Sea breeze funnels down the corniche and unsettles the car in the 250 km/h sweepers.",
    weatherCopy:
      "April on the Red Sea is hot and dry. NOAA heat probability is high; rain is a rarity (a late-autumn shower is the exception). Night racing knocks a few degrees off the asphalt but not enough to make this a wet-tyre conversation.",
    tireCopy:
      "Smooth street asphalt plus lots of long-radius load: C2–C4, with the soft end for qualifying. Intermediates are a contingency for a freak shower on polished paint. Full wets would be historic.",
  },
  {
    id: "miami",
    direction: "anticlockwise",
    lengthKm: 5.41,
    altitudeM: 3,
    climateFamily: "tropical",
    wetTendency: "seasonal-storms",
    stormMonths: [5, 6, 7, 8, 9],
    typicalSlicks: [3, 5],
    energy: "medium",
    surface: "smooth-street",
    points: [
      { x: 90, y: 210, elev: 3, name: "Start/finish" },
      { x: 170, y: 200, elev: 3 },
      { x: 250, y: 170, elev: 4, name: "Marina" },
      { x: 300, y: 120, elev: 4 },
      { x: 280, y: 70, elev: 5 },
      { x: 210, y: 55, elev: 5, name: "Stadium" },
      { x: 140, y: 70, elev: 4 },
      { x: 95, y: 115, elev: 3 },
      { x: 110, y: 165, elev: 3 },
      { x: 360, y: 200, elev: 3 },
      { x: 430, y: 170, elev: 3 },
      { x: 450, y: 110, elev: 4 },
      { x: 400, y: 60, elev: 4 },
      { x: 330, y: 230, elev: 3 },
    ],
    terrainCopy:
      "Parking lot and marina around a stadium bowl — pancake flat. The “terrain” is drainage: tropical rain overwhelms the street grades and leaves lakes at the marina hairpin.",
    weatherCopy:
      "May is the start of Florida’s wet season. NOAA rain around 10–20% of hours is plausible convective weather, not a monsoon percentage. Heat and humidity are the everyday story; a late-afternoon cell is the weekend risk.",
    tireCopy:
      "Smooth, relatively low-energy street: C3–C5 when dry. A Miami shower is often short and violent — intermediates for the film, full wets if the marina end is standing. The dry line returns in minutes; that is a crossover, not a two-stop wet race.",
  },
  {
    id: "imola",
    direction: "anticlockwise",
    lengthKm: 4.91,
    altitudeM: 49,
    climateFamily: "mediterranean",
    wetTendency: "occasional",
    stormMonths: [4, 5, 9, 10],
    typicalSlicks: [2, 4],
    energy: "high",
    surface: "mixed",
    points: [
      { x: 80, y: 170, elev: 40, name: "Start/finish" },
      { x: 150, y: 155, elev: 42, name: "Tamburello" },
      { x: 230, y: 140, elev: 48 },
      { x: 300, y: 100, elev: 62, name: "Tosa" },
      { x: 350, y: 70, elev: 72, name: "Piratella" },
      { x: 420, y: 90, elev: 78 },
      { x: 450, y: 140, elev: 70, name: "Acque Minerali" },
      { x: 410, y: 190, elev: 58 },
      { x: 340, y: 230, elev: 50, name: "Variante Alta" },
      { x: 240, y: 245, elev: 45 },
      { x: 150, y: 230, elev: 42, name: "Rivazza" },
      { x: 90, y: 200, elev: 40 },
    ],
    terrainCopy:
      "A parkland ribbon with a real hill: Tosa to Piratella climbs, Acque Minerali drops you into a hollow, Rivazza is a downhill braking zone. That hollow holds water.",
    weatherCopy:
      "May in Emilia-Romagna is showery. This station’s ISD rain field is often empty — don’t read 0% as a dry circuit. Spring storms still sweep the Santerno valley. Autumn returns (when Imola has been a late race) are greasier still.",
    tireCopy:
      "Old-school energy and mixed asphalt: C2–C4. Damp Acque Minerali while the pit straight is dry is a classic intermediate call. Full wets if the park trees are dripping into the hollows.",
  },
  {
    id: "monaco",
    direction: "clockwise",
    lengthKm: 3.34,
    altitudeM: 7,
    climateFamily: "mediterranean",
    wetTendency: "occasional",
    stormMonths: [4, 5, 6],
    typicalSlicks: [3, 5],
    energy: "low",
    surface: "smooth-street",
    points: [
      { x: 210, y: 218, elev: 6, name: "Start/finish" },
      { x: 300, y: 210, elev: 8, name: "Ste Devote" },
      { x: 335, y: 145, elev: 28, name: "Beau Rivage" },
      { x: 300, y: 78, elev: 42, name: "Casino" },
      { x: 235, y: 62, elev: 38 },
      { x: 185, y: 88, elev: 30, name: "Mirabeau" },
      { x: 155, y: 120, elev: 22, name: "Hairpin" },
      { x: 145, y: 160, elev: 12, name: "Portier" },
      { x: 175, y: 188, elev: 8, name: "Tunnel" },
      { x: 230, y: 205, elev: 6, name: "Chicane" },
      { x: 280, y: 228, elev: 5, name: "Piscine" },
      { x: 220, y: 252, elev: 5, name: "Rascasse" },
      { x: 165, y: 238, elev: 6 },
    ],
    terrainCopy:
      "The only street hill that really matters: Beau Rivage up to Casino, then a drop to the harbour and a tunnel that is always drier than the swimming pool. Painted lines at the Piscine and Rascasse are ice when damp.",
    weatherCopy:
      "June is the driest Monaco month in this NOAA record (~10% of hours). April and May are wetter. A harbour shower can soak the swimming pool while the tunnel is bone dry — that split is the whole tyre problem.",
    tireCopy:
      "Lowest energy on the calendar, polished street: C4–C5, sometimes C3 if it is hot. Intermediates the moment Ste Devote is damp. Full wets if the harbour end is standing — you cannot see the dry line around Rascasse.",
  },
  {
    id: "montreal",
    direction: "clockwise",
    lengthKm: 4.36,
    altitudeM: 13,
    climateFamily: "continental",
    wetTendency: "frequent",
    stormMonths: [5, 6, 7, 8, 9],
    typicalSlicks: [3, 5],
    energy: "medium",
    surface: "smooth-street",
    points: [
      { x: 90, y: 200, elev: 13, name: "Start/finish" },
      { x: 170, y: 185, elev: 13 },
      { x: 250, y: 150, elev: 12, name: "Senes" },
      { x: 320, y: 110, elev: 12 },
      { x: 390, y: 80, elev: 11 },
      { x: 450, y: 90, elev: 11, name: "Hairpin" },
      { x: 430, y: 150, elev: 12 },
      { x: 360, y: 200, elev: 13 },
      { x: 280, y: 235, elev: 13, name: "Casino" },
      { x: 180, y: 245, elev: 14, name: "Wall of Champions" },
      { x: 100, y: 225, elev: 13 },
    ],
    terrainCopy:
      "A man-made island in the St Lawrence. Almost flat, but the river is right there: spray, wind, and a surface that never really gets hot. The Wall of Champions is a braking zone onto a bump, not a hill.",
    weatherCopy:
      "June can do anything. This station’s ISD rain flag is stuck on — read it as “wet climate”, not 100% of hours. Cool, unstable continental air is the point: a dry FP1 and a soaked race are normal, not a data error.",
    tireCopy:
      "Low thermal energy, smooth island asphalt: C3–C5, and they still struggle to get into the window on a cool afternoon. Intermediates are a frequent Sunday tyre. Full wets when the hairpin lakes — the river does not drain through the island.",
  },
  {
    id: "barcelona",
    direction: "clockwise",
    lengthKm: 4.66,
    altitudeM: 109,
    climateFamily: "mediterranean",
    wetTendency: "occasional",
    stormMonths: [4, 5, 9, 10],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 90, y: 200, elev: 109, name: "Start/finish" },
      { x: 200, y: 195, elev: 112 },
      { x: 300, y: 170, elev: 125, name: "Campsa" },
      { x: 360, y: 120, elev: 135 },
      { x: 340, y: 70, elev: 140, name: "Stadium" },
      { x: 250, y: 55, elev: 138 },
      { x: 160, y: 70, elev: 130 },
      { x: 90, y: 110, elev: 120, name: "Repsol" },
      { x: 70, y: 160, elev: 112 },
      { x: 420, y: 210, elev: 115 },
      { x: 380, y: 250, elev: 110 },
      { x: 200, y: 250, elev: 109 },
    ],
    terrainCopy:
      "A hill next to the Montmeló ridge. The stadium section sits higher than the pit straight; Campsa is a crest. Wind over that ridge is more important than the 30 m of climb.",
    weatherCopy:
      "June is warm and usually dry enough for slicks all weekend, but this NOAA record still shows rain in a surprising share of hours — likely a wet-sensor bias. Heat probability (~40%) is the more useful number: the track cooks the left-front.",
    tireCopy:
      "Abrasive, high-energy, a known tyre killer: C1–C3. Rain would want intermediates in the stadium while the main straight dries. Do not take a 60% ISD rain reading as a wet-race prediction.",
  },
  {
    id: "red-bull-ring",
    direction: "clockwise",
    lengthKm: 4.32,
    altitudeM: 678,
    climateFamily: "alpine",
    wetTendency: "frequent",
    stormMonths: [5, 6, 7, 8],
    typicalSlicks: [2, 4],
    energy: "medium",
    surface: "mixed",
    points: [
      { x: 80, y: 220, elev: 720, name: "Start/finish" },
      { x: 180, y: 230, elev: 700 },
      { x: 280, y: 210, elev: 675, name: "Remus" },
      { x: 340, y: 160, elev: 660 },
      { x: 300, y: 100, elev: 678, name: "Schlossgold" },
      { x: 210, y: 70, elev: 710 },
      { x: 120, y: 90, elev: 735, name: "Rindt" },
      { x: 70, y: 150, elev: 730 },
    ],
    terrainCopy:
      "A Styrian hillside. The pit straight is the high point; Remus dumps you downhill; the climb back to Rindt is a power-unit test. About 70 m of change on a short lap — rain at the bottom is not rain at the top.",
    weatherCopy:
      "June/July alpine convection: sun, then a cell over the mountain, then sun. NOAA rain ~50% of hours is in the right neighbourhood. Wind over the ridge is a constant. A dry qualifying and a soaked race start is the local special.",
    tireCopy:
      "Short lap, mixed surface, big aero load in T1: C2–C4. Intermediates whenever the valley fogs while the pit wall is dry. Full wets if Remus is a river — that downhill braking zone is where standing water sits.",
  },
  {
    id: "silverstone",
    direction: "clockwise",
    lengthKm: 5.89,
    altitudeM: 153,
    climateFamily: "maritime",
    wetTendency: "frequent",
    stormMonths: [6, 7, 8],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 185, y: 225, elev: 153, name: "Start/finish" },
      { x: 130, y: 210, elev: 152, name: "Abbey" },
      { x: 80, y: 175, elev: 150, name: "Village" },
      { x: 70, y: 125, elev: 148, name: "The Loop" },
      { x: 125, y: 95, elev: 150 },
      { x: 190, y: 85, elev: 152, name: "Brooklands" },
      { x: 250, y: 68, elev: 155, name: "Copse" },
      { x: 315, y: 52, elev: 156, name: "Maggots" },
      { x: 365, y: 62, elev: 155, name: "Becketts" },
      { x: 405, y: 95, elev: 154, name: "Chapel" },
      { x: 455, y: 155, elev: 152 },
      { x: 450, y: 205, elev: 150, name: "Stowe" },
      { x: 390, y: 235, elev: 149, name: "Vale" },
      { x: 295, y: 242, elev: 151, name: "Club" },
    ],
    terrainCopy:
      "An airfield plateau. Only ~10–15 m of roll, but that is enough: Vale is a dip that holds water, Maggots–Becketts is exposed to wind, and Club sits slightly higher and dries first.",
    weatherCopy:
      "July in Northamptonshire is the definition of maritime volatility. NOAA rain ~33% of hours and a HIGH volatility label are the honest picture: showers moving through, not a tropical dump. Wind across the old runways is the other tyre cooler.",
    tireCopy:
      "Very high energy, abrasive: C1–C3 when dry. A Silverstone shower is an intermediate race more often than a wet one — unless Vale is standing, in which case the dip is a full-wet corner while Copse is still a slick.",
  },
  {
    id: "spa",
    direction: "clockwise",
    lengthKm: 7.00,
    altitudeM: 401,
    climateFamily: "maritime",
    wetTendency: "frequent",
    stormMonths: [5, 6, 7, 8, 9],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "mixed",
    points: [
      { x: 95, y: 70, elev: 460, name: "La Source" },
      { x: 115, y: 125, elev: 420 },
      { x: 125, y: 175, elev: 370, name: "Eau Rouge" },
      { x: 155, y: 115, elev: 455, name: "Raidillon" },
      { x: 280, y: 68, elev: 465, name: "Kemmel" },
      { x: 370, y: 85, elev: 450, name: "Les Combes" },
      { x: 410, y: 140, elev: 410, name: "Rivage" },
      { x: 375, y: 195, elev: 380, name: "Pouhon" },
      { x: 300, y: 235, elev: 365, name: "Fagnes" },
      { x: 210, y: 250, elev: 360, name: "Stavelot" },
      { x: 120, y: 220, elev: 375, name: "Blanchimont" },
      { x: 75, y: 150, elev: 420, name: "Bus Stop" },
    ],
    terrainCopy:
      "The textbook elevation lap: ~100 m from the foot of Eau Rouge to Kemmel. Raidillon is a wall. Pouhon through Blanchimont sits in trees and stays wet. One sector can be dry tarmac while another is a river.",
    weatherCopy:
      "Ardennes July: NOAA rain around half of hours, which matches the folklore. Microclimate is the whole story — the pit straight and Les Combes often disagree. This is why intermediates exist.",
    tireCopy:
      "High-speed, high-energy: C1–C3 in the dry. If Eau Rouge is wet and Kemmel is dry, that is intermediates, not a mixed slick. Full wets when the treeline from Pouhon to Blanchimont is standing water — you cannot “see a dry line” at 300 km/h through spray.",
  },
  {
    id: "hungaroring",
    direction: "clockwise",
    lengthKm: 4.38,
    altitudeM: 236,
    climateFamily: "continental",
    wetTendency: "occasional",
    stormMonths: [6, 7, 8],
    typicalSlicks: [3, 5],
    energy: "medium",
    surface: "abrasive",
    points: [
      { x: 90, y: 150, elev: 250, name: "Start/finish" },
      { x: 180, y: 145, elev: 245 },
      { x: 250, y: 120, elev: 235, name: "T1" },
      { x: 310, y: 80, elev: 225 },
      { x: 380, y: 90, elev: 220 },
      { x: 430, y: 140, elev: 215, name: "Valley" },
      { x: 410, y: 200, elev: 225 },
      { x: 340, y: 240, elev: 240 },
      { x: 250, y: 250, elev: 248 },
      { x: 160, y: 230, elev: 252 },
      { x: 90, y: 190, elev: 250 },
    ],
    terrainCopy:
      "A dusty bowl in the Mogyoród hills. The pit straight is a ridge; the back of the lap sits in a valley that collects heat and, after a storm, water. Not Spa, but not flat.",
    weatherCopy:
      "July is hot and often still. This station’s rain flag is unreliable (0% in July, 100% in March). Use heat (~37%) and the continental-storm tendency: a 20-minute cell, then a drying dusty track.",
    tireCopy:
      "Twisty, abrasive, little straight-line cooling: C3–C5, and they still overheat the fronts. A storm is intermediates then a fast crossover as the valley dries. Full wets only while the bowl is actually flooded.",
  },
  {
    id: "zandvoort",
    direction: "clockwise",
    lengthKm: 4.26,
    altitudeM: 6,
    climateFamily: "maritime",
    wetTendency: "frequent",
    stormMonths: [8, 9, 10],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 200, y: 230, elev: 8, name: "Start/finish" },
      { x: 280, y: 210, elev: 10, name: "Tarzan" },
      { x: 340, y: 160, elev: 14 },
      { x: 360, y: 100, elev: 18, name: "Hugenholtz" },
      { x: 310, y: 55, elev: 16, name: "Banked T3" },
      { x: 230, y: 48, elev: 12 },
      { x: 150, y: 70, elev: 8 },
      { x: 90, y: 120, elev: 6, name: "Dunes" },
      { x: 85, y: 180, elev: 7 },
      { x: 130, y: 230, elev: 9, name: "Arie Luyendyk" },
    ],
    terrainCopy:
      "North Sea dunes. The climbs are small in metres and huge in feel: banked T3 and the Luyendyk bowl, sand on the surface, wind off the water. Low points in the dunes hold puddles.",
    weatherCopy:
      "August on the Dutch coast is wind and the chance of a North Sea shower. ISD rain at this pin is often missing — do not read that as a dry circuit. Gusts are the NOAA field that actually fires.",
    tireCopy:
      "Banking plus abrasive dunes = C1–C3, heavy lateral load. Sand acts like gravel on a damp tyre. Intermediates for the typical coastal film; full wets if the dune dips are standing and the sea spray does not let them dry.",
  },
  {
    id: "monza",
    direction: "clockwise",
    lengthKm: 5.79,
    altitudeM: 181,
    climateFamily: "continental",
    wetTendency: "occasional",
    stormMonths: [4, 5, 9, 10],
    typicalSlicks: [2, 4],
    energy: "medium",
    surface: "mixed",
    points: [
      { x: 95, y: 210, elev: 181, name: "Start/finish" },
      { x: 100, y: 90, elev: 183 },
      { x: 130, y: 48, elev: 184, name: "Rettifilo" },
      { x: 220, y: 45, elev: 185, name: "Curva Grande" },
      { x: 340, y: 70, elev: 187, name: "Roggia" },
      { x: 410, y: 120, elev: 189, name: "Lesmo" },
      { x: 395, y: 175, elev: 186 },
      { x: 330, y: 215, elev: 184, name: "Ascari" },
      { x: 230, y: 250, elev: 182 },
      { x: 140, y: 245, elev: 181, name: "Parabolica" },
    ],
    terrainCopy:
      "A royal park, mostly flat, with Lesmo sitting a few metres up in the trees. The “terrain” that matters is the park: shade keeps Lesmo and Ascari greasy after the Rettifilo has dried.",
    weatherCopy:
      "September can still be hot, or it can be an autumn front. NOAA rain here has looked extreme in some months (sensor bias). Heat ~18% and the park microclimate are the better guides. A wet Monza is spray at 350 km/h.",
    tireCopy:
      "Low lateral energy, huge straight-line load: C2–C4, often a one-stop if it stays dry. Damp Lesmo is intermediates. Full wets only if the park is actually flooded — the danger is visibility, not compound wear.",
  },
  {
    id: "madring",
    direction: "clockwise",
    lengthKm: 5.4,
    altitudeM: 610,
    climateFamily: "mediterranean",
    wetTendency: "occasional",
    stormMonths: [9, 10, 11],
    typicalSlicks: [2, 4],
    energy: "medium",
    surface: "smooth-street",
    points: [
      { x: 80, y: 200, elev: 610, name: "Start/finish" },
      { x: 170, y: 190, elev: 615 },
      { x: 260, y: 160, elev: 625, name: "IFEMA" },
      { x: 330, y: 110, elev: 635 },
      { x: 300, y: 60, elev: 640, name: "Park" },
      { x: 210, y: 50, elev: 630 },
      { x: 130, y: 80, elev: 620 },
      { x: 90, y: 140, elev: 612 },
      { x: 380, y: 200, elev: 605, name: "Street" },
      { x: 430, y: 150, elev: 600 },
      { x: 410, y: 230, elev: 598 },
      { x: 250, y: 250, elev: 608 },
    ],
    terrainCopy:
      "New 2026 venue around Madrid’s exhibition grounds (~610 m). This drawing is an original schematic, not a surveyed map — the real kerbs will move. Expect a park/street mix with a few metres of roll, not an alpine climb.",
    weatherCopy:
      "September on the meseta is usually warm and dry, with the first autumn storms possible. The NOAA pin has almost no usable hours yet, so the tyre call leans on climate family, not this station.",
    tireCopy:
      "Treat it like a smooth street-permanent hybrid: C2–C4 until a real Pirelli nomination exists. Intermediates for an autumn cell; full wets only if the street section ponds. Revisit once the layout is raced.",
  },
  {
    id: "baku",
    direction: "anticlockwise",
    lengthKm: 6.00,
    altitudeM: 21,
    climateFamily: "subtropical",
    wetTendency: "rare",
    stormMonths: [10, 11],
    typicalSlicks: [3, 5],
    energy: "low",
    surface: "smooth-street",
    points: [
      { x: 80, y: 230, elev: 12, name: "Start/finish" },
      { x: 200, y: 228, elev: 14 },
      { x: 340, y: 220, elev: 16 },
      { x: 450, y: 200, elev: 18 },
      { x: 470, y: 140, elev: 22, name: "Castle" },
      { x: 430, y: 80, elev: 28 },
      { x: 350, y: 55, elev: 26 },
      { x: 270, y: 70, elev: 22 },
      { x: 200, y: 110, elev: 18, name: "Old city" },
      { x: 140, y: 150, elev: 15 },
      { x: 90, y: 190, elev: 13 },
    ],
    terrainCopy:
      "A harbour-to-castle street circuit. The castle climbs a few storeys; the 2 km straight is dead flat and a wind tunnel. Gusts, not hills, move the car.",
    weatherCopy:
      "September is usually dry and still warm. NOAA rain is near zero most months (October is the odd wet spike in this record). Gust probability is the field that matches the folklore: the castle corridor punches the car sideways.",
    tireCopy:
      "Very low energy, polished street: C3–C5, and they still cool on the long straight. Wind is a temperature problem, not a wet-tyre one. Intermediates only for a rare Caspian shower; full wets would be an event.",
  },
  {
    id: "sepang",
    direction: "clockwise",
    lengthKm: 5.54,
    altitudeM: 18,
    climateFamily: "tropical",
    wetTendency: "seasonal-storms",
    stormMonths: [3, 4, 10, 11],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 90, y: 210, elev: 18, name: "Start/finish" },
      { x: 180, y: 205, elev: 20 },
      { x: 270, y: 180, elev: 24, name: "T1" },
      { x: 330, y: 130, elev: 28 },
      { x: 310, y: 70, elev: 30, name: "Back hill" },
      { x: 220, y: 50, elev: 26 },
      { x: 130, y: 70, elev: 22 },
      { x: 80, y: 130, elev: 18 },
      { x: 400, y: 200, elev: 16, name: "Stadium" },
      { x: 450, y: 150, elev: 15 },
      { x: 420, y: 240, elev: 16 },
      { x: 250, y: 250, elev: 18 },
    ],
    terrainCopy:
      "Twin long straights around a modest hill behind T1. The stadium sits lower. Tropical rain overwhelms the drains; the hill dries while the stadium is a lake.",
    weatherCopy:
      "October around Kuala Lumpur is monsoon-adjacent: heat is brutal (NOAA high-temp ~90% of hours) and rain sensors here often report nothing. Ignore a 0% rain reading. Afternoon cells are the historical Malaysian GP story.",
    tireCopy:
      "Hot, abrasive, high energy: C1–C3, degradation is thermal. When the cell hits, it is usually full wets first (standing water in the stadium), then intermediates as the hill dries, then slicks. That is a three-compound afternoon, not a guess.",
  },
  {
    id: "marina-bay",
    direction: "anticlockwise",
    lengthKm: 4.94,
    altitudeM: 8,
    climateFamily: "tropical",
    wetTendency: "seasonal-storms",
    stormMonths: [10, 11, 12],
    typicalSlicks: [3, 5],
    energy: "low",
    surface: "smooth-street",
    points: [
      { x: 100, y: 90, elev: 8, name: "Start/finish" },
      { x: 180, y: 70, elev: 8 },
      { x: 280, y: 60, elev: 7 },
      { x: 380, y: 80, elev: 7, name: "Memorial" },
      { x: 450, y: 140, elev: 6 },
      { x: 440, y: 210, elev: 5, name: "Marina" },
      { x: 350, y: 250, elev: 5 },
      { x: 240, y: 245, elev: 6 },
      { x: 150, y: 210, elev: 7, name: "Underpass" },
      { x: 90, y: 150, elev: 8 },
    ],
    terrainCopy:
      "Harbour streets, almost no climb. The underpass is the only roof; it is dry when the marina is not. Drainage is a street-circuit bet — tropical rain wins.",
    weatherCopy:
      "October is still monsoon season. NOAA heat is extreme (~98% of hours above the hot threshold); rain is often missing from ISD. Night racing knocks the air temperature down but the asphalt and humidity stay high. A cell can flood a sector in minutes.",
    tireCopy:
      "Low energy, bumpy street: C3–C5, and they still grain if the night goes cool after rain. Intermediates for the usual Singapore sprinkle. Full wets if the marina or underpass approach is standing — you cannot see the wall in that spray.",
  },
  {
    id: "cota",
    direction: "anticlockwise",
    lengthKm: 5.51,
    altitudeM: 161,
    climateFamily: "subtropical",
    wetTendency: "occasional",
    stormMonths: [4, 5, 10],
    typicalSlicks: [2, 4],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 130, y: 235, elev: 155, name: "Start/finish" },
      { x: 200, y: 220, elev: 168, name: "T1 climb" },
      { x: 235, y: 165, elev: 178 },
      { x: 200, y: 120, elev: 170, name: "Esses" },
      { x: 235, y: 90, elev: 162 },
      { x: 200, y: 68, elev: 158 },
      { x: 250, y: 48, elev: 155 },
      { x: 340, y: 52, elev: 152 },
      { x: 420, y: 85, elev: 150 },
      { x: 455, y: 145, elev: 148 },
      { x: 420, y: 205, elev: 150, name: "Stadium" },
      { x: 320, y: 240, elev: 152 },
    ],
    terrainCopy:
      "A purpose-built hill. Turn 1 is a steep climb (~20 m+), the esses tumble down the other side, the stadium sits in a bowl. Rain runs off T1 and ponds in the stadium.",
    weatherCopy:
      "October in Austin is warm with a real chance of a frontal storm. NOAA rain is modest (~6% of hours) and more believable than the saturated stations. Heat ~30%. Wind across the hill is a rear-tyre cooler on the back straight.",
    tireCopy:
      "Abrasive and high-energy: C2–C4. Dry T1 with a wet stadium is intermediates. Full wets if the bowl is standing — that is where the water goes after it leaves the hill.",
  },
  {
    id: "mexico",
    direction: "clockwise",
    lengthKm: 4.30,
    altitudeM: 2230,
    climateFamily: "high-altitude",
    wetTendency: "seasonal-storms",
    stormMonths: [6, 7, 8, 9, 10],
    typicalSlicks: [2, 4],
    energy: "medium",
    surface: "smooth-street",
    points: [
      { x: 90, y: 200, elev: 2235, name: "Start/finish" },
      { x: 220, y: 195, elev: 2238 },
      { x: 320, y: 170, elev: 2242, name: "Esses" },
      { x: 380, y: 120, elev: 2245 },
      { x: 360, y: 70, elev: 2240 },
      { x: 280, y: 55, elev: 2235 },
      { x: 190, y: 70, elev: 2230 },
      { x: 130, y: 110, elev: 2228 },
      { x: 400, y: 210, elev: 2225, name: "Foro Sol" },
      { x: 350, y: 250, elev: 2226 },
      { x: 220, y: 248, elev: 2230 },
    ],
    terrainCopy:
      "2,230 m above sea level — the hill is the air, not the asphalt. The lap itself only rolls a few metres; Foro Sol is a slight dip inside a baseball stadium. Thin air means less cooling and less downforce.",
    weatherCopy:
      "November is the dry-season turn, but NOAA rain still reads very high (treat as bias plus leftover wet season). Afternoons can still build a storm over the valley. The honest weather story is density altitude, not millimetres of rain.",
    tireCopy:
      "Compounds look like C2–C4 but they overheat because the air cannot cool them. Graining on the fronts is the dry-race failure mode. If Foro Sol is actually wet, intermediates; the stadium dip is where water sits. Full wets are rare by November, not impossible.",
  },
  {
    id: "interlagos",
    direction: "anticlockwise",
    lengthKm: 4.31,
    altitudeM: 750,
    climateFamily: "subtropical",
    wetTendency: "frequent",
    stormMonths: [10, 11, 12, 1, 2, 3],
    typicalSlicks: [2, 4],
    energy: "medium",
    surface: "mixed",
    points: [
      { x: 300, y: 75, elev: 790, name: "Start/finish" },
      { x: 245, y: 62, elev: 780, name: "Senna S" },
      { x: 195, y: 90, elev: 760 },
      { x: 155, y: 140, elev: 745, name: "Curva do Sol" },
      { x: 125, y: 195, elev: 735 },
      { x: 165, y: 245, elev: 738, name: "Subida" },
      { x: 260, y: 255, elev: 750 },
      { x: 355, y: 230, elev: 765 },
      { x: 410, y: 175, elev: 778, name: "Junção" },
      { x: 385, y: 115, elev: 788 },
      { x: 345, y: 80, elev: 790 },
    ],
    terrainCopy:
      "A proper hill in São Paulo: Senna S drops you off the plateau, the back of the lap is the valley, Junção starts the climb home. ~50–60 m of change. The valley holds water and the climb dries in the wind.",
    weatherCopy:
      "November is the start of the Brazilian wet season. NOAA rain ~80% of hours is high but the direction is right: unstable, stormy afternoons. Volatility is medium-high. A dry start and a red-flag storm is the local pattern.",
    tireCopy:
      "Mixed surface, altitude ~750 m, undulating: C2–C4. Intermediates for the typical Interlagos sprinkle. Full wets when the valley below Sol is standing — cars then climb onto a dry line at Junção, which is how you get split strategies on one lap.",
  },
  {
    id: "las-vegas",
    direction: "anticlockwise",
    lengthKm: 6.20,
    altitudeM: 610,
    climateFamily: "desert",
    wetTendency: "rare",
    stormMonths: [],
    typicalSlicks: [3, 5],
    energy: "low",
    surface: "smooth-street",
    points: [
      { x: 70, y: 230, elev: 610, name: "Start/finish" },
      { x: 200, y: 228, elev: 612 },
      { x: 360, y: 220, elev: 615, name: "Strip" },
      { x: 460, y: 180, elev: 618 },
      { x: 470, y: 110, elev: 620 },
      { x: 400, y: 60, elev: 618, name: "Sphere" },
      { x: 280, y: 55, elev: 615 },
      { x: 160, y: 80, elev: 612 },
      { x: 90, y: 140, elev: 610 },
    ],
    terrainCopy:
      "A desert-city rectangle at ~610 m. The Strip is flat; the only “terrain” is cold night air and hotel-canyon wind. No hill to hide rain, and almost no rain to hide.",
    weatherCopy:
      "November nights are cold by F1 standards. NOAA heat probability is low, rain ~1% of hours — both match the desert. The tyre problem is getting heat in, then keeping it through the long straights.",
    tireCopy:
      "Low energy, cold, smooth street: C3–C5, and they can still grain. Rain tyres are a contingency for a freak Pacific remnant. If it did rain, the polished paint would want intermediates immediately; standing water would be a full-wet novelty.",
  },
  {
    id: "lusail",
    direction: "clockwise",
    lengthKm: 5.42,
    altitudeM: 13,
    climateFamily: "desert",
    wetTendency: "rare",
    stormMonths: [],
    typicalSlicks: [1, 3],
    energy: "high",
    surface: "abrasive",
    points: [
      { x: 100, y: 210, elev: 13, name: "Start/finish" },
      { x: 190, y: 200, elev: 14 },
      { x: 280, y: 165, elev: 16, name: "T1" },
      { x: 350, y: 110, elev: 18 },
      { x: 340, y: 55, elev: 17 },
      { x: 250, y: 40, elev: 15 },
      { x: 150, y: 60, elev: 14 },
      { x: 80, y: 120, elev: 13 },
      { x: 90, y: 175, elev: 13 },
      { x: 400, y: 200, elev: 12 },
      { x: 450, y: 150, elev: 12 },
      { x: 420, y: 240, elev: 13 },
      { x: 250, y: 250, elev: 13 },
    ],
    terrainCopy:
      "A flowing desert bowl, almost no elevation. Wind and abrasive asphalt are the terrain. Night racing takes the edge off the air, not off the track temp in the first hour.",
    weatherCopy:
      "November in Qatar is still hot (NOAA high-temp ~45% of hours) and dry. Rain is absent in this record. Volatility is HIGH — that is hour-to-hour temperature swing, not a storm rolling in.",
    tireCopy:
      "High-energy desert abrasive: C1–C3, thermal degradation. Rain tyres stay packed. If a shamal ever wet the place, intermediates would be a guess on a surface with no rubber history in the wet.",
  },
  {
    id: "yas-marina",
    direction: "clockwise",
    lengthKm: 5.28,
    altitudeM: 3,
    climateFamily: "desert",
    wetTendency: "rare",
    stormMonths: [],
    typicalSlicks: [3, 5],
    energy: "low",
    surface: "smooth-street",
    points: [
      { x: 80, y: 170, elev: 3, name: "Start/finish" },
      { x: 160, y: 150, elev: 4 },
      { x: 250, y: 110, elev: 5, name: "Hotel" },
      { x: 330, y: 70, elev: 5 },
      { x: 400, y: 80, elev: 4 },
      { x: 450, y: 130, elev: 3, name: "Marina" },
      { x: 430, y: 190, elev: 3 },
      { x: 350, y: 235, elev: 3 },
      { x: 240, y: 245, elev: 3 },
      { x: 140, y: 220, elev: 3 },
      { x: 90, y: 195, elev: 3 },
    ],
    terrainCopy:
      "A marina island, dead flat. The hotel section is a tight street-like maze; the marina is open and windy. No hill, no drainage drama unless it actually rains — which it almost never does.",
    weatherCopy:
      "December twilight is warm, not brutal. NOAA heat ~20%, rain ~0%. The day-to-night drop is the weather story: FP3 in the afternoon is a different tyre window from the race after sunset.",
    tireCopy:
      "Low energy, smooth, cooling as the sun drops: C3–C5. Rain tyres are ceremonial. A genuine wet Yas would be intermediates on polished paint, with no useful rubber from previous years to follow.",
  },
];

const BY_ID = new Map(GUIDES.map((guide) => [guide.id, guide]));

export function getCircuitGuide(id: string): CircuitGuide | undefined {
  return BY_ID.get(id);
}

export function allCircuitGuides(): CircuitGuide[] {
  return GUIDES;
}
