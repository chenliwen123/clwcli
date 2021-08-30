#!/usr/bin/env node


var shell = require("shelljs");

console.log(shell.exec("git rev-parse --abbrev-ref HEAD").stdout)