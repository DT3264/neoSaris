import { useHotkeys } from "react-hotkeys-hook";
import { ContestData } from "../../types/contestDataTypes";
import Scoreboard from "./Scoreboard";
import { useRef } from "react";

export default function FunctionalScoreboard({ contestData }: { contestData: ContestData }) {
  //(N)ext submission
  useHotkeys("n", () => scoreboardRef.current?.keyNextSubmission());
  //(T)op 10 Standing
  useHotkeys("t", () => scoreboardRef.current?.revealUntilTop(10));
  //(U)nfroze Standing
  useHotkeys("u", () => scoreboardRef.current?.revealUntilTop(0));
  const scoreboardRef = useRef<Scoreboard>(null);
  return <Scoreboard ref={scoreboardRef} submissionsData={contestData} />;
}
