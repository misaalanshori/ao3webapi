# Archive of our Own Web API
AO3 does not have an API (Though it is on the road map), so this is a web API that scrapes the website and creates a simple web API.

## Implemented Functions
Functions that have been implemented

### - /works/:id
- **:id -> ID of the work**

Returns a JSON with all the information of the work

#### Example Usage
- http://localhost:3000/works/26301859
- http://localhost:3000/works/25830331

---

### - /works/:id/download/:type
- **:id -> ID of the work**
- **:type -> Filetype for the document (AZW3, EPUB, MOBI, PDF, HTML)**

Returns a document file for the requested work

#### Example Usage
- http://localhost:3000/works/26301859/download/pdf
- http://localhost:3000/works/25830331/download/mobi

---

### - /feed/:path/:page
- **:path -> url encoded path and search parameters**
- **:page -> page number**

Returns the full URL, page count, and a list of works in the current page
Examples of the paths are:
- collections/the_owl_house/works
- series/2149602
- users/EleenaDume/pseuds/EleenaDume/works
- tags/The%20Owl%20House%20(Cartoon)/works
- tags/Amity%20Blight*s*Luz%20Noceda/works
- works?commit=Sort+and+Filter&work_search%5Bsort_column%5D=kudos_count&tag_id=Amity+Blight*s*Luz+Noceda
The path needs to be url encoded

#### Example Usage
- http://localhost:3000/feed/collections%2Fthe_owl_house%2Fworks/1
- http://localhost:3000/feed/series%2F2149602/1
- http://localhost:3000/feed/users%2FEleenaDume%2Fpseuds%2FEleenaDume%2Fworks/1
- http://localhost:3000/feed/tags%2FThe%2520Owl%2520House%2520%28Cartoon%29%2Fworks/2
- http://localhost:3000/feed/tags%2FAmity%2520Blight%2As%2ALuz%2520Noceda%2Fworks/3
- http://localhost:3000/feed/works%3Fcommit%3DSort%2Band%2BFilter%26work_search%255Bsort_column%255D%3Dkudos_count%26tag_id%3DAmity%2BBlight%2As%2ALuz%2BNoceda/1