/**
 * Port and adaption of esserializer (https://github.com/shaochuancs/esserializer)
 * for Deno with additional circular reference handling.
 *
 * esserializer originally licensed as follows:
 *
 * MIT License
 *
 * Copyright (c) 2019 Chuan Shao
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

function notObject(o) {
  return o === null || typeof o !== "object";
}

function getSerialObjWithClassName(
  originObj,
  seen = new WeakMap(),
  stack = [],
) {
  if (typeof originObj === "function") {
    return `[Function~${originObj.toString()}]`;
  }

  if (notObject(originObj)) {
    return originObj;
  }

  if (seen.has(originObj)) {
    return `[Circular${seen.get(originObj)}]`;
  }

  seen.set(originObj, stack.join("."));

  if (Array.isArray(originObj)) {
    let serialArr = [];

    for (let i = 0; i < originObj.length; i++) {
      serialArr.push(getSerialObjWithClassName(originObj[i], seen, stack));
    }

    return serialArr;
  }

  let serialObj = {};

  for (let k in originObj) {
    let v = originObj[k];
    serialObj[k] = getSerialObjWithClassName(v, seen, [...stack, k]);
  }

  let className = originObj.constructor.name;

  if (className !== "Object") {
    serialObj.className = className;
  }

  return serialObj;
}

const functionRegex = /^\[Function~((.|\r|\n)*)\]$/;

function deserializeFunction(value) {
  const serializedFn = value.match(functionRegex)[1];

  return new Function(
    `return (${serializedFn})(...Array.from(arguments))`,
  ).bind(self);
}

function isSerializedFunction(str) {
  return typeof str === "string" && str.match(functionRegex)?.length > 0;
}

function deserializeFromParsedObj(parsedObj, classMapping) {
  if (notObject(parsedObj)) {
    return parsedObj;
  }

  let resultObj = {};
  if (parsedObj.className) {
    const classObj = classMapping[parsedObj.className];

    resultObj = Object.create(classObj.prototype);
  }

  for (let k in parsedObj) {
    if (k === "className") {
      continue;
    }

    let v = parsedObj[k];

    if (Array.isArray(v)) {
      let deSerialArr = [];

      for (let i = 0; i < v.length; i++) {
        deSerialArr.push(deserializeFromParsedObj(v[i], classMapping));
      }

      resultObj[k] = deSerialArr;
    } else {
      resultObj[k] = deserializeFromParsedObj(v, classMapping);
    }
  }

  return resultObj;
}

const circularRegex = /^\[Circular(.*)\]$/;

function parseCircularReference(value, obj) {
  const reference = value.match(circularRegex)[1];

  if (reference === "") {
    return obj;
  }

  const keys = reference.split(".");

  return keys.reduce((currObj, key) => currObj[key], obj);
}

function isCircularRef(str) {
  return typeof str === "string" && str.match(circularRegex)?.length > 0;
}

function deserializeCircular(obj, originalObj) {
  if (isSerializedFunction(obj)) {
    return deserializeFunction(obj);
  } else if (isCircularRef(obj)) {
    return parseCircularReference(obj, originalObj);
  } else if (notObject(obj)) {
    return obj;
  }

  if (!originalObj) {
    originalObj = obj;
  }

  for (let k in obj) {
    if (k === "className") {
      continue;
    }

    let v = obj[k];

    if (isSerializedFunction(v)) {
      v = deserializeFunction(v);
    } else if (isCircularRef(v)) {
      v = parseCircularReference(v, originalObj);
    } else if (Array.isArray(obj[k])) {
      for (let i = 0; i < v.length; i++) {
        v[i] = deserializeCircular(v[i], originalObj);
      }
    } else {
      v = deserializeCircular(v, originalObj);
    }

    obj[k] = v;
  }

  return obj;
}

function getClassMappingFromClassArray(classes) {
  let classArr = classes && Array.isArray(classes) ? classes : [];

  let classMapping = {};
  for (let i = 0; i < classArr.length; i++) {
    let classObj = classArr[i];
    classMapping[classObj.name] = classObj;
  }

  return classMapping;
}

const ESSerializer = {
  serialize: function (obj) {
    return JSON.stringify(getSerialObjWithClassName(obj));
  },
  deserialize: function (serializedText, classes) {
    const classMapping = getClassMappingFromClassArray(classes);

    return deserializeCircular(
      deserializeFromParsedObj(JSON.parse(serializedText), classMapping),
    );
  },
};

export default ESSerializer;
export { ESSerializer };
