function randomBetween(from, to) {
  return Math.floor(Math.random() * (to - from + 1) + from);
}

function wait(seconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
}

function unixToDate(unix) {
  return new Date(unix * 1000);
}

module.exports = {
  unixToDate,
  randomBetween,
  wait,
};