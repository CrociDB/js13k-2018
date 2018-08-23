const fs = require("fs");
const path = require("path");

const cheerio = require("cheerio");
const uglify = require("uglify-es");
const cleancss = require("clean-css");
const html_minify = require("html-minifier").minify;

const dir = "./build";

const processFile = (file) => {
    createFolder(dir);

    let newfile = file.split("/").slice(-1)[0];

    const workingDir = path.dirname(file);
    const f = fs.readFileSync(file);
    const $ = cheerio.load(f.toString());

    // Get CSS
    const linkTag = $("link");
    const cssFile = linkTag.attr("href");
    let cssContent = fs.readFileSync(path.join(workingDir, cssFile)).toString();
    cssContent = new cleancss({}).minify(cssContent).styles;
    const styleTag = $("<style>" + cssContent + "</style>");
    $(linkTag).replaceWith(styleTag);

    // Get JS
    const scriptTags = $("script");
    let scripts = "";

    scriptTags.each((i, e) => {
            const jsFile = e.attribs.src;
            const jsContent = fs.readFileSync(path.join(workingDir, jsFile)).toString();
            scripts += uglify.minify(jsContent).code;
    });

    scriptTags.remove();

    scripts = "<script>" + scripts + "</script>";
    let newScriptTag = $(scripts);
    $("body").append(newScriptTag);

    // Minify HTML
    let html = html_minify($.html(), {
        removeAttributeQuotes: true,
        collapseWhitespace: true,
        removeComments: true
    });

    // Finally!
    fs.writeFileSync(dir + "/" + newfile, html);
};

const createFolder = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
};

if (process.argv.length < 3) {
    console.log("Oops, tell which file you want to minify things.");
} else {
    for (i = 2; i < process.argv.length; i++)
    {
        processFile(process.argv[i]);
    }
}