# Release Notes

## 0.3.0
- Bulk upload: a network failure now reports the entry as failed and carries on with the next one instead of hanging
- Bulk upload: stopping the upload or closing the modal no longer submits the entries still waiting or shows stale results in the next run
- Bulk upload: fixed the parent form lookup when the uploaded form is the first in the hierarchy
- Entries table: an entry with no answer for a question no longer breaks the table
- Navigation: fixed the child and parent form bounds checks; the first and last form no longer throw
- Entries table: deleting before the first page has loaded no longer throws
- Removed the unused ButtonImport and ModalStartDate components and their styles
- Tests: 432 tests across 28 suites, covering the bulk upload network failure and the stopped upload handling
- Docs: recorded the legacy known issues as the Vue porting contract
## 0.2.0
- Build: upgraded axios, lodash, moment and url-parse to clear the reported security advisories
- Tests: added a test coverage pass for the Redux state, the actions and the entries display pipeline
- Docs: added the legacy known defects list, as a porting checklist for the Vue rewrite
## 0.1.9
- Bulk upload: reject files with duplicate headers, trim CSV headers and stop on duplicate UUIDs
- Bulk upload: fixed location jumps and time answers when the answer is empty
- Tests: fixed the media and filter controls suites; the full Jest suite is green again
## 0.1.8
- Added API key support for CARTO tile providers and updated tile layer subdomains
- Download checks for the local environment before running
## 0.1.7
- Removed the pink background from the date picker
## 0.1.6
- Replaced Mapbox tiles with free alternatives and updated tile layer attributions
## 0.1.5
- Added timestamp versioning to media URLs so edited files are not served from cache
- Added the version in the logo url query string for caching
## 0.1.4
- Added the version in the logo url query string for caching
## 0.1.3
- Added loading state, error handling and a pagination control to the entries table
## 0.1.2
- Updated Node.js requirement to 18; added .nvmrc, and example copy-to-server script
- Modernized build/dev workflow: 
- Reworked media popup rendering for consistent loader, not-found and media handling
- Increased bulk upload delay
## 0.1.0
- Updated deletion route (single entry deletion)
## 0.0.9
- Using delete payload instead of archive payload as it is a real deletion
## 0.0.8
- Fixed issue with branch counts being undefined
- Using deletion endpoint to delete entries
## 0.0.7
- Fixed issue with entry drawer being hidden as reported here t.ly/l82VO
## 0.0.6
- Fixed timeline getting disabled when dates were equal
## 0.0.5
 - Fixed issue with audio and video playback caching files (after editing, old file still played until browser cache is cleared)
## 0.0.4
- Dropping entry_sidebar image in favor of entry_original
- Fixed lightbox issues
## 0.0.3
 - Fix for issue reported here https://community.epicollect.net/t/view-data-not-loading-in-epicollect-website/471
## 0.0.2
- Using ESRI for satellite imagery
