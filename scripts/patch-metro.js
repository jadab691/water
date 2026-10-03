const fs = require("fs");
const path = require("path");

function patchFile(filePath, search, replace) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, "utf8");
  if (content.includes(replace)) {
    return; // Already patched
  }
  if (content.includes(search)) {
    fs.writeFileSync(filePath, content.replace(search, replace), "utf8");
    console.log(`[patch-metro] Successfully patched ${path.basename(filePath)}`);
  }
}

// 1. Patch DependencyGraph.js in metro
const depGraphPath = path.join(
  __dirname,
  "../node_modules/metro/src/node-haste/DependencyGraph.js"
);
const oldDepGraph = `  _onHasteChange({ changes, rootDir }) {
    this._resolutionCache = new Map();
    [
      ...changes.addedFiles,
      ...changes.modifiedFiles,
      ...changes.removedFiles,
    ].forEach(([canonicalPath]) =>
      this.#packageCache.invalidate(_path.default.join(rootDir, canonicalPath)),
    );
    this._createModuleResolver();
    this.emit("change");
  }`;

const newDepGraph = `  _onHasteChange(changeEvent) {
    this._resolutionCache = new Map();
    const changes = changeEvent?.changes;
    if (changes) {
      const added = changes.addedFiles ? [...changes.addedFiles] : [];
      const modified = changes.modifiedFiles ? [...changes.modifiedFiles] : [];
      const removed = changes.removedFiles ? [...changes.removedFiles] : [];
      const rootDir = changeEvent.rootDir || "";
      [...added, ...modified, ...removed].forEach((item) => {
        const canonicalPath = Array.isArray(item) ? item[0] : item;
        if (canonicalPath) {
          this.#packageCache.invalidate(_path.default.join(rootDir, canonicalPath));
        }
      });
    }
    this._createModuleResolver();
    this.emit("change");
  }`;

patchFile(depGraphPath, oldDepGraph, newDepGraph);

// 2. Patch react-native-css-interop metro index.js
const cssInteropPath = path.join(
  __dirname,
  "../node_modules/react-native-css-interop/dist/metro/index.js"
);
const oldCssInterop = `            haste.emit("change", {
                eventsQueue: [
                    {
                        filePath,
                        metadata: {
                            modifiedTime: Date.now(),
                            size: 1,
                            type: "virtual",
                        },
                        type: "change",
                    },
                ],
            });`;

const newCssInterop = `            haste.emit("change", {
                eventsQueue: [
                    {
                        filePath,
                        metadata: {
                            modifiedTime: Date.now(),
                            size: 1,
                            type: "virtual",
                        },
                        type: "change",
                    },
                ],
                changes: {
                    addedFiles: new Map(),
                    modifiedFiles: new Map([[filePath, { modifiedTime: Date.now(), size: 1, type: "virtual" }]]),
                    removedFiles: new Map(),
                },
                rootDir: "",
            });`;

patchFile(cssInteropPath, oldCssInterop, newCssInterop);
