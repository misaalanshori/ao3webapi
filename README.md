# Archive of our Own Web API
AO3 does not have an API (Though it is on the road map), so this is a web API that scrapes the website and creates a simple web API.

## Implemented Functions
Functions that have been implemented

### - /works/:id
- **:id -> ID of the work**

Returns a JSON with all the information of the work

### - /works/:id/download/:type
- **:id -> ID of the work**
- **:type -> Filetype for the document (AZW3, EPUB, MOBI, PDF, HTML)**

Returns a document file for the requested work