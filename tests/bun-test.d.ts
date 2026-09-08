declare module "bun:test" {
  export function test(name: string, callback: () => void | Promise<void>): void;
}
