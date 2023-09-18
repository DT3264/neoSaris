import { useHotkeys } from "react-hotkeys-hook";
import { ContestData } from "../../types/contestDataTypes";
import Scoreboard from "./Scoreboard";
import { useRef, useState } from "react";

import { getInitialData, getNextData } from "./ScoreboardDirector";
import Header from "./Header";

export default function FunctionalScoreboard({ contestData }: { contestData: ContestData }) {
  const [scoreboardDirector, setScoreboardDirector] = useState(getInitialData(contestData));
  //(N)ext submission
  useHotkeys("n", () => scoreboardRef.current?.keyNextSubmission());
  //(T)op 10 Standing
  useHotkeys("t", () => scoreboardRef.current?.revealUntilTop(10));
  //(U)nfroze Standing
  useHotkeys("u", () => scoreboardRef.current?.revealUntilTop(0));
  const scoreboardRef = useRef<Scoreboard>(null);
  return <Scoreboard ref={scoreboardRef} submissionsData={contestData} />;
  //   return <FCScoreboard ref={scoreboardRef} submissionsData={contestData} />;
}

function FCScoreboard() {
  return (
    <div id="score" className={"scoreboardTable"} tabIndex={0}>
      <Header title={this.props.submissionsData.contestMetadata.name} />
      <div className="score-FlipMove" id="score-FlipMove">
        <FlipMove ref="flipMove" staggerDurationBy="10" duration={900}>
          {this.getScoreboard()}
        </FlipMove>
      </div>
    </div>
  );
}
