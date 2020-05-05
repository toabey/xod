import fs from 'fs';
import path from 'path';
import R from 'ramda';
// import { assert } from 'chai';

import { explode } from 'xod-func-tools';
import { loadProject } from 'xod-fs';
import { transpile, transformProject } from '../src/transpiler';
import { LIVENESS } from '../src/constants';

// Returns patch relative to repo’s `workspace` subdir
const wsPath = (...subpath) =>
  path.resolve(__dirname, '../../../workspace', ...subpath);

describe.only('quickly transpile some fixtures without rebuilding xod-cli', () => {
  const transpileAndSpewOut = projName =>
    loadProject([wsPath()], wsPath(projName))
      .then(transformProject(R.__, '@/main', LIVENESS.NONE))
      .then(R.map(transpile))
      .then(explode)
      .then(cpp =>
        fs.writeFileSync(
          path.resolve(__dirname, `${projName}.result.cpp`),
          cpp,
          'utf8'
        )
      );

  // specify('blink', () => transpileAndSpewOut('blink'));
  specify('dht-pack-unpack', () => transpileAndSpewOut('dht-pack-unpack'));
});
