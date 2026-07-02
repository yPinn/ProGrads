# Changelog

## 0.1.0 (2026-07-02)


### Features

* admission model + admissions content pipeline + mupdf renderer ([#26](https://github.com/yPinn/ProGrads/issues/26)) ([3d55970](https://github.com/yPinn/ProGrads/commit/3d55970b3a485cda66cbedda33e02d6f11769662))
* admissions content pipeline + /schedules & /admissions reshape ([#32](https://github.com/yPinn/ProGrads/issues/32)) ([01e9fbf](https://github.com/yPinn/ProGrads/commit/01e9fbf5d4aa9715f06fe7531da3950ff980f17f))
* **api:** add taxonomy, schools & exams read API ([#20](https://github.com/yPinn/ProGrads/issues/20)) ([350e10d](https://github.com/yPinn/ProGrads/commit/350e10d5d9adde6e644182c86ae5ecf3681edcc4))
* **api:** admissions & schedules API + exam decoupling ([3139e65](https://github.com/yPinn/ProGrads/commit/3139e65b25a6d371fa4eb522cff7365120b02ade))
* **api:** harden bootstrap (api/v1, swagger, pino, helmet, zod, env) ([#19](https://github.com/yPinn/ProGrads/issues/19)) ([08ce9b9](https://github.com/yPinn/ProGrads/commit/08ce9b93e706d92eb3f009227fab6e2e09705734))
* **api:** wire Prisma via pg driver adapter ([#16](https://github.com/yPinn/ProGrads/issues/16)) ([7ed078c](https://github.com/yPinn/ProGrads/commit/7ed078c9e631f17475a254cc59654708dce16b45))
* content-sync prune + api env hardening + web MDC migration ([#37](https://github.com/yPinn/ProGrads/issues/37)) ([e698699](https://github.com/yPinn/ProGrads/commit/e6986990f318c6750b386961cad69e475035564d))
* **content-sync,api:** add MC support and require CONTENT_DIR ([9c03f7c](https://github.com/yPinn/ProGrads/commit/9c03f7ca8e7825c3a4f25713c4c001b511b1af47))
* **content:** offline validate-admissions contract check ([#41](https://github.com/yPinn/ProGrads/issues/41)) ([317ab38](https://github.com/yPinn/ProGrads/commit/317ab384a3f232d215cb247b9be179f5df3b6d1e))
* **db:** add Prisma 7 ER schema (taxonomy, questions, admissions) ([#8](https://github.com/yPinn/ProGrads/issues/8)) ([0c186b3](https://github.com/yPinn/ProGrads/commit/0c186b3c8d06da5d62d78446308baf1f5b790066))
* **db:** add 商管/數理 subjects to the taxonomy seed ([7d7ab9c](https://github.com/yPinn/ProGrads/commit/7d7ab9cb0b350d3b3590ce7d224f2d8ef05d3504))
* **db:** canonical EE exam subjects for NCHU EECS prospectus ([#27](https://github.com/yPinn/ProGrads/issues/27)) ([90437e6](https://github.com/yPinn/ProGrads/commit/90437e63580ef05f6624825511b4ffee2fca7439))
* **db:** seed 四大 management-college departments (faculty axis) ([46f9ee1](https://github.com/yPinn/ProGrads/commit/46f9ee19e35a3f998983169f6114d6bf6890d6a9))
* editorial UI redesign + searchable filters + school ordering ([#36](https://github.com/yPinn/ProGrads/issues/36)) ([c4c8b32](https://github.com/yPinn/ProGrads/commit/c4c8b32281f9793e0f8c44f2972bf3bebec11f36))
* **faculty:** faculty roster vertical (data → pipeline → API → web) ([#59](https://github.com/yPinn/ProGrads/issues/59)) ([5529af8](https://github.com/yPinn/ProGrads/commit/5529af8456c8fc2a3a23dd0898dfb24c27a21460))
* **faculty:** rank roster by academic title + track (所別) cross-school browse ([6653961](https://github.com/yPinn/ProGrads/commit/665396187608e055a6c154808299877d74d5ae2e))
* paper-unit 題庫 view + MDC/KaTeX rendering + 題組 passage ([#34](https://github.com/yPinn/ProGrads/issues/34)) ([ab69dc2](https://github.com/yPinn/ProGrads/commit/ab69dc2a3fbf135dfb03ec1a5ca633646442f60e))
* per-question points + PDF crop helper + exam-solvers package ([#35](https://github.com/yPinn/ProGrads/issues/35)) ([489f4d2](https://github.com/yPinn/ProGrads/commit/489f4d29711f6453c6d827bb70dd85fab48cdba8))
* questions read API and content-sync pipeline ([#21](https://github.com/yPinn/ProGrads/issues/21)) ([23a6a44](https://github.com/yPinn/ProGrads/commit/23a6a44ff414f3edfb511b43cd431311cc886bf9))
* review weight, NCCU departments, schedule phases, theme toggle ([#38](https://github.com/yPinn/ProGrads/issues/38)) ([7038aa3](https://github.com/yPinn/ProGrads/commit/7038aa344875bbab1187294c65cc851b24d47e79))
* **shared:** add Zod domain enums (single source of truth) ([#18](https://github.com/yPinn/ProGrads/issues/18)) ([9b30288](https://github.com/yPinn/ProGrads/commit/9b3028881fcd56fa752b1c6c4c10d26d1b793243))
* **tools:** add pdf-extract and ai-pipeline packages ([fe94859](https://github.com/yPinn/ProGrads/commit/fe94859d24145104c72e0261ecfcc4c6ef436e6e))
* **web:** apply Homer theme; split css into token/semantic/base/component layers ([4fd7ca2](https://github.com/yPinn/ProGrads/commit/4fd7ca22a2d1ced639d7f2941d8cd6ab12c5c80a))
* **web:** CSS load perf + design tokens (DTCG → Figma) ([#44](https://github.com/yPinn/ProGrads/issues/44)) ([ad470be](https://github.com/yPinn/ProGrads/commit/ad470be3177e4c13518627bd590771229c80469c))
* **web:** data layer + schedules/questions/admissions browsing pages ([#33](https://github.com/yPinn/ProGrads/issues/33)) ([4980220](https://github.com/yPinn/ProGrads/commit/4980220291b84452a1a677d67431b357bdab9254))
* **web:** design-system pipeline (DESIGN.md) + AA contrast tuning ([d3460d2](https://github.com/yPinn/ProGrads/commit/d3460d2b79cb17060554bcb21778961afcd761e0))
* **web:** design-token system + test/tooling consolidation ([#40](https://github.com/yPinn/ProGrads/issues/40)) ([3e3ca96](https://github.com/yPinn/ProGrads/commit/3e3ca96da648d0cb0b5bd92140d1e2dc5e8989ea))
* **web:** dev-only /styleguide component showcase ([515798e](https://github.com/yPinn/ProGrads/commit/515798e1d066e5dc1f6c0440e5fa7688e3db2c0e))
* **web:** Homer-themed Schedule-X calendar + multi-view ([c3c4ce6](https://github.com/yPinn/ProGrads/commit/c3c4ce60716e4c043ae7f9aa5160eaec0ffb84e1))
* **web:** interactive /styleguide — states, toast, prose samples ([692403f](https://github.com/yPinn/ProGrads/commit/692403fb140688d4e1865f125959e7429ba310db))
* **web:** page motion system + Schedule-X month calendar ([#43](https://github.com/yPinn/ProGrads/issues/43)) ([71be0bf](https://github.com/yPinn/ProGrads/commit/71be0bf025bef26207d1157c4b01a5632950f2a3))
* **web:** QueryState unifies page data states + a11y + refetch toast ([02387bd](https://github.com/yPinn/ProGrads/commit/02387bd764bc99593b430f989e916f7ba4793a31))
* **web:** themed MDC content — typography, Shiki code, board surface ([36f4412](https://github.com/yPinn/ProGrads/commit/36f4412434af17d534d6415e0b0db66dbb525a60))


### Bug Fixes

* **deps:** re-pin zod to v3 and ignore zod major (D13) ([#17](https://github.com/yPinn/ProGrads/issues/17)) ([583889e](https://github.com/yPinn/ProGrads/commit/583889e438c17ff643837632e30e5c60f94ec93f))
* question type filtering, content-sync explanations, and MDC dev highlighting ([#56](https://github.com/yPinn/ProGrads/issues/56)) ([cd83f22](https://github.com/yPinn/ProGrads/commit/cd83f229edf893c145c6adfa99cf97617c7b094d))
* **web:** address review — link safety, scrollbar scope, year-tab a11y ([70113f9](https://github.com/yPinn/ProGrads/commit/70113f94f860af466a65d4a23c67aa1cf47f9a43))
* **web:** status-colour text contrast + skeleton visibility + reading width ([7d60f3f](https://github.com/yPinn/ProGrads/commit/7d60f3f0fc2c27c0ac17bf33911838cd32a7ca78))
