import { useHotkeys } from "react-hotkeys-hook";
import { ContestData, Problem } from "../../types/contestDataTypes";
import Scoreboard from "./Scoreboard";
import { useEffect, useRef, useState } from "react";
import defaultImage from "../../assets/university_logos/default.png";

import {
  ScoreboardDirectorType,
  TeamType,
  getInitialData,
  getNextData,
} from "./ScoreboardDirector";
import Header from "./Header";
import { Flipped, Flipper } from "react-flip-toolkit";
import { ProblemColumn } from "../../types/scoreboardDataTypes";

import "./TableRow.css";
import "./ProblemBox.css";
import "./Scoreboard.css";
import classNames from "classnames";

export default function FunctionalScoreboard({ contestData }: { contestData: ContestData }) {
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

  const updateScoreboard = (newData: ScoreboardDirectorType) => {
    indexOfNext.current = newData.indexOfNext;
    setScoreboardDirector(newData);
    setReloadId(prevReloadId => prevReloadId + 1);
    scrollToIndex(newData.indexOfNext !== -1 ? newData.indexOfNext : 0);
  };
  const onNextSubmission = () => {
    if (indexOfNext.current === -1) return;
    const newData = getNextData(scoreboardDirector);
    // console.log("New data", newData);
    updateScoreboard(newData);
  };

  const nextSubmission = () => {
    scoreboardRef.current?.keyNextSubmission();
    onNextSubmission();
  };
  const top10Standing = () => {
    scoreboardRef.current?.revealUntilTop(10);
    let currentDirector = scoreboardDirector;
    while (currentDirector.indexOfNext > 10) {
      currentDirector = getNextData(currentDirector);
    }
    updateScoreboard(currentDirector);
  };
  const unfreeze = () => {
    scoreboardRef.current?.revealUntilTop(0);
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
  const scoreboardRef = useRef<Scoreboard>(null);

  scrollToIndex(scoreboardDirector.indexOfNext !== -1 ? scoreboardDirector.indexOfNext : 0);
  //   return <Scoreboard ref={scoreboardRef} submissionsData={contestData} />;
  return (
    <>
      <div id="score" className={"scoreboardTable"} tabIndex={0}>
        <Header title={scoreboardDirector.scoreboard.contestName} />
        <div className="score-FlipMove" id="score-FlipMove">
          <Flipper flipKey={reloadId}>
            <div className="grid grid-cols-12" ref={containerRef}>
              {scoreboardDirector.teams.map((t, i) => (
                <MyTableRow
                  team={t}
                  isNext={i == indexOfNext.current || t.moved}
                  movedUp={t.moved}
                  index={i}
                  problems={scoreboardDirector.scoreboard.problems}
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

function MyProblemBox({
  index,
  width,
  problemStatus,
  displayText,
}: {
  index: string;
  width: string;
  problemStatus: string;
  displayText: string;
}) {
  return (
    <span className={`problemBox problemBox-${problemStatus}`} style={{ width }} key={index}>
      {displayText}
    </span>
  );
}

function MyTableRow({
  team,
  isNext,
  movedUp,
  problems,
  index,
}: {
  team: TeamType;
  isNext: boolean;
  movedUp: boolean;
  problems: Problem[];
  index: number;
}) {
  return (
    <Flipped flipId={team.id}>
      <div
        className={classNames("tableRow", {
          scoreboardTableBlackRow: index % 2 !== 0 && !isNext && !movedUp,
          scoreboardTableGrayRow: index % 2 === 0 && !isNext && !movedUp,
          "tableRow-Selected": isNext,
          "tableRow-MovedUp": movedUp,
        })}
        id={team.id.toString()}
      >
        {/*Rank*/}
        <span className="tableRow-Rank">{team.position}</span>
        {/*Photo*/}
        <img className="tableRow-Picture" src={defaultImage} alt="" />
        {/*Name+Problems*/}
        <div className="tableRow-TeamData">
          {/*ContestantName*/}
          <span className="tableRox-ContestantName">{team.name}</span>
          {/*Problem Boxes*/}
          <div className="tableRox-Problems">
            {team.problems.map((problem, i) => {
              let problemStatus = "NoAttempted";
              // Can be "FirstAccepted" | "Accepted" | "Resolving" | "Pending" | "WrongAnswer" | "NoAttempted"

              let problemIndex = problem.indexLetter;
              //   let sizeProblem = 84.0 / team.problems.length;
              let widthPercentage = `${84.0 / team.problems.length}%`;
              let textToShowInProblem = problem.indexLetter;

              if (problem.isFirstSolved) {
                problemStatus = "FirstAccepted";
              } else if (problem.isSolved) {
                problemStatus = "Accepted";
              } else if (problem.isFrozen) {
                problemStatus = "Resolving";
                textToShowInProblem = `${problem.tries} - ${problem.nextSubmissionTime}`;
              } else if (problem.tries < 0) {
                // TODO: Here would be both the check and the problemStatus when the problem is partially solved
                // problemStatus = "Partial";
                // textToShowInProblem = `${problem.score} - ${problem.nextSubmissionTime}`;
              } else if (problem.tries > 0) {
                problemStatus = "WrongAnswer";
                textToShowInProblem = `${problem.tries} - ${problem.penalty}`;
              }
              return (
                <MyProblemBox
                  key={problemIndex}
                  index={problemIndex}
                  width={widthPercentage}
                  problemStatus={problemStatus}
                  displayText={textToShowInProblem}
                />
              );
            })}
          </div>
        </div>
        {/*ProblemsSolved*/}
        <span className="tableRow-ResolvedProblems">{team.solvedCount}</span>
        {/*Penalty*/}
        <span className="tableRow-Penalty">{team.totalPenalty}</span>
      </div>
    </Flipped>
  );
}
