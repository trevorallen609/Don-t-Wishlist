import { DecisionAutopsy } from "@/components/decision-autopsy";
import { GameCover } from "@/components/game-cover";
import { VerdictButtons } from "@/components/verdict-buttons";
import type { RefusalItem } from "@/lib/schemas";

type Props = {
  item: RefusalItem;
  saleCheckId: string;
  tone: "no" | "yes";
};

/** Server component composition: static layout + client islands. */
export function RefusalCard({ item, saleCheckId, tone }: Props) {
  const border = tone === "no" ? "border-signal/30" : "border-go/30";

  return (
    <article className={`border ${border} bg-panel/60 px-4 py-3`}>
      <div className="flex gap-3">
        <GameCover title={item.title} size={56} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg text-foam">{item.title}</h3>
          <p className="mt-1 text-mist">{item.reason}</p>
          <ul className="mt-2 list-inside list-disc text-sm text-mist/80">
            {item.signals.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
          <DecisionAutopsy item={item} />
          <VerdictButtons saleCheckId={saleCheckId} itemTitle={item.title} />
        </div>
      </div>
    </article>
  );
}
