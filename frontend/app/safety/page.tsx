import Link from "next/link";
import { BIANCHI_2014, SAFETY_EVENTS } from "@/lib/safetyHistory";

export default function SafetyPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="rounded-full border border-amber/40 bg-amber/10 px-4 py-2 text-center text-xs uppercase tracking-[0.22em] text-amber">
        Historical context — this app is not race control
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-f1">Formula 1 safety history</p>
          <h1 className="mt-2 text-4xl leading-tight">Accidents wrote the rules</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
            Formula 1 became survivable because people died and the sport changed the cars, the circuits, and how it
            behaves in the wet. This planner only shows historical NOAA weather frequencies. It cannot call a red flag,
            slow the field, or decide whether a recovery vehicle belongs on the road.
          </p>
        </div>
        <Link href="/" className="self-start rounded-xl border border-stroke px-4 py-2 text-sm sm:self-end">
          Back to planner
        </Link>
      </div>

      <article className="rounded-3xl border border-f1/40 bg-f1/5 p-5 sm:p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-f1">{BIANCHI_2014.date}</p>
        <h2 className="mt-2 text-2xl sm:text-3xl">Jules Bianchi, Suzuka, in the wet</h2>
        <p className="mt-3 text-sm leading-6 text-muted">
          Typhoon weather hung over the {BIANCHI_2014.place}. Adrian Sutil had already gone off. A recovery crane was
          in the runoff. {BIANCHI_2014.driver} lost control at the same corner under double yellow flags and struck the
          vehicle. He died on {BIANCHI_2014.died}.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted">
          The FIA’s ten-person accident panel did not treat that as a freak unlucky bounce. Standing water had narrowed
          the racing line. Double yellows depended on drivers choosing to slow enough. Marshals and a heavy recovery
          vehicle were still in an impact zone while cars were at speed. The panel’s point was blunt: do not try to make
          a car-versus-crane crash survivable — prevent the car from ever arriving there.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <ChangeCard
            label="Direct operational change"
            body="2015 Virtual Safety Car: an enforced speed limit in caution zones, so recovery can happen without hoping everyone lifted."
          />
          <ChangeCard
            label="Scheduling change"
            body="A guideline that a race should not start less than four hours before sunset or dusk, except night events — weather plus daylight is a timetable problem."
          />
          <ChangeCard
            label="Also recommended"
            body="Better drainage, wet-tyre testing between seasons, Super Licence age rules, and a review of safety-critical car software."
          />
          <ChangeCard
            label="What the halo is not"
            body="Cockpit protection was already in development. The FIA said a halo would not have absorbed this crane impact. The 2014 lesson is procedures in the wet, not a titanium hoop."
          />
        </div>
        <a
          className="mt-5 inline-block text-sm text-teal underline-offset-2 hover:underline"
          href={BIANCHI_2014.report}
        >
          FIA accident panel summary
        </a>
      </article>

      <section className="space-y-4">
        <h2 className="text-2xl">A short line through the sport</h2>
        <ol className="space-y-3">
          {SAFETY_EVENTS.map((event) => (
            <li key={event.year} className="rounded-3xl border border-stroke bg-panel p-5">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-amber">{event.year}</p>
              <h3 className="mt-1 text-xl">{event.title}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted">{event.place}</p>
              <p className="mt-3 text-sm leading-6 text-muted">{event.summary}</p>
              <p className="mt-3 text-sm leading-6">
                <span className="text-teal">What changed. </span>
                {event.change}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <aside className="rounded-2xl border border-stroke bg-black/40 p-4 text-sm leading-6 text-muted">
        <p className="text-xs uppercase tracking-[0.2em] text-amber">How this sits next to the planner</p>
        <p className="mt-2 text-foreground">
          Moving a British GP window in this app does not make a wet Sunday safer. It only asks how often Church Lawford
          recorded rain, gusts or poor visibility in that hour historically.
        </p>
        <p className="mt-2">
          Race directors, not NOAA tables, decide VSC, safety car, and whether cars run at all. After 2014 that
          authority is the point.
        </p>
      </aside>
    </div>
  );
}

function ChangeCard({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-2xl border border-stroke bg-black/30 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-sm leading-6">{body}</p>
    </div>
  );
}
