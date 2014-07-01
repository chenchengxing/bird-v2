exports.Expires = {

    fileMatch: /^(gif|png|jpg|js|css|html)$/ig,

    maxAge: 60 * 60 * 24 * 365

};
exports.Compress = {

    match: /css|js|html/ig

};
exports.Default = {

    file: "index.html"

};