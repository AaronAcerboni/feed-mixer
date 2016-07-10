module.exports = {
    configTimeToMs: function (t) {
        let a = t.split(':');
        let seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
        return seconds * 1000;
    }
}