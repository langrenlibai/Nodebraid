(() => {
  "use strict";

  function createRepositoryRequestGate() {
    let generation = 0;
    let repositoryIdentity = "";

    return Object.freeze({
      advance(identity) {
        repositoryIdentity = String(identity ?? "");
        generation += 1;
        return Object.freeze({ generation, repositoryIdentity });
      },
      capture() {
        return Object.freeze({ generation, repositoryIdentity });
      },
      isCurrent(token) {
        return Boolean(token)
          && token.generation === generation
          && token.repositoryIdentity === repositoryIdentity;
      },
    });
  }

  Object.defineProperty(window, "NodebraidRequestGuard", {
    value: Object.freeze({ createRepositoryRequestGate }),
    configurable: false,
    enumerable: false,
    writable: false,
  });
})();
