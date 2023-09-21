export type Team = {
  position: number;
  penalty: number;
  solved: number;
  isProblemSolved: Array<number>;
  isFirstToSolve: Array<number>;
  triesOnProblems: Array<number>;
  penaltyOnProblem: Array<number>;
  name: string;
  id: number;
};

export type ProblemColumn = {
  key: string;
  index: string;
  width: string;
  problemStatus:
    | "FirstAccepted"
    | "Accepted"
    | "Resolving"
    | "Pending"
    | "WrongAnswer"
    | "NoAttempted";
  displayText: string;
};

export type ProblemStatusType =
  | "FirstAccepted"
  | "Accepted"
  | "Resolving"
  | "Pending"
  | "WrongAnswer"
  | "NoAttempted";
