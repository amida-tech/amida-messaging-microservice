# Changelog

## [Unreleased]
### Changed
- PG connection will now fail (and this service will abort) if `MESSAGING_SERVICE_PG_SSL_ENABLED=true` but `MESSAGING_SERVICE_PG_CA_CERT` is not set to a valid value.

## [2.5.1] -- 2019-05-14
### Fixed
- Patch for CVE-2019-5021 in `Dockerfile`. `node:8.16.0-alpine` uses a patched version of `alpine`.


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
