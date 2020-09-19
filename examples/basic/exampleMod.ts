/**
 * Log messages prefixed with the name of the window / worker.
 * 
 * @param {any} ...msg messages to log
 */
export function log(...msg: any[]) {
  console.log(`[${(self as any).name} logger]:`, ...msg);
}

/**
 * Adds two numbers.
 * 
 * @param {number} a
 * @param {number} b 
 */
export function add(a: number, b: number) {
  return a + b;
}

/**
 * Multiplies two numbers.
 * 
 * @param {number} a
 * @param {number} b 
 */
export function multiply(a: number, b: number) {
  return a * b;
}

/**
 * Returns the current working directory via the
 * Deno.cwd() API.
 */
export function denoCwd() {
  return Deno.cwd();
}

export class MyClass {
  #firstName!: string;
  #surName!: string;

  constructor(firstName: string, surName: string) {
    this.#firstName = firstName;
    this.#surName = surName;
  }

  logName() {
    log(this.name);
  }

  get name() {
    return `${this.#firstName} ${this.#surName}`;
  }
}
