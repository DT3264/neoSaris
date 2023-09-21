import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { ContestData } from "../../types/contestDataTypes";
// import Scoreboard from "./Scoreboard";

import { Flipper } from "react-flip-toolkit";
import Header from "./Header";
import { ScoreboardDirectorType, getInitialData, getNextData } from "./ScoreboardDirector";
import TableRow from "./TableRow";
import "./Scoreboard.css";

export default function Scoreboard({ contestData }: { contestData: ContestData }) {
  const [scoreboardDirector, setScoreboardDirector] = useState(getInitialData(contestData));
  const [reloadId, setReloadId] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null); // Reference to the container

  const indexOfNext = useRef(scoreboardDirector.teams.length - 1);

  const scrollToIndex = (index: number) => {
    containerRef.current?.children[index].scrollIntoView({
      behavior: "auto",
      block: "nearest",
      inline: "nearest",
    });
  };

  const getIndexOfNext = () => scoreboardDirector.teams.findLastIndex(t => !t.isDone);

  const scrollToNext = () => {
    const indexOfNext = getIndexOfNext();
    if (indexOfNext === -1) scrollToIndex(0);
    else scrollToIndex(indexOfNext);
  };

  useEffect(() => scrollToNext(), []);

  const updateScoreboard = (newData: ScoreboardDirectorType) => {
    indexOfNext.current = newData.indexOfNext;
    setScoreboardDirector(newData);
    setReloadId(prevReloadId => prevReloadId + 1);
    scrollToIndex(newData.indexOfNext !== -1 ? newData.indexOfNext : 0);
  };
  const onNextSubmission = () => {
    if (indexOfNext.current === -1) return;
    const newData = getNextData(scoreboardDirector);
    updateScoreboard(newData);
  };

  const nextSubmission = () => {
    // scoreboardRef.current?.keyNextSubmission();
    onNextSubmission();
  };
  const top10Standing = () => {
    // scoreboardRef.current?.revealUntilTop(10);
    let currentDirector = scoreboardDirector;
    while (currentDirector.indexOfNext >= 10) {
      currentDirector = getNextData(currentDirector);
    }
    updateScoreboard(currentDirector);
  };
  const unfreeze = () => {
    // scoreboardRef.current?.revealUntilTop(0);
    let currentDirector = scoreboardDirector;
    while (currentDirector.indexOfNext >= 0) {
      currentDirector = getNextData(currentDirector);
    }
    updateScoreboard(currentDirector);
    scrollToIndex(0);
  };
  //   //(N)ext submission
  useHotkeys("n", nextSubmission);
  //(T)op 10 Standing
  useHotkeys("t", top10Standing);
  //(U)nfroze Standing
  useHotkeys("u", unfreeze);

  const hasAnyTeamMoved = scoreboardDirector.teams.some(t => t.movedUp);
  return (
    <>
      <div id="score" className={"scoreboardTable"} tabIndex={0}>
        <Header title={scoreboardDirector.scoreboard.contestName} />
        <div className="score-FlipMove" id="score-FlipMove">
          <Flipper flipKey={reloadId}>
            <div className="grid grid-cols-12" ref={containerRef}>
              {scoreboardDirector.teams.map((t, i) => (
                <TableRow
                  team={t}
                  isNextTeam={i == indexOfNext.current && !hasAnyTeamMoved}
                  index={i}
                  key={t.id}
                />
              ))}
            </div>
          </Flipper>
        </div>
      </div>
    </>
  );
}
