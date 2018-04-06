declare module 'omelette' {
  class Omelette {
    // tree(args: Map<String, Array<String>>): Omelette;
    tree(args: any): Omelette;
    init(): void;
    setupShellInitFile(shellInitFile?: String): void;
  }
  function omelette(command: String): Omelette;

  export = omelette;
}
