/* eslint-disable @typescript-eslint/no-require-imports */
const React = require("react");

function Image({ src, alt, fill, sizes, priority, ...props }) {
  return React.createElement("img", { src, alt, ...props });
}

module.exports = Image;
module.exports.default = Image;
