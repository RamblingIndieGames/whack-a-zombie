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
// Libraries
// Global State
// Global Functions
// Entry Point Function
async function main() {
  console.log("Whack A Zombie - Starting");
}
// Entry Point Call
main().catch((err) => {
  console.error(err.message);
  alert(err.message);
});
