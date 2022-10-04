// Imports
// Constant Declarations
// Class Types
const Rect = {
  symbol: Symbol("Rect"),
  create(x, y, width, height) {
    const rect = {
      x,
      y,
      width,
      height,
      get symbol() {
        return Rect.symbol;
      },
    };
    return rect;
  },
  isRect(rect) {
    return rect.symbol === Rect.symbol;
  },
};
// Instance Creation Functions
function createRect(
  { x, y, width, height } = { x: 0, y: 0, width: 0, height: 0 },
) {
  assert(typeof x !== "number", "x must be a Number");
  assert(typeof y !== "number", "y must be a Number");
  assert(typeof width !== "number", "width must be a Number");
  assert(typeof height !== "number", "height must be a Number");
  const instance = Rect.create(x, y, width, height);
  return instance;
}
// Libraries
// Global State
// Global Functions
function assert(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}
// Entry Point Function
async function main() {
  console.log("Whack A Zombie - Starting");
}
// Entry Point Call
main().catch((err) => {
  console.error(err.message);
  alert(err.message);
});
