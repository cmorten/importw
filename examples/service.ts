export function log(...msg: any[]) {
  console.log(`[${(self as any).name} logger]:`, ...msg);
}

export function add(a: number, b: number) {
  return a + b;
}

export function multiply(a: number, b: number) {
  return a * b;
}

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
