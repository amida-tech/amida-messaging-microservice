# Changelog

## [Unreleased]
### Added
- Prepush githook for `yarn lint` and `yarn test` with `npm:husky`

### Changed
- `yarn test` command changed to _only_ run tests
  * `yarn test` now runs without auth service
  * `yarn jenkins` includes DB creation, migrations, etc.
- Update `package.json:engines`
- Update `docker-compose.yml` including postgres 9.4.11 --> 9.6


## [2.5.0] -- 2018-12-12
### Added
- [ORANGE-910] Create users on messaging at signup
- [ORANGE-481] UUID/Serialized Identifier Support
- Consolidated logging with `npm:winston-json-formatter`.

### Changed
- [DEVOPS-365] Slimmer Dockerfile settings
- Jenkins tests now use `.env.test`.

### Fixed
- Broken tests.
