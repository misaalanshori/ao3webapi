import express from 'express'
import cors from 'cors'
import { parse } from 'node-html-parser'
import fetch from 'node-fetch'

const ao3url = "https://archiveofourown.org/"
const ao3downurl = "https://download.archiveofourown.org/"

const app = express()
const port = process.env.PORT || 3000

const fetchOpt = {
    headers: {
        cookie: 'view_adult=true'
    }
};

app.use(cors())

app.get('/', (req, res) => {
    res.send(`
Usage: </br>
/works/:id </br>
/works/:id/download/:type </br>
/feed/:path/:page </br>
`)})

// Get download links for document files
function getDownloadLinks(id) {
    fetch(`${ao3url}works/${req.params.id}?view_adult=true`).then(async resp => {
        if (resp.status != 200) {
            return null
        } else {
            let html = parse(await resp.text())
            let links = {}
            html.querySelectorAll("li.download > ul.expandable.secondary > li").forEach(e => {
                links[e.textContent.toLowerCase()] = e.childNodes[0].attributes.href
            })
            return links
        }
    })
}

// Parses "li.work.blurb.group" elements
function parseWorkItem(element) {
    let values = {
        id: element.attributes.id.split("_")[1],
        title: element.querySelector("h4.heading > a").textContent.trim(),
        href: element.querySelector("h4.heading > a").attributes.href,
        author: element.querySelectorAll('h4.heading > a[rel~="author"]').map(e => {return {text: e.textContent.trim(), href: e.attributes.href}}),
        symbols: element.querySelectorAll("a.help.symbol.question > span").map(e => e.classNames),
        tags: {}
    }
    element.querySelectorAll("ul.tags.commas > li").forEach(e => {
        let content = e.querySelector("a.tag")
        let type = e.classList.values().next().value
        if (!values.tags[type]) {
            values.tags[type] = []
        }
        values.tags[type].push({
            text: content.textContent.trim(),
            href: content.attributes.href
        })
    })
    let series = element.querySelector("ul.series")
    if (series) {
        values["series"] = {
            name: series.querySelector("li > a").textContent.trim(),
            href: series.querySelector("li > a").attributes.href,
            part: series.querySelector("li > strong").textContent.trim(),
        }
    }
    let summary = element.querySelector("blockquote.userstuff.summary")
    if (summary) {
        values["summary"] = summary.structuredText.trim()
    }
    return values
}

// Get Work Information
app.get("/works/:id",  (req, res) => {
    // - :id -> ID of the work
    // Returns a JSON with all the information of the work
    fetch(`${ao3url}works/${req.params.id}?view_adult=true`, fetchOpt).then(async resp => {
        if (resp.status != 200) {
            res.sendStatus(404)
        } else {
            resp.text().then(htxt => {
                let html = parse(htxt)
                let metadata = {}
                metadata["id"] = req.params.id
                metadata["title"] = html.querySelector("h2.title.heading").textContent.trim()
                metadata["author"] = html.querySelectorAll("h3.byline.heading > a").map(e => {return {"text": e.textContent, "href": e.attributes.href}})
                let summary = html.querySelector("div.summary.module > blockquote.userstuff")
                if (summary) {
                    metadata["summary"] = summary.structuredText.trim()
                }
                metadata["tags"] = {}
                html.querySelectorAll("dl.work.meta.group > dd.tags").forEach(e => {
                    metadata["tags"][e.classNames.split(" ")[0]] = e.querySelectorAll("ul > li > a").map(e => {return {text: e.textContent.trim(), href: e.attributes.href}})
                })
                html.querySelectorAll("dl.work.meta.group > dd:not(.tags)").forEach(val => {
                    let metaKey = val.classNames.split(" ")[0]
                    if (metaKey == "language") {
                        metadata[metaKey] = val.textContent.trim()
                    } else if (metaKey == "collections") {
                        metadata[metaKey] = val.querySelectorAll("a").map(e => {return {"text": e.textContent, "href": e.attributes.href}})
                    } else if (metaKey == "stats") {
                        let statscontent = val.querySelectorAll("dl.stats > dd")
                        let stats = {}
                        statscontent.forEach((v, i) => {
                            stats[v.classNames] = statscontent[i].textContent.trim()
                        })
                        metadata[metaKey] = stats
                    } else if (metaKey == "series") {
                        metadata[metaKey] = {
                            name: val.querySelector("span.position > a").textContent.trim(),
                            href: val.querySelector("span.position > a").attributes.href,
                            prev: val.querySelector("a.previous") ? val.querySelector("a.previous").attributes.href : "",
                            next: val.querySelector("a.next") ? val.querySelector("a.next").attributes.href : "",
                            pos: val.querySelector("span.position").text.match(/\d+/)[0]
                        }
                    } else {
                        metadata[metaKey] = val.childNodes.map(e => e.textContent.trim())
                    }
                })
                res.json(metadata)
            
        
            })
            
            
    }})
})

// Download Document Files for a Work
app.get("/works/:id/download/:type", (req, res) => {
    // - :id -> ID of the work
    // - :type -> Filetype for the document (AZW3, EPUB, MOBI, PDF, HTML)
    // Returns a document file for the requested work
    fetch(`${ao3url}works/${req.params.id}?view_adult=true`).then(async resp => {
        if (resp.status != 200) {
            res.sendStatus(404)
        } else {
            let html = parse(await resp.text())
            let link = html.querySelectorAll("li.download > ul.expandable.secondary > li")
            .find(e => e.textContent.toLowerCase() == req.params.type.toLowerCase())
            if (link) {
                    let href = link.childNodes[0].attributes.href
                    fetch(ao3downurl + href).then(resp => {
                        res.set({
                            'content-disposition' : `attachment; filename="${href.split("/").pop().split("?")[0]}"`,
                            'content-type': resp.headers.get('content-type'),
                        })
                        resp.body.pipe(res)
                    })
            } else {
                res.sendStatus(404)
            }   
        }
        
    })
})

// Get list of works from a path
app.get("/feed/:path/:page", (req, res) => {
    // - :url -> url encoded path and search parameters
    // - :page -> page number
    // Returns full URL, page count, and a list of works in the current page
    let aourl = new URL(`${ao3url}${req.params.path}`)
    aourl.searchParams.set("page", req.params.page)
    fetch(aourl.href).then(async resp => {
        if (resp.status != 200) {
            res.sendStatus(404)
        } else {
            let html = parse(await resp.text())
            let workslist = html.querySelectorAll("li.work.blurb.group")
            let workspage = html.querySelectorAll("ol.pagination.actions > li")
            let results = {
                href: aourl.href,
                pages: 0,
                works: []
            }
            if (workslist) {
                if (workspage.length > 3) {
                    results.pages = workspage[workspage.length-2].textContent.trim()
                } else {
                    results.pages = 1
                }
                workslist.forEach(element => {
                    results.works.push(parseWorkItem(element))
                });
                res.json(results)
            } else {
                res.sendStatus(404)
            }
        }
    })
})

app.listen(port, () => {
    console.log(`The app listening on port ${port}`)
})