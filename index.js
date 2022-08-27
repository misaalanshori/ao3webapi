import express from 'express'
import cors from 'cors'
import { parse } from 'node-html-parser'
import { fetchBuilder, MemoryCache } from 'node-fetch-cache';
const fetch = fetchBuilder.withCache(new MemoryCache({ttl: 60000}));

const app = express()
const port = process.env.PORT || 3000
app.use(cors())

app.get('/', (req, res) => {
    res.send('Usage: \n<br/> /works/:id \n<br/> /works/:id/download/:type')
})

// Get Work Information
app.get("/works/:id",  (req, res) => {
    fetch(`https://archiveofourown.org/works/${req.params.id}?view_adult=true`).then(async resp => {
        if (resp.status != 200) {
            res.sendStatus("404")
        } else {
            let html = parse(await resp.text())
            let infokey = html.querySelectorAll("dl.work.meta.group > dt")
            let infocontent = html.querySelectorAll("dl.work.meta.group > dd")
            let metadata = {}
            metadata["Title"] = html.querySelector("h2.title.heading").textContent.trim()
            metadata["Author"] = html.querySelectorAll("h3.byline.heading > a").map(e => {return {"text": e.textContent, "href": e.attributes.href}})
            metadata["Summary"] = html.querySelector("div.summary.module > blockquote.userstuff").textContent.trim()
            infokey.forEach((val, index) => {
                let metaKey = val.textContent.trim().slice(0, -1)
                if (metaKey == "Language") {
                    metadata[metaKey] = infocontent[index].textContent.trim()
                } else if (metaKey == "Collections") {
                    metadata[metaKey] = infocontent[index].querySelectorAll("a").map(e => {return {"text": e.textContent, "href": e.attributes.href}})
                } else if (metaKey == "Stats") {
                    let statskey = html.querySelectorAll("dl.stats > dt")
                    let statscontent = html.querySelectorAll("dl.stats > dd")
                    let stats = {}
                    statskey.forEach((v, i) => {
                        stats[v.textContent.trim().slice(0, -1)] = statscontent[i].textContent.trim()
                    })
                    metadata[metaKey] = stats
                } else if (metaKey == "Series") {
                    metadata[metaKey] = {
                        name: infocontent[index].querySelector("span.position > a").textContent.trim(),
                        href: infocontent[index].querySelector("span.position > a").attributes.href,
                        prev: infocontent[index].querySelector("a.previous") ? infocontent[index].querySelector("a.previous").attributes.href : "",
                        next: infocontent[index].querySelector("a.next") ? infocontent[index].querySelector("a.next").attributes.href : "",
                        pos: infocontent[index].querySelector("span.position").text.match(/\d+/)[0]
                    }
                } else {
                    metadata[metaKey] = infocontent[index].querySelectorAll("li").map(e => {return {"text": e.textContent, "href": e.childNodes[0].attributes.href}})
                }
            })
            res.json(metadata)
        }
        
    })
})

app.get("/works/:id/download/:type", (req, res) => {
    let itype = req.params.type.toLowerCase()
    fetch(`https://archiveofourown.org/works/${req.params.id}?view_adult=true`).then(async resp => {
        if (resp.status != 200) {
            res.sendStatus("404")
        } else {
            let html = parse(await resp.text())
            let links = {}
            html.querySelectorAll("li.download > ul.expandable.secondary > li").forEach(e => {
                links[e.textContent.toLowerCase()] = e.childNodes[0].attributes.href
            })
            if (Object.keys(links).includes(itype)) {
                fetch("https://download.archiveofourown.org" + links[itype]).then(resp => {
                    res.set("Content-Disposition", `attachment; filename="${links[itype].split("/").pop().split("?")[0]}"`)
                    resp.body.pipe(res)
                })
            } else {
                res.sendStatus("404")
            }
        }
        
    })
})



app.listen(port, () => {
    console.log(`The app listening on port ${port}`)
})