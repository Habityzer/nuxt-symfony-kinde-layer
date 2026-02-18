## [2.2.2](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.2.1...v2.2.2) (2026-02-18)


### Bug Fixes

* Enhance Kinde authentication configuration and type safety ([ee59fc4](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/ee59fc4d97832f9effcedb613c9c57773cee3d80))
* Update pnpm lockfile to use published @habityzer/nuxt-kinde-auth package ([39e9f2c](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/39e9f2c19ffa5f731cef610bd219dc3f4ba90bf5))

## [2.2.1](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.2.0...v2.2.1) (2026-02-13)

# [2.2.0](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.1.4...v2.2.0) (2026-02-13)


### Features

* Enhance Kinde authentication configuration and middleware handling ([d8b722a](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/d8b722a8ba5a126f02c31aea0347fa3e21bb29b9))
* Refactor Kinde authentication configuration and enhance middleware setup ([c577a2a](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/c577a2a047299f30cb745a91aac82b50c2bfedb1))

## [2.1.4](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.1.3...v2.1.4) (2026-01-01)


### Bug Fixes

* Add Nuxt prepare step to CI and correct ESLint config import path ([07471f5](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/07471f5234e1322a2ccfe5709cb8109badededda))
* Remove invalid pnpm-workspace.yaml for single package ([7e7d6a1](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/7e7d6a19ffd2edccfee80b944c947c364b6b2863))

## [2.1.3](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.1.2...v2.1.3) (2026-01-01)


### Bug Fixes

* Update Kinde configuration to use environment variables and enhance Symfony proxy request handling ([3e0d0bd](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/3e0d0bd09ea26a21940f0a0d16cc9aaf5a327be8))

## [2.1.2](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.1.1...v2.1.2) (2025-12-26)


### Bug Fixes

* Disable automatic retries in Symfony proxy request handling ([db4bb86](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/db4bb86bb993f203f64ae0cee5f6b5987e87bfec))

## [2.1.1](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.1.0...v2.1.1) (2025-12-12)


### Bug Fixes

* Clean up and standardize code formatting in Symfony proxy ([1c061e8](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/1c061e87842682d16ab3fe14ace5cef3aa2585c4))

# [2.1.0](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v2.0.0...v2.1.0) (2025-12-12)


### Features

* Implement public route handling in Symfony proxy to skip authentication ([1e52eff](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/1e52eff2c7ca7cbfb25e59fcde378e4bf9347c4d))

# [2.0.0](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v1.0.1...v2.0.0) (2025-12-03)


* feat!: Update Symfony proxy authorization header to require kinde_ prefix ([c9692d1](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/c9692d173a90c389c466524532b0c81e28cbac83))


### Bug Fixes

* Configure semantic-release to properly handle breaking changes with feat! syntax ([380a862](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/380a862e6e7782e9346435501dc1f7d4662944cb))


### Features

* Enhance Symfony proxy with Kinde token logging and update authorization header format! ([134f078](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/134f0780a445a6893499833b675412b31d44867f))


### BREAKING CHANGES

* The Symfony backend now expects the authorization token to be prefixed with 'kinde_'. All API calls will now send 'Authorization: Bearer kinde_<token>' instead of 'Authorization: Bearer <token>'. This requires backend API to be updated to handle the new token format.

## [1.0.1](https://github.com/Habityzer/nuxt-symfony-kinde-layer/compare/v1.0.0...v1.0.1) (2025-10-17)


### Bug Fixes

* Remove add @semantic-release/npm to package.json and pnpm-lock.yaml ([b167dfb](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/b167dfb7b0e59605bbc63a6bf5b2dae58ce8c2a4))

# 1.0.0 (2025-10-17)


### Features

* Update semantic-release to version 24.2.9 and add it to package.json for improved release management ([76270ec](https://github.com/Habityzer/nuxt-symfony-kinde-layer/commit/76270ecc4f42276cf9d0547095bf75988c196441))
