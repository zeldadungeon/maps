export const params = (() => {
    const vars: { [key: string]: string } = {};
    const hashes = window.location.href.slice(window.location.href.indexOf("?") + 1).split("&");
    hashes.forEach(h => {
        const hash = h.split("=");
        vars[hash[0]] = decodeURI(hash[1]);
    });

    return vars;
})();