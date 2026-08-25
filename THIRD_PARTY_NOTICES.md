# Third-Party Notices

Nodebraid is built with third-party software. Those components remain subject to their own copyright and license terms. This notice is informational and does not replace the license files supplied by the respective projects.

## Direct project dependencies

| Component | Version at this handoff | Role | License | Project |
| --- | ---: | --- | --- | --- |
| Electron | 44.0.0 | Desktop application runtime | MIT | <https://github.com/electron/electron> |
| electron-builder | 26.15.3 | Development and packaging tool | MIT | <https://github.com/electron-userland/electron-builder> |

Electron distributions include Chromium, Node.js, V8, and other third-party components. Their notices are provided with the Electron distribution, including Electron's `LICENSE` and `LICENSES.chromium.html` files. electron-builder is a build-time tool and is not intended to be part of the application runtime.

The exact resolved dependency graph is recorded in `package-lock.json`. License files installed under `node_modules` are the authoritative copies for a local dependency installation. Before distributing a build, the maintainer should verify the resolved dependency licenses and preserve all notices included by Electron and the packager.

## External prerequisite

Nodebraid invokes a Git executable already installed and configured by the user. Git is not bundled with Nodebraid. Git is distributed by its own maintainers under the GNU General Public License, version 2; see <https://git-scm.com/about/free-and-open-source> and the license materials included with the user's Git installation.

## Nodebraid license status

No public-source license has been selected for Nodebraid itself. Nothing in this file grants rights to Nodebraid code or artwork. The repository owner must make an explicit licensing decision before public distribution.
