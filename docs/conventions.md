# Conventions

This document will detail the coding conventions that will be used within this project.

As a code contributor, you are expected to adhere to these conventions to ensure that all code contributed is consistent.

The project will use **Prettier** to format the JavaScript code.

The configuration file `.prettierrc.json` will specify the rules.

Aside from the formatting, the following conventions should be followed:

### Strict Rules

- Constant declarations shall be `UPPERCASE_WITH_UNDERSCORES`
  - locally scoped constant values shall be `lowerCamelCased`
- Variables and method names shall be `lowerCamelCased`
- Class type and library names shall be `PascalCased`
- Values that do not change shall be declared as `const`
- Values that do change shall be declared as `let`
- The `var` keyword shall never be used
- The `this` keyword should be avoided
- No single letter variable or function names except for
  - `x`, `y`, and `z` for cartesian coordinate position numbers
  - `i`, and `j`, for primary and secondary indexing numbers in for-loops
  - `a` and `b` as the parameters to a sort comparator function
  - `t` for normalized time elapsed between two markers
  - `m` to represent the magnitude of a vector.
- Use `try/catch` blocks to surround any code that may throw an exception
- Always `assert` function parameters are of the correct data types

### Preferences

- Prefer long-form function syntax for top level functions
- Prefer arrow function syntax for nested functions

Do this

```javascript
function toplevelFunction() {
  const nestedFunction = () => {
    doSomething();
  };
  nestedFunction();
}
```

Don't do this

```javascript
function topLevelFunction() {
  function nestedFunction() {
    doSomething();
  }
  nestedFunction();
}
```

- Prefer standard for-loop syntax to forEach method for array iteration

Do this

```javascript
const items = [makeItem(), makeItem(), makeItem()];
for (let i = 0; i < items.length; i++) {
  const item = items[i];
  doSomethingWithItem(item);
}
```

Don't do this

```javascript
const items = [makeItem(), makeItem(), makeItem()];
items.forEach((item) => {
  doSomethingWithItem(item);
});
```

- Prefer `async` and `await` to using Promise `.then` callback

Do this

```javascript
async function asynchronousFunction() {
  const result = await doSomethingAsync();
  doSomethingWithResult(result);
  return result;
}
```

Don't do this

```javascript
function asynchronousFunction() {
  return doSomethingAsync().then((result) => {
    doSomethingWithResult(result);
    return result;
  });
}
```

- Prefer several small functions to a single long function

Do this

```javascript
function findTopBoundary(pixelData, imageWidth, imageHeight) {
  for (let i = 0; i < imageWidth; i++) {
    for (let j = 0; j < imageHeight; j++) {
      const offset = i + j * imageWidth;
      if (pixelData[offset]) {
        return j;
      }
    }
  }
  return 0;
}

function findLeftBoundary(pixelData, imageWidth, imageHeight) {
  for (let i = 0; i < imageHeight; i++) {
    for (let j = 0; j < imageWidth; j++) {
      const offset = j + i * imageWidth;
      if (pixelData[offset]) {
        return j;
      }
    }
  }
  return 0;
}

function findRightBoundary(pixelData, imageWidth, imageHeight) {
  for (let i = 0; i < imageHeight; i++) {
    for (let j = 0; j < imageWidth; j++) {
      const offset = imageWidth - j + i * imageWidth;
      if (pixelData[offset]) {
        return imageWidth - j;
      }
    }
  }
  return imageWidth;
}

function findBottomBoundary(pixelData, imageWidth, imageHeight) {
  for (let i = 0; i < imageHeight; i++) {
    for (let j = 0; j < imageWidth; j++) {
      const offset = j + (imageHeight - i) * imageWidth;
      if (pixelData[offset]) {
        return imageHeight - i;
      }
    }
  }
  return imageHeight;
}

function findBounds(pixelData, imageWidth, imageHeight) {
  const bounds = {
    top: findTopBoundary(pixelData, imageWidth, imageHeight),
    left: findLeftBoundary(pixelData, imageWidth, imageHeight),
    right: findRightBoundary(pixelData, imageWidth, imageHeight),
    bottom: findBottomBoundary(pixelData, imageWidth, imageHeight),
  };
  return bounds;
}
```

Don't do this

```javascript
function findBounds(pixelData, imageWidth, imageHeight) {
  const bounds = {
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  };
  // find top boundary
  for (let i = 0; i < imageWidth; i++) {
    for (let j = 0; j < imageHeight; j++) {
      const offset = i + j * imageWidth;
      if (pixelData[offset]) {
        bounds.top = j;
        j = imageHeight;
        i = imageWidth;
      }
    }
  }
  // find left boundary
  for (let i = 0; i < imageHeight; i++) {
    for (let j = 0; j < imageWidth; j++) {
      const offset = j + i * imageWidth;
      if (pixelData[offset]) {
        bounds.left = j;
        j = imageWidth;
        i = imageHeight;
      }
    }
  }
  // find right boundary
  for (let i = 0; i < imageHeight; i++) {
    for (let j = 0; j < imageWidth; j++) {
      const offset = imageWidth - j + i * imageWidth;
      if (pixelData[offset]) {
        bounds.right = imageWidth - j;
        j = imageWidth;
        i = imageHeight;
      }
    }
  }
  // find bottom boundary
  for (let i = 0; i < imageHeight; i++) {
    for (let j = 0; j < imageWidth; j++) {
      const offset = j + (imageHeight - i) * imageWidth;
      if (pixelData[offset]) {
        bounds.bottom = imageHeight - i;
        j = imageWidth;
        i = imageHeight;
      }
    }
  }
  return bounds;
}
```

### Organization

Organize your code in the general order shown below:

- Imports
- Constant Declarations
- Class Types
- Instance Creation Functions
- Libraries
- Global State
- Global Functions
- Entry Point Function
- Entry Point Call
