type Score = {
  home: number;
  away: number;
};

const outcome = ({ home, away }: Score) => {
  if (home > away) return "home";
  if (away > home) return "away";
  return "draw";
};

export function calculatePoints(prediction: Score, result: Score) {
  if (prediction.home === result.home && prediction.away === result.away) {
    return 10;
  }

  let points = 0;

  if (outcome(prediction) === outcome(result)) {
    points += 5;
  }

  if (prediction.home === result.home) {
    points += 1;
  }

  if (prediction.away === result.away) {
    points += 1;
  }

  const predictedDiff = prediction.home - prediction.away;
  const resultDiff = result.home - result.away;

  if (predictedDiff === resultDiff) {
    points += 2;
  }

  return Math.min(points, 9);
}

export const scoringRules = [
  "10 pontos por placar exato",
  "5 pontos por acertar vencedor ou empate",
  "2 pontos por acertar saldo de gols",
  "1 ponto por acertar gols do mandante",
  "1 ponto por acertar gols do visitante",
  "Pontuacao parcial limitada a 9 quando nao for placar exato"
];
