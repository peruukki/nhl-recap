export function remainingTimeToElapsedTime({period, minute, second}) {
  const periodLengthInMinutes = (period === 'OT') ? 5 : 20;
  const secondsRemaining = 60 * (minute || 0) + (second || 0);
  const secondsElapsed = periodLengthInMinutes * 60 - secondsRemaining;
  const elapsedMinute = Math.floor(secondsElapsed / 60);
  const elapsedSecond = secondsElapsed - 60 * elapsedMinute;

  return { period, minute: elapsedMinute, second: elapsedSecond };
}

export function elapsedTimeToRemainingTime(time) {
  return remainingTimeToElapsedTime(time);
}

export function hasGoalBeenScored(clock, goal) {
  const {minute, second} = remainingTimeToElapsedTime(clock);
  return (getPeriodOrdinal(goal.period) < getPeriodOrdinal(clock.period)) ||
    (getPeriodOrdinal(goal.period) === getPeriodOrdinal(clock.period) &&
      (goal.min < minute ||
        (goal.min === minute && goal.sec <= second)));
}

function getPeriodOrdinal(period) {
  return (period === 'OT') ? 4 : Number(period);
}
