import ProblemBox from "./ProblemBox";
import "./TableRow.css";

import cecyt13 from "../../assets/university_logos/cecyt13.png";
import chapingo from "../../assets/university_logos/chapingo.png";
import defaultImage from "../../assets/university_logos/default.png";
import escom from "../../assets/university_logos/escom.png";
import itcg from "../../assets/university_logos/itcg.png";
import uam from "../../assets/university_logos/uam.png";
import ug from "../../assets/university_logos/ug.png";
import umsa from "../../assets/university_logos/umsa.png";
import { Flipped } from "react-flip-toolkit";
import classNames from "classnames";
import { ProblemStatusType, TeamType } from "../../types/scoreboardDataTypes";

const images = { cecyt13, chapingo, escom, itcg, uam, ug, umsa };
export default function TableRow({
  team,
  isNextTeam,
  index,
}: {
  team: TeamType;
  isNextTeam: boolean;
  index: number;
}) {
  const nextProblemIndex =
    team.frozenSubmissions.length > 0 ? team.frozenSubmissions[0].problemIndex : "";
  return (
    <Flipped flipId={team.id}>
      <div
        className={classNames("tableRow", {
          scoreboardTableBlackRow: index % 2 !== 0 && !isNextTeam && !team.movedUp,
          scoreboardTableGrayRow: index % 2 === 0 && !isNextTeam && !team.movedUp,
          scoreboardTableSelectedRow: isNextTeam,
          "tableRow-MovedUp": team.movedUp,
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
            {team.problems.map(problem => {
              let problemStatus = "NoAttempted" as ProblemStatusType;
              let problemWidth = 84.0 / team.problems.length;
              let textToShowInProblem = problem.indexLetter;

              if (problem.isFirstSolved) {
                problemStatus = "FirstAccepted";
              } else if (problem.isSolved) {
                problemStatus = "Accepted";
              } else if (problem.isFrozen) {
                problemStatus = "Resolving";
                textToShowInProblem = `${problem.tries} - ${problem.nextSubmissionTime}`;
              } else if (problem.tries > 0) {
                problemStatus = "WrongAnswer";
                textToShowInProblem = `${problem.tries} - ${problem.penalty}`;
              }
              // Is next problem only if
              // the team's next submision index is equal to this problem's index
              // and if the current team is the next team to be shown
              const isNextProblem = problem.indexLetter === nextProblemIndex && isNextTeam;
              return (
                <ProblemBox
                  key={problem.indexLetter}
                  problemWidth={problemWidth}
                  problemStatus={problemStatus}
                  displayText={textToShowInProblem}
                  isNextProblem={isNextProblem}
                />
              );
            })}
          </div>
        </div>
        {/*ProblemsSolved*/}
        <span className="tableRow-ResolvedProblems">{team.totalScore}</span>
        {/*Penalty*/}
        <span className="tableRow-Penalty">{team.totalPenalty}</span>
      </div>
    </Flipped>
  );
}
