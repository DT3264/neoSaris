import { ContestData, Problem, Submission, Verdict } from "../../types/contestDataTypes";

// Every piece of this type is useful because with a forEach on the problem you can get
// the sum of scores (the amount of problems solved if ICPC)
// The sum of penalties
// The tries in that problem,
type ProblemType = {
  tries: number;
  score: number; // if 0, not solved, if 1, solved, useful like this because it can also represent partial scores
  penalty: number;
  isSolved: boolean;
  isFirstSolved: boolean;
  isFrozen: boolean;
  indexLetter: string;
  nextSubmissionTime: number;
};

export type TeamType = {
  unfrozenSubmissions: Submission[];
  frozenSubmissions: Submission[];
  position: number;
  name: string;
  id: number;
  problems: ProblemType[];
  solvedCount: number;
  totalPenalty: number;
  // Required because if we only check frozenSubmissions,
  // teams with no frozen submission would be skipped
  // and that would look clunky
  isDone: boolean;
  moved: boolean;
};

type ScoreboardType = {
  isProblemAlreadySolved: number[];
  // contestMetadata: contestData.contestMetadata,
  verdicts: Verdict;
  problems: Problem[];
  contestDuration: number;
  contestFrozenTimeDuration: number;
  contestTimeOfFreeze: number;
  contestName: string;
  contestType: string;
  firstSolvedArray: string[];
};

export type ScoreboardDirectorType = {
  teams: TeamType[];
  scoreboard: ScoreboardType;
  indexOfNext: number;
};

function isSubmissionBeforeFrozen(submission: Submission, frozenTime: number) {
  return submission.timeSubmitted < frozenTime;
}

function getNewTeam(contestData: ContestData, contestantName: string) {
  let currentIndex = 0;
  const problems = Array.from({ length: contestData.problems.length }, () => ({
    tries: 0,
    score: 0,
    penalty: 0,
    isSolved: false,
    isFirstSolved: false,
    isFrozen: false,
    indexLetter: getProblemIndexLetter(contestData.problems, currentIndex++).index,
  })) as ProblemType[];
  const contestantId = contestData.contestants.find(
    contestant => contestant.name === contestantName
  )?.id;
  return {
    unfrozenSubmissions: [],
    frozenSubmissions: [],
    position: 0,
    name: contestantName,
    id: contestantId ?? -1,
    problems: problems,
    solvedCount: 0,
    totalPenalty: 0,
    isDone: false,
    moved: false,
  } as TeamType;
}

function sortSubmissionsByTimeAndStatus(submissions: Submission[], contestData: ContestData) {
  return submissions.sort((a, b) => {
    if (a.timeSubmitted === b.timeSubmitted) {
      // We want WAs before ACs, which can happen
      if (isSubmissionWAwPenalty(a, contestData.verdicts.accepted)) {
        return 1;
      }
      return -1;
    }
    return a.timeSubmitted - b.timeSubmitted;
  });
}

function getProblemIndexNumber(problems: Problem[], problemIndex: string) {
  return problems.findIndex(problem => problem.index === problemIndex);
}

function getProblemIndexLetter(problems: Problem[], index: number) {
  return problems[index];
}

function isSubmissionAC(submission: Submission, accepted: string[]) {
  return accepted.includes(submission.verdict);
}

function isSubmissionWAwNoPenalty(submission: Submission, verdicts: string[]) {
  return verdicts.includes(submission.verdict);
}

function isSubmissionWAwPenalty(submission: Submission, verdicts: string[]) {
  return verdicts.includes(submission.verdict);
}

function processSubmission(submission: Submission, team: TeamType, scoreboard: ScoreboardType) {
  const problemIndex = getProblemIndexNumber(scoreboard.problems, submission.problemIndex);
  const problem = team.problems[problemIndex];
  // If is WA without penalty, do nothing
  if (isSubmissionWAwNoPenalty(submission, scoreboard.verdicts.wrongAnswerWithoutPenalty)) {
    return false;
  }
  // If WA with penalty, increase tries
  if (isSubmissionWAwPenalty(submission, scoreboard.verdicts.wrongAnswerWithPenalty)) {
    problem.tries++;
    return false;
  }
  if (isSubmissionAC(submission, scoreboard.verdicts.accepted)) {
    if (!problem.isSolved) {
      problem.isSolved = true;
      problem.score = 1;
      problem.penalty = submission.timeSubmitted + problem.tries * 20;
      team.totalPenalty = team.problems.reduce((acc, p) => acc + p.penalty, 0);
      team.solvedCount++;
      if (scoreboard.firstSolvedArray[problemIndex] === submission.contestantName) {
        problem.isFirstSolved = true;
        scoreboard.isProblemAlreadySolved[problemIndex] = 1;
      }
      return true;
    }
  }
}

function processSubmissionBeforeFreeze(
  submission: Submission,
  team: TeamType,
  scoreboard: ScoreboardType
) {
  processSubmission(submission, team, scoreboard);
}

function findNextSubmissionByProblemIndex(team: TeamType, problemIndex: string) {
  return team.frozenSubmissions.find(s => s.problemIndex === problemIndex);
}

function processSubmissionAfterFreeze(
  submission: Submission,
  team: TeamType,
  scoreboard: ScoreboardType
) {
  const isSolved = processSubmission(submission, team, scoreboard);
  if (isSolved) {
    // Remove all remaining frozen submissions of that problem since it was solved already
    team.frozenSubmissions = team.frozenSubmissions.filter(
      s => s.problemIndex !== submission.problemIndex
    );
  }
  // Get next submission's time for that problem
  const currentProblem = team.problems.find(p => p.indexLetter === submission.problemIndex)!;
  const nextSubmission = findNextSubmissionByProblemIndex(team, currentProblem.indexLetter);
  currentProblem.isFrozen = nextSubmission !== undefined;
  currentProblem.nextSubmissionTime = nextSubmission?.timeSubmitted!;
}

function processTeamsNextFrozenSubmission(team: TeamType, scoreboard: ScoreboardType) {
  if (team.frozenSubmissions.length === 0) {
    team.isDone = true;
    return;
  }
  const submissionToProcess = team.frozenSubmissions.shift()!;
  processSubmissionAfterFreeze(submissionToProcess, team, scoreboard);
}

function getFirstSolvedOnEachProblem(submissions: Submission[], contestData: ContestData) {
  const solvedByTeam = new Array(contestData.problems.length).fill("");
  submissions.forEach(submission => {
    const problemIndex = getProblemIndexNumber(contestData.problems, submission.problemIndex);
    if (
      isSubmissionAC(submission, contestData.verdicts.accepted) &&
      solvedByTeam[problemIndex] == ""
    ) {
      solvedByTeam[problemIndex] = submission.contestantName;
    }
  });
  return solvedByTeam;
}

// Sort teams by solvedCount, penalty, and firstToSolveIndex
function getScoreboardSortedTeams(teams: TeamType[], isInitialSort: boolean) {
  const sortedTeams = teams.sort((a, b) => {
    if (a.solvedCount !== b.solvedCount) {
      return b.solvedCount - a.solvedCount;
    }
    return a.totalPenalty - b.totalPenalty;
  });
  sortedTeams[0].position = 1;
  // This is to detect if a team has been moved,
  // if so, that's the team that moved up in the scoreboard
  let alreadySwitched = false;
  for (let i = 1; i < sortedTeams.length; i++) {
    const currentPosition = sortedTeams[i].position;
    const isTied =
      sortedTeams[i].solvedCount === sortedTeams[i - 1].solvedCount &&
      sortedTeams[i].totalPenalty === sortedTeams[i - 1].totalPenalty;
    if (isTied) {
      sortedTeams[i].position = sortedTeams[i - 1].position;
    } else {
      sortedTeams[i].position = i + 1;
    }
    if (!isInitialSort) {
      if (sortedTeams[i].position !== currentPosition && !alreadySwitched) {
        sortedTeams[i].moved = true;
        alreadySwitched = true;
      } else {
        sortedTeams[i].moved = false;
      }
    }
  }
  return sortedTeams;
}

export function getInitialData(contestData: ContestData) {
  // contestMetadata: ContestMetadata;
  // problems: Array<Problem>; //Array with an unique index for each problem
  // verdicts: Verdict;
  //For awards, we can add an object for different awards (TopRanked, FirstToSolve, Medals)
  const scoreboardData = {
    isProblemAlreadySolved: new Array(contestData.problems.length).fill(0),
    verdicts: contestData.verdicts,
    problems: contestData.problems,
    contestDuration: contestData.contestMetadata.duration,
    contestFrozenTimeDuration: contestData.contestMetadata.frozenTimeDuration,
    contestTimeOfFreeze:
      contestData.contestMetadata.duration - contestData.contestMetadata.frozenTimeDuration,
    contestName: contestData.contestMetadata.name,
    contestType: contestData.contestMetadata.type,
    firstSolvedArray: getFirstSolvedOnEachProblem(
      sortSubmissionsByTimeAndStatus(contestData.submissions, contestData),
      contestData
    ),
  } as ScoreboardType;

  // Team data comes from here
  // contestants: Array<Contestant>;
  // submissions: Array<Submission>;
  // This works like a groupby where submissions are grouped by teamName
  // For each submission,
  const teams = contestData.submissions
    .reduce((teamsArray: TeamType[], submission: Submission) => {
      let currentTeam = teamsArray.find(t => t.name == submission.contestantName);
      // If the team does not exist, create it
      if (currentTeam === undefined) {
        currentTeam = getNewTeam(contestData, submission.contestantName);
        teamsArray.push(currentTeam);
      }
      // Add the submission to the team depending if it was before or after the freeze
      if (isSubmissionBeforeFrozen(submission, scoreboardData.contestTimeOfFreeze)) {
        currentTeam.unfrozenSubmissions.push(submission);
      } else {
        currentTeam.frozenSubmissions.push(submission);
      }
      return teamsArray;
    }, [] as TeamType[])
    .filter(t => t.id !== -1);

  // Sort unfrozen and frozen submissions by time
  teams.forEach(
    t => (t.frozenSubmissions = sortSubmissionsByTimeAndStatus(t.frozenSubmissions, contestData))
  );
  teams.forEach(
    t =>
      (t.unfrozenSubmissions = sortSubmissionsByTimeAndStatus(t.unfrozenSubmissions, contestData))
  );
  // Process each teams problem
  teams.forEach(t => {
    t.unfrozenSubmissions.forEach(submission => {
      processSubmissionBeforeFreeze(submission, t, scoreboardData);
    });
  });

  teams.forEach(t => {
    let frozenProblems = t.frozenSubmissions.map(s => s.problemIndex).sort();
    frozenProblems = frozenProblems.filter((item, pos) => {
      return frozenProblems.indexOf(item) == pos;
    });
    t.problems.forEach(p => {
      if (frozenProblems.includes(p.indexLetter)) {
        p.isFrozen = true;
        p.nextSubmissionTime = t.frozenSubmissions.find(
          s => s.problemIndex === p.indexLetter
        )?.timeSubmitted!;
      }
    });
  });

  return {
    teams: getScoreboardSortedTeams(teams, true),
    scoreboard: scoreboardData,
    indexOfNext: teams.length - 1,
  } as ScoreboardDirectorType;
}

export function getNextData(scoreboardDirector: ScoreboardDirectorType) {
  const movedTeam = scoreboardDirector.teams.find(t => t.moved);
  console.log("MovedTeam:", movedTeam);
  //   if (movedTeam !== undefined) {
  //     movedTeam.moved = false;
  //     return scoreboardDirector;
  //   }

  const team = scoreboardDirector.teams.findLast(t => !t.isDone);
  if (team === undefined) {
    return scoreboardDirector;
  }
  // Get the team that is next to process indicated by indexOfNext
  //   const team = scoreboardDirector.teams[scoreboardDirector.indexOfNext];

  // Process submission of the team indicated in indexOfNext
  processTeamsNextFrozenSubmission(team, scoreboardDirector.scoreboard);

  // After processing the submission, sort the teams
  scoreboardDirector.teams = getScoreboardSortedTeams(scoreboardDirector.teams, false);

  // Index of next is the index of the last team that is not done
  scoreboardDirector.indexOfNext = scoreboardDirector.teams.findLastIndex(t => !t.isDone);

  return scoreboardDirector;
}

function getDataBeforeNthPlace(nthPlace: number) {
  // TODO: Get data while indexOfNext < nthPlace
}
