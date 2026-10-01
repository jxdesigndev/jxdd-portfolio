const func = () => {
  console.log("Timer ID is:", timer);
  clearInterval(timer);
};
setTimeout(func, 500);
const timer = setInterval(() => console.log("tick"), 100);
