# Digibuzzer source, attribution, and licenses

This repository contains a Vortex-compatible modified version of Digibuzzer.
The modifications were prepared on 18 July 2026 and add the Vortex hosted SDK
adapter, same-origin managed-hosting support, deployment metadata, health and
legal endpoints, and deployment verification tests.

## Corresponding source

- Modified source: <https://github.com/Hannibal420King/digibuzzer/tree/vortex-v2>
- Original upstream: <https://codeberg.org/ladigitale/digibuzzer>
- Upstream author: Emmanuel ZIMMERT / La Digitale

The application source is licensed under the GNU Affero General Public License,
version 3. The complete license text remains at `/LICENSE` in the repository and
is also served by the running application at `/legal/license`. The application
provides a visible `/legal/source` page so network users can reach the exact
corresponding-source branch and the retained notices.

## Font exceptions retained

The upstream README identifies these font-specific exceptions, which are not
relicensed by the Vortex changes:

| Files | License | License reference |
| --- | --- | --- |
| `public/fonts/Roboto-Slab-Medium.woff2` | Apache License 2.0 | <https://www.apache.org/licenses/LICENSE-2.0> |
| `public/fonts/MaterialIcons-Regular.woff2` | Apache License 2.0 | <https://www.apache.org/licenses/LICENSE-2.0> |
| `public/fonts/MonaSansExpanded-Black.woff2` | SIL Open Font License 1.1 | <https://openfontlicense.org/open-font-license-official-text/> |

The original README and all existing copyright, attribution, warranty, and
license notices remain part of the source and production image.
