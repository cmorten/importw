export function expectMessage(
  target: EventTarget,
  payload?: string,
): Promise<MessageEvent> {
  return new Promise((resolve) => {
    target.addEventListener(
      "message",
      function eventHandler(event) {
        if (payload && (event as MessageEvent).data !== payload) {
          return;
        }

        target.removeEventListener("message", eventHandler);

        resolve(event as MessageEvent);
      },
    );
  });
}
