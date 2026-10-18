import axios from "axios";

// The lab has no access to live data or persistence, including imports from pages.
axios.defaults.adapter = async () => { throw new Error("Live HTTP is disabled in the prototype lab"); };
window.fetch = async () => { throw new Error("Live fetch is disabled in the prototype lab"); };
XMLHttpRequest.prototype.open = () => { throw new Error("Live XHR is disabled in the prototype lab"); };
