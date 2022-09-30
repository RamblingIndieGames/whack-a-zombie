# Patterns

This document will describe the coding patterns of the project.

While we are using ES6+ JavaScript, we are not going to use the **class** keyword and will avoid the **this** keyword as well.

We _will_ still define custom class data types to describe our game objects using a specific pattern as shown below:

### Define a Class

Assuming that the class you want to define is named `CLASSNAME`, the following piece of code shows how you would write a definition object.

```javascript
const CLASSNAME = {
  create(props) {
    const instance = {
      ...props,
      instanceMethodName(...methodParams) {
        // do something with method params
      },
    };
    return instance;
  },
  classMethodName(...methodParams) {
    // do something with method params
  },
};
```

> - If your class type does not need class methods or instance methods, you may omit them entirely.
> - If you want to have read only properties, you can define getter methods as instance methods which return the property values, and place the variables within the create method closure

### Class Instance Creation

Instead of using `CLASSNAME.create` directly each time you want to create an instance of the class, it will be better to define an **Instance Creation Function**.

The pattern below shows how you would define an instance creation function for the `CLASSNAME` class type.

> - A bonus feature of this function is that the instance is bound to the `this` and the **first** parameter of all additional instance methods.
> - Optionally, you can assert creation property data types here to ensure that only expected types are being passed in. Throw an exception if the assertion fails.

```javascript
function createCLASSNAME(instanceProperties, additionalInstanceMethods) {
  const instance = CLASSNAME.create(instanceProperties);
  for (const key in additionalInstanceMethods) {
    instance[key] = additionalInstanceMethods[key].bind(instance, instance);
  }
  return instance;
}
```

## Libraries

If you have several related class types, you may want to _package_ your class types and instance creation functions within a common scope referred to as a **Library**.

Not to be confused with external libraries such as those you would install with a package manager like `yarn` or `npm`.

The pattern below shows how you would package your class types in a library named `LIBRARYNAME`.

```javascript
const LIBRARYNAME = {
  CLASSNAME,
  createCLASSNAME,
};
```

### Using these patterns in the game code

Once you have written your class types, instance creation functions, and libraries, you are going to want to use them of course.

The snippets of code below show the expected usage of these patterns.

#### Create a class type instance

- Create an instance of the `CLASSNAME` class type from the library `LIBRARYNAME`
- Define that the instance will have a `name` property with the value `Test Object`
- Define that the instance will have an instance method `show` that will log the string value `My name is Test Object` to the browser console.

```javascript
const obj = LIBRARYNAME.createCLASSNAME(
  {
    name: "Test Object",
  },
  {
    show(self) {
      console.log(`My name is ${self.name}`);
    },
  }
);
```

#### Call an instance method from the `CLASSNAME` class type

```javascript
obj.instanceMethodName(obj.name);
```

#### Call the additional instance method from the previous creation snippet.

```javascript
obj.show();
```

#### Call a class method from the `CLASSNAME` class type

```javascript
LIBRARYNAME.CLASSNAME.classMethodName(obj);
```

## A Real Example

The patterns are all well and good as theoreticals, but a concrete example will hopefully solidify the concept that we are working with.

- Describe a class type to represent a rectangle by the **center point**, **width** and **height**.
- The class type should have an instance method `containsPoint` which returns `true` if the parameters `x` and `y` describe a coordinate within the boundaries of the rectangle.
- The class type should have a class method `clone` which will create a new rectangle class type instance with the same properties as the parameter `other`.
- The instance creation function named `createRectangle` shall take the **top-left point** and the **width** and **height** of the rectangle as input properties `x`, `y`, `width`, and `height`.
- The instance creation function named `createRectangle` shall assert that input properties are of the `Number` data type and that any additional instance methods are of the `Function` data type.
- The class type and instance creation method shall be placed within a library named `Geometry`.

```javascript
const Rectangle = {
  create(centerX, centerY, width, height) {
    const instance = {
      position: {
        x: centerX,
        y: centerY,
      },
      size: {
        width,
        height,
      },
      containsPoint(x, y) {
        const halfWidth = instance.size.width * 0.5;
        const halfHeight = instance.size.height * 0.5;
        const left = instance.position.x - halfWidth;
        const right = instance.position.x + halfWidth;
        const top = instance.position.y - halfHeight;
        const bottom = instance.position.y + halfHeight;
        return !(x < left || x > right || y < top || y > bottom);
      },
    };
    return instance;
  },

  clone(other) {
    return Rectangle.create(
      other.position.x,
      other.position.y,
      other.size.width,
      other.size.height
    );
  },
};

function createRectangle({ x, y, width, height }, additionalInstanceMethods) {
  assert(typeof x !== "number", "x must be a Number");
  assert(typeof y !== "number", "y must be a Number");
  assert(typeof width !== "number", "width must be a Number");
  assert(typeof height !== "number", "height must be a Number");

  // The input parameters describe the rectangle by the top left point and the size of the rectangle.
  // The Rectangle class type describes the rectangle by the center point and the size of the rectangle.
  // We need to calculate the center point by adding half the width and height to the top left point to find the center.

  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const centerX = x + halfWidth;
  const centerY = y + halfHeight;

  const instance = Rectangle.create(x, y, width, height);

  for (const key in additionalInstanceMethods) {
    assert(
      typeof additionalInstanceMethods[key] !== "function",
      `${key} must be a Function`
    );
    instance[key] = additionalInstanceMethods[key].bind(instance, instance);
  }

  return instance;
}

const Geometry = {
  Rectangle,
  createRectangle,
};
```

The `assert` function used in the example above is a simple utility that will throw an exception when the given condition is true:

```javascript
function assert(condition, message) {
  if (condition) {
    throw new Error(message);
  }
}
```
